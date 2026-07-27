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
  const { suburb_ids, max_price, property_type, min_bedrooms, min_bathrooms, car_spaces } = body;
  if (!Array.isArray(suburb_ids) || !suburb_ids.length) return 'Pick at least one suburb';
  if (suburb_ids.length > 3) return 'You can pick up to 3 suburbs';
  if (new Set(suburb_ids).size !== suburb_ids.length) return 'Suburbs must be unique';
  if (!max_price || max_price <= 0) return 'Max price is required';
  if (!PROPERTY_TYPES.includes(property_type)) return 'Invalid property type';
  if (min_bedrooms === undefined || min_bedrooms < 0) return 'Min bedrooms is required';
  if (min_bathrooms === undefined || min_bathrooms < 0) return 'Min bathrooms is required';
  if (car_spaces !== undefined && car_spaces !== null && car_spaces !== '' && car_spaces < 0) return 'Invalid car spaces';
  return null;
}

async function setBuyerSuburbs(buyerId, suburbIds) {
  await db.query('DELETE FROM buyer_suburbs WHERE buyer_id = $1', [buyerId]);
  for (const suburbId of suburbIds) {
    await db.query('INSERT INTO buyer_suburbs (buyer_id, suburb_id) VALUES ($1, $2)', [buyerId, suburbId]);
  }
}

async function withSuburbs(buyer) {
  const result = await db.query(
    `SELECT s.id, s.name FROM buyer_suburbs bs JOIN suburbs s ON s.id = bs.suburb_id
     WHERE bs.buyer_id = $1 ORDER BY s.name`,
    [buyer.id]
  );
  return { ...buyer, suburbs: result.rows };
}

// ─── MY buyers ──────────────────────────────────────────────────────
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT b.*, COALESCE(
         json_agg(jsonb_build_object('id', s.id, 'name', s.name) ORDER BY s.name) FILTER (WHERE s.id IS NOT NULL),
         '[]'
       ) AS suburbs
       FROM buyers b
       LEFT JOIN buyer_suburbs bs ON bs.buyer_id = b.id
       LEFT JOIN suburbs s ON s.id = bs.suburb_id
       WHERE b.agent_id = $1 AND b.expires_at > NOW()
       GROUP BY b.id
       ORDER BY b.created_at DESC`,
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

  const { suburb_ids, max_price, property_type, min_bedrooms, min_bathrooms, land_size, features, facing, car_spaces, notes, duration_days } = req.body;
  if (!DURATION_DAYS.includes(Number(duration_days))) return res.status(400).json({ error: 'Invalid duration' });

  try {
    const result = await db.query(
      `INSERT INTO buyers (agent_id, max_price, property_type, min_bedrooms, min_bathrooms, land_size, features, facing, car_spaces, notes, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, NOW() + ($11 || ' days')::INTERVAL) RETURNING *`,
      [req.user.id, max_price, property_type, min_bedrooms, min_bathrooms, land_size || null,
       cleanTags(features, FEATURES), cleanTags(facing, FACINGS), car_spaces || null, notes || null, duration_days]
    );
    const buyer = result.rows[0];
    await setBuyerSuburbs(buyer.id, suburb_ids);
    res.status(201).json(await withSuburbs(buyer));
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

    const { suburb_ids, max_price, property_type, min_bedrooms, min_bathrooms, land_size, features, facing, car_spaces, notes, status } = req.body;
    const result = await db.query(
      `UPDATE buyers SET max_price=$1, property_type=$2, min_bedrooms=$3, min_bathrooms=$4,
       land_size=$5, features=$6, facing=$7, car_spaces=$8, notes=$9, status=COALESCE($10, status), updated_at=NOW() WHERE id=$11 RETURNING *`,
      [max_price, property_type, min_bedrooms, min_bathrooms, land_size || null,
       cleanTags(features, FEATURES), cleanTags(facing, FACINGS), car_spaces || null, notes || null, status || null, req.params.id]
    );
    await setBuyerSuburbs(req.params.id, suburb_ids);
    res.json(await withSuburbs(result.rows[0]));
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
