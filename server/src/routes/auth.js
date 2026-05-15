const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Single shared password — compared against APP_PASSWORD env var.
// On success, returns a JWT valid for 30 days.
router.post('/login', (req, res) => {
  const password = (req.body?.password || '').toString();
  const expected = process.env.APP_PASSWORD;
  if (!expected) return res.status(500).json({ error: 'APP_PASSWORD not configured on server' });
  if (password !== expected) return res.status(401).json({ error: 'Wrong password' });
  const token = jwt.sign({ sub: 'home' }, process.env.JWT_SECRET, { expiresIn: '30d' });
  res.json({ token });
});

module.exports = router;
