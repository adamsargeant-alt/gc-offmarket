const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAuth } = require('../middleware/auth');

const PROPERTY_TYPES = ['House', 'Unit', 'Townhouse', 'Villa', 'Land'];
const DURATION_DAYS = [3, 7, 14, 30];

function validate(body) {
  const { suburb_id, max_price, property_type, min_bedrooms, min_bathrooms } = body;
  if (!suburb_id) return 'Suburb is required';
  if (!max_price || max_price <= 0) return 'Max price is required';
  if (!PROPERTY_TYPES.includes(property_type)) return 'Invalid property type';
  if (min_bedrooms === undefined || min_bedrooms < 0) return 'Min bedrooms is required';
  if (min_bathrooms === undefined || min_bathrooms < 0) return 'Min bathrooms is required';
  return null;
}

// ─── MY buyers ──────────────────────────────────────────────────────
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT b.*, s.name AS suburb_name FROM buyers b
       JOIN suburbs s ON s.id = b.suburb_id
       WHERE b.agent_id = $1 AND b.expires_at > NOW() ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CREATE ─────────────────────────────────────────────────────────
router.post('/', requireAuth, async (req, res) => {
  const error = validate(req.body);
  if (error) return res.status(400).json({ error });

  const { suburb_id, max_price, property_type, min_bedrooms, min_bathrooms, notes, duration_days } = req.body;
  if (!DURATION_DAYS.includes(Number(duration_days))) return res.status(400).json({ error: 'Invalid duration' });

  try {
    const result = await db.query(
      `INSERT INTO buyers (agent_id, suburb_id, max_price, property_type, min_bedrooms, min_bathrooms, notes, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7, NOW() + ($8 || ' days')::INTERVAL) RETURNING *`,
      [req.user.id, suburb_id, max_price, property_type, min_bedrooms, min_bathrooms, notes || null, duration_days]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── UPDATE (owner or admin) ───────────────────────────────────────
router.put('/:id', requireAuth, async (req, res) => {
  const error = validate(req.body);
  if (error) return res.status(400).json({ error });

  try {
    const existing = await db.query('SELECT agent_id FROM buyers WHERE id = $1', [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Buyer not found' });
    if (existing.rows[0].agent_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only edit your own buyers' });
    }

    const { suburb_id, max_price, property_type, min_bedrooms, min_bathrooms, notes, status } = req.body;
    const result = await db.query(
      `UPDATE buyers SET suburb_id=$1, max_price=$2, property_type=$3, min_bedrooms=$4, min_bathrooms=$5,
       notes=$6, status=COALESCE($7, status), updated_at=NOW() WHERE id=$8 RETURNING *`,
      [suburb_id, max_price, property_type, min_bedrooms, min_bathrooms, notes || null, status || null, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE (owner or admin) ───────────────────────────────────────
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const existing = await db.query('SELECT agent_id FROM buyers WHERE id = $1', [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Buyer not found' });
    if (existing.rows[0].agent_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only delete your own buyers' });
    }

    await db.query('DELETE FROM buyers WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
