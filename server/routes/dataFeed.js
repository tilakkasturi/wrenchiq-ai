/**
 * WrenchIQ — Data Feed Routes
 *
 * Read-only endpoints over the shop's configured MongoDB datasource, per the
 * Data Feed Model (no live SMS trigger; default-to-most-recent-customer with
 * manual override via the Customer Selector).
 *
 * GET /api/data-feed/most-recent-customer?shopId=&edition=
 * GET /api/data-feed/customers?shopId=&edition=&limit=
 */

import { Router } from 'express';
import { getMostRecentCustomer, listActiveCustomers } from '../services/dataFeedService.js';

const router = Router();

router.get('/most-recent-customer', async (req, res) => {
  try {
    const { shopId, edition } = req.query;
    const record = await getMostRecentCustomer(req.db, { shopId, edition });

    if (!record) {
      return res.status(404).json({ found: false, message: 'No active customer found in the configured datasource' });
    }

    res.json({ found: true, data: record });
  } catch (err) {
    console.error('data-feed/most-recent-customer error:', err.message);
    res.status(500).json({ error: 'Failed to read most-recent customer from data feed' });
  }
});

router.get('/customers', async (req, res) => {
  try {
    const { shopId, edition } = req.query;
    const limit = Math.min(parseInt(req.query.limit, 10) || 25, 100);
    const data = await listActiveCustomers(req.db, { shopId, edition, limit });

    res.json({ count: data.length, data });
  } catch (err) {
    console.error('data-feed/customers error:', err.message);
    res.status(500).json({ error: 'Failed to read active customers from data feed' });
  }
});

export default router;
