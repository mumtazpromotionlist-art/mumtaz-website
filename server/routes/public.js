const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/offers', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 3, 50);
  const now = new Date().toISOString();

  const rows = db.prepare(`
    SELECT * FROM offers
    WHERE is_active = 1
      AND (start_at IS NULL OR start_at <= ?)
      AND (end_at IS NULL OR end_at >= ?)
    ORDER BY created_at DESC
    LIMIT ?
  `).all(now, now, limit);

  return res.json(rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    startAt: row.start_at,
    endAt: row.end_at,
    thumbnailPath: row.thumbnail_path,
    pdfPath: row.pdf_path
  })));
});

module.exports = router;
