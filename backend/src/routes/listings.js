const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAuth } = require('../middleware/auth');

const PROPERTY_TYPES = ['House', 'Apartment', 'Townhouse', 'Villa', 'Land', 'Waterfront', 'Penthouse'];
const FEATURES = ['Penthouse', 'Sub-penthouse', 'Waterfront', 'Pool', 'Multi-level'];
const FACINGS = ['North', 'East', 'South', 'West'];
const DURATION_DAYS = [3, 7, 14, 30];

function cleanTags(values, allowed) {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.filter(v => allowed.includes(v)))];
}

function validate(body) {
  const { suburb_id, price, property_type, bedrooms, bathrooms, car_spaces } = body;
  if (!suburb_id) return 'Suburb is required';
  if (!price || price <= 0) return 'Price is required';
  if (!PROPERTY_TYPES.includes(property_type)) return 'Invalid property type';
  if (bedrooms === undefined || bedrooms < 0) return 'Bedrooms is required';
  if (bathrooms === undefined || bathrooms < 0) return 'Bathrooms is required';
  if (car_spaces !== undefined && car_spaces !== null && car_spaces !== '' && car_spaces < 0) return 'Invalid car spaces';
  return null;
}

// ─── MY listings ────────────────────────────────────────────────────
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT l.*, s.name AS suburb_name FROM listings l
       JOIN suburbs s ON s.id = l.suburb_id
       WHERE l.agent_id = $1 AND l.expires_at > NOW() ORDER BY l.created_at DESC`,
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

  const { suburb_id, price, property_type, bedrooms, bathrooms, land_size, features, facing, car_spaces, notes, duration_days } = req.body;
  if (!DURATION_DAYS.includes(Number(duration_days))) return res.status(400).json({ error: 'Invalid duration' });

  try {
    const result = await db.query(
      `INSERT INTO listings (agent_id, suburb_id, price, property_type, bedrooms, bathrooms, land_size, features, facing, car_spaces, notes, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, NOW() + ($12 || ' days')::INTERVAL) RETURNING *`,
      [req.user.id, suburb_id, price, property_type, bedrooms, bathrooms, land_size || null,
       cleanTags(features, FEATURES), cleanTags(facing, FACINGS), car_spaces || null, notes || null, duration_days]
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
    const existing = await db.query('SELECT agent_id FROM listings WHERE id = $1', [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Listing not found' });
    if (existing.rows[0].agent_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only edit your own listings' });
    }

    const { suburb_id, price, property_type, bedrooms, bathrooms, land_size, features, facing, car_spaces, notes, status } = req.body;
    const result = await db.query(
      `UPDATE listings SET suburb_id=$1, price=$2, property_type=$3, bedrooms=$4, bathrooms=$5,
       land_size=$6, features=$7, facing=$8, car_spaces=$9, notes=$10, status=COALESCE($11, status), updated_at=NOW() WHERE id=$12 RETURNING *`,
      [suburb_id, price, property_type, bedrooms, bathrooms, land_size || null,
       cleanTags(features, FEATURES), cleanTags(facing, FACINGS), car_spaces || null, notes || null, status || null, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE (owner or admin) ───────────────────────────────────────
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const existing = await db.query('SELECT agent_id FROM listings WHERE id = $1', [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Listing not found' });
    if (existing.rows[0].agent_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only delete your own listings' });
    }

    await db.query('DELETE FROM listings WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
