import { Router } from 'express';

const router = Router();

router.post('/log', async (req, res) => {
  try {
    const { username, success, edition, persona } = req.body;
    const col = req.db.collection('LoginActivity');
    await col.insertOne({
      username:  username || '',
      success:   !!success,
      edition:   edition || 'am',
      persona:   persona || null,
      ip:        req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'] || '',
      ts:        new Date(),
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('Auth log error:', err.message);
    res.status(500).json({ ok: false });
  }
});

router.get('/activity', async (req, res) => {
  try {
    const col = req.db.collection('LoginActivity');
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const docs = await col.find().sort({ ts: -1 }).limit(limit).toArray();
    res.json(docs);
  } catch (err) {
    console.error('Auth activity error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
