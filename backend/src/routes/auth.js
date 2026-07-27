const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { requireAuth } = require('../middleware/auth');

function signToken(user) {
  return jwt.sign(
    { id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

function publicUser(user) {
  const { password_hash, ...rest } = user;
  return rest;
}

// ─── REGISTER ───────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { first_name, last_name, team, mobile_number, email, password } = req.body;
  if (!first_name || !last_name || !mobile_number || !email || !password) {
    return res.status(400).json({ error: 'First name, last name, mobile number, email and password are required' });
  }
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  if (!/^[0-9+() \-]{6,20}$/.test(mobile_number.trim())) return res.status(400).json({ error: 'Enter a valid mobile number' });

  try {
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length) return res.status(409).json({ error: 'An account with that email already exists' });

    const password_hash = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (first_name, last_name, team, mobile_number, email, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [first_name.trim(), last_name.trim(), team?.trim() || null, mobile_number.trim(), email.toLowerCase().trim(), password_hash]
    );

    const user = result.rows[0];
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── LOGIN ──────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ME ─────────────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(publicUser(result.rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
