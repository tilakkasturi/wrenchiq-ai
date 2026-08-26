/**
 * WrenchIQ — Customer Notes Routes
 *
 * Per-customer "remember this" notes, surfaced in the RO Chat tab so an
 * advisor never has to re-learn a customer's preferences visit to visit.
 * See customerNotesService.js.
 *
 * GET    /api/customer-notes?shopId=&customerId=
 * POST   /api/customer-notes         { shopId, customerId, customerName, note }
 * DELETE /api/customer-notes/:id
 */

import { Router } from 'express';
import { listCustomerNotes, addCustomerNote, deleteCustomerNote } from '../services/customerNotesService.js';

const router = Router();

router.get('/', async (req, res) => {
  const { shopId, customerId } = req.query;
  if (!customerId) return res.status(400).json({ error: 'customerId is required' });
  try {
    const notes = await listCustomerNotes(req.db, { shopId, customerId });
    res.json({ notes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { shopId, customerId, customerName, note } = req.body || {};
  if (!customerId || !note?.trim()) {
    return res.status(400).json({ error: 'customerId and note are required' });
  }
  try {
    const saved = await addCustomerNote(req.db, { shopId, customerId, customerName, note: note.trim() });
    res.json({ note: saved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await deleteCustomerNote(req.db, req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
