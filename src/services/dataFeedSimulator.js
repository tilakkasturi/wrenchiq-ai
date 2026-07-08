/**
 * dataFeedSimulator — stand-in for a real shop's periodic SMS/DMS data feed.
 *
 * Per the Data Feed Model, WrenchIQ observes the shop's SMS/DMS via polled
 * snapshots, not live event triggers. This hook simulates that cadence: on
 * every interval tick it picks a random repair order that hasn't reached the
 * end of the board yet and advances it one Kanban column, stamping a
 * lastUpdated timestamp so consumers can show "just updated" affordances.
 *
 * Usage:
 *   const [ros, setRos] = useDataFeedSimulator(BOARD_ROS);
 */

import { useEffect, useRef, useState } from "react";

const COLUMN_SEQUENCE = ["queue", "diagnosing", "approval", "pickup"];

function nextColumn(column) {
  const idx = COLUMN_SEQUENCE.indexOf(column);
  if (idx === -1 || idx === COLUMN_SEQUENCE.length - 1) return null; // already at pickup (or unknown) — no advance
  return COLUMN_SEQUENCE[idx + 1];
}

/**
 * @param {Array<object>} initialRos - seed list of repair orders (each with a `column` field)
 * @param {number} intervalMs - polling cadence, defaults to 25s
 * @returns {[Array<object>, Function]} [ros, setRos]
 */
export function useDataFeedSimulator(initialRos, intervalMs = 25000) {
  const [ros, setRos] = useState(initialRos);
  const rosRef = useRef(ros);
  rosRef.current = ros;

  useEffect(() => {
    const id = setInterval(() => {
      setRos(prev => {
        const advanceable = prev.filter(r => nextColumn(r.column) !== null);
        if (advanceable.length === 0) return prev; // whole board has reached pickup — nothing left to simulate

        const pick = advanceable[Math.floor(Math.random() * advanceable.length)];
        const now = Date.now();

        return prev.map(r =>
          r.roNum === pick.roNum
            ? { ...r, column: nextColumn(r.column), minAgo: 0, lastUpdated: now }
            : r
        );
      });
    }, intervalMs);

    return () => clearInterval(id);
  }, [intervalMs]);

  return [ros, setRos];
}
