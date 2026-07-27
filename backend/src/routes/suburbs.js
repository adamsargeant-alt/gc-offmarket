const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAuth } = require('../middleware/auth');

function isMatch(listing, buyer) {
  return (
    Number(listing.price) <= Number(buyer.max_price) &&
    listing.property_type === buyer.property_type &&
    listing.bedrooms >= buyer.min_bedrooms &&
    listing.bathrooms >= buyer.min_bathrooms
  );
}

// ─── LIST suburbs with counts ──────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT s.id, s.name,
        COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'active' AND l.expires_at > NOW()) AS listing_count,
        COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'active' AND b.expires_at > NOW()) AS buyer_count
      FROM suburbs s
      LEFT JOIN listings l ON l.suburb_id = s.id
      LEFT JOIN buyers b ON b.suburb_id = s.id
      GROUP BY s.id, s.name
      ORDER BY s.name
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SUBURB detail: listings, buyers, matches ──────────────────────
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const suburbResult = await db.query('SELECT * FROM suburbs WHERE id = $1', [req.params.id]);
    if (!suburbResult.rows.length) return res.status(404).json({ error: 'Suburb not found' });

    const listingsResult = await db.query(
      `SELECT l.*, u.first_name || ' ' || u.last_name AS agent_name, u.email AS agent_email,
              u.mobile_number AS agent_mobile, u.team AS agent_team
       FROM listings l JOIN users u ON u.id = l.agent_id
       WHERE l.suburb_id = $1 AND l.expires_at > NOW() ORDER BY l.created_at DESC`,
      [req.params.id]
    );
    const buyersResult = await db.query(
      `SELECT b.*, u.first_name || ' ' || u.last_name AS agent_name, u.email AS agent_email,
              u.mobile_number AS agent_mobile, u.team AS agent_team
       FROM buyers b JOIN users u ON u.id = b.agent_id
       WHERE b.suburb_id = $1 AND b.expires_at > NOW() ORDER BY b.created_at DESC`,
      [req.params.id]
    );

    const listings = listingsResult.rows;
    const buyers = buyersResult.rows;

    const listingMatches = {};
    const buyerMatches = {};
    for (const listing of listings) {
      for (const buyer of buyers) {
        if (listing.status === 'active' && buyer.status === 'active' && isMatch(listing, buyer)) {
          (listingMatches[listing.id] ||= []).push(buyer.id);
          (buyerMatches[buyer.id] ||= []).push(listing.id);
        }
      }
    }

    res.json({
      suburb: suburbResult.rows[0],
      listings: listings.map(l => ({ ...l, matching_buyer_ids: listingMatches[l.id] || [] })),
      buyers: buyers.map(b => ({ ...b, matching_listing_ids: buyerMatches[b.id] || [] })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
