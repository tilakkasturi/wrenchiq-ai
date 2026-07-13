// HierarchyAdminScreen — shop/district/region hierarchy CRUD (v2.0 spec §2a/3.2)
//
// Built over the real shops (cornerstone, ridgeline) rather than the
// synthetic 100-location demo dataset in MultiLocationScreen.jsx, so
// Strategic Priorities authored here actually change what the Sidecar's
// get_shop_objectives resolves for a real RO. A standalone single-scroll
// page (not AdminShell's tab rail) since a tree editor isn't tab-shaped —
// same pattern AM3CAdminScreen.jsx already uses.

import { useState, useEffect, useCallback } from "react";
import { Map, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { COLORS } from "../theme/colors";

const API_BASE = import.meta.env.VITE_API_BASE || "";

const TYPE_LABEL = { region: "Region", district: "District", shop: "Shop" };
const CHILD_TYPE = { region: "district", district: "shop" };

export default function HierarchyAdminScreen() {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingUnder, setAddingUnder] = useState(null); // parentId or 'root'
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/hierarchy`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed to load hierarchy"))))
      .then((data) => { setNodes(data); setError(null); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const roots = nodes.filter((n) => !n.parentId);
  const childrenOf = (id) => nodes.filter((n) => n.parentId === id);

  async function createNode(type, parentId, name) {
    if (!name.trim()) return;
    const id = `${type}-${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    const res = await fetch(`${API_BASE}/api/hierarchy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, type, name: name.trim(), parentId: parentId || null }),
    });
    if (res.ok) {
      setAddingUnder(null);
      setNewName("");
      load();
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Failed to create node");
    }
  }

  async function renameNode(id, name) {
    if (!name.trim()) return;
    const res = await fetch(`${API_BASE}/api/hierarchy/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (res.ok) {
      setEditingId(null);
      load();
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Failed to rename node");
    }
  }

  async function deleteNode(id) {
    if (!window.confirm("Delete this node?")) return;
    const res = await fetch(`${API_BASE}/api/hierarchy/${id}`, { method: "DELETE" });
    if (res.ok || res.status === 204) {
      load();
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Failed to delete node");
    }
  }

  function NodeRow({ node, depth }) {
    const isEditing = editingId === node.id;
    const childType = CHILD_TYPE[node.type];
    return (
      <div style={{ marginLeft: depth * 24 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 12px", borderRadius: 6,
          background: depth === 0 ? "#F8FAFC" : "#fff",
          border: `1px solid ${COLORS.border}`,
          marginBottom: 6,
        }}>
          <span style={{
            fontSize: 9, fontWeight: 700, borderRadius: 3, padding: "2px 6px",
            textTransform: "uppercase", letterSpacing: "0.04em", flexShrink: 0,
            background: node.type === "region" ? "#EDE9FE" : node.type === "district" ? "#DBEAFE" : "#DCFCE7",
            color: node.type === "region" ? "#7C3AED" : node.type === "district" ? "#2563EB" : "#059669",
          }}>
            {TYPE_LABEL[node.type]}
          </span>

          {isEditing ? (
            <>
              <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)}
                style={{ flex: 1, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: "4px 8px", fontSize: 13 }} />
              <button onClick={() => renameNode(node.id, editName)} title="Save" style={iconBtnStyle}><Check size={14} /></button>
              <button onClick={() => setEditingId(null)} title="Cancel" style={iconBtnStyle}><X size={14} /></button>
            </>
          ) : (
            <>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{node.name}</span>
              <span style={{ fontSize: 11, color: COLORS.textMuted, fontFamily: "monospace" }}>{node.id}</span>
              <button onClick={() => { setEditingId(node.id); setEditName(node.name); }} title="Rename" style={iconBtnStyle}><Pencil size={14} /></button>
              {childType && (
                <button onClick={() => { setAddingUnder(node.id); setNewName(""); }} title={`Add ${TYPE_LABEL[childType]}`} style={iconBtnStyle}><Plus size={14} /></button>
              )}
              <button onClick={() => deleteNode(node.id)} title="Delete" style={{ ...iconBtnStyle, color: COLORS.danger }}><Trash2 size={14} /></button>
            </>
          )}
        </div>

        {addingUnder === node.id && (
          <AddForm depth={depth + 1} onSubmit={(name) => createNode(childType, node.id, name)} onCancel={() => setAddingUnder(null)} />
        )}

        {childrenOf(node.id).map((child) => (
          <NodeRow key={child.id} node={child} depth={depth + 1} />
        ))}
      </div>
    );
  }

  function AddForm({ depth, onSubmit, onCancel }) {
    return (
      <div style={{ marginLeft: depth * 24, display: "flex", gap: 8, marginBottom: 6 }}>
        <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)}
          placeholder="Name…"
          style={{ flex: 1, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: "6px 10px", fontSize: 13 }} />
        <button onClick={() => onSubmit(newName)}
          style={{ background: COLORS.primary, color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          Add
        </button>
        <button onClick={onCancel}
          style={{ background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "6px 14px", fontSize: 12, cursor: "pointer" }}>
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{
        background: COLORS.primary, color: "#fff", padding: "0 24px", height: 60,
        display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
      }}>
        <Map size={18} style={{ opacity: 0.8 }} />
        <div style={{ fontWeight: 700, fontSize: 16 }}>Location Hierarchy</div>
        <div style={{
          background: COLORS.accent, color: "#fff", fontSize: 10, fontWeight: 800,
          letterSpacing: "0.08em", textTransform: "uppercase", borderRadius: 4, padding: "3px 8px",
        }}>
          Admin Only
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 24px" }}>
        <p style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 16, lineHeight: 1.5 }}>
          Region → district → shop hierarchy used to scope Strategic Priorities above the
          single-shop level. A priority set at district or region level applies to every
          shop underneath it — see the "Scope" selector on Settings' Strategic Priorities tab.
        </p>

        {error && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: COLORS.danger,
            borderRadius: 6, padding: "10px 14px", marginBottom: 16, fontSize: 13 }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ fontSize: 13, color: COLORS.textMuted }}>Loading…</div>
        ) : (
          <>
            {roots.map((node) => (
              <NodeRow key={node.id} node={node} depth={0} />
            ))}

            {addingUnder === "root" ? (
              <AddForm depth={0} onSubmit={(name) => createNode("region", null, name)} onCancel={() => setAddingUnder(null)} />
            ) : (
              <button onClick={() => { setAddingUnder("root"); setNewName(""); }}
                style={{
                  display: "flex", alignItems: "center", gap: 6, background: "transparent",
                  border: `1px dashed ${COLORS.border}`, borderRadius: 6, padding: "8px 14px",
                  fontSize: 13, color: COLORS.textSecondary, cursor: "pointer", marginTop: 8,
                }}>
                <Plus size={14} /> Add Region
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const iconBtnStyle = {
  background: "transparent", border: "none", cursor: "pointer",
  padding: 4, borderRadius: 4, display: "flex", alignItems: "center",
  color: COLORS.textSecondary,
};
