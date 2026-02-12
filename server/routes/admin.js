const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '');
    const base = path.basename(file.originalname || 'file', ext).replace(/[^a-z0-9-_]/gi, '_');
    cb(null, `${Date.now()}_${base}${ext}`);
  }
});

const allowedMimeTypes = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif'
]);

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.has(file.mimetype)) return cb(null, true);
    return cb(new Error('Unsupported file type.'));
  }
});

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing credentials.' });
  }

  const adminUser = process.env.ADMIN_USERNAME || '';
  const adminHash = process.env.ADMIN_PASSWORD_HASH || '';

  if (username !== adminUser) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const ok = bcrypt.compareSync(password, adminHash);
  if (!ok) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '12h' });
  return res.json({ token });
});

router.post('/upload', auth, upload.single('file'), (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const relativePath = path.posix.join('uploads', file.filename);
  return res.json({
    path: `/${relativePath}`,
    mimeType: file.mimetype,
    originalName: file.originalname
  });
});

router.get('/offers', auth, (req, res) => {
  const rows = db.prepare('SELECT * FROM offers ORDER BY created_at DESC').all();
  return res.json(rows);
});

router.post('/offers', auth, (req, res) => {
  const now = new Date().toISOString();
  const {
    title,
    description,
    isActive,
    startAt,
    endAt,
    thumbnailPath,
    pdfPath
  } = req.body || {};

  if (!title) {
    return res.status(400).json({ error: 'Title is required.' });
  }

  const stmt = db.prepare(`
    INSERT INTO offers
      (title, description, is_active, start_at, end_at, thumbnail_path, pdf_path, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const info = stmt.run(
    title,
    description || null,
    isActive ? 1 : 0,
    startAt || null,
    endAt || null,
    thumbnailPath || null,
    pdfPath || null,
    now,
    now
  );

  const offer = db.prepare('SELECT * FROM offers WHERE id = ?').get(info.lastInsertRowid);
  return res.status(201).json(offer);
});

router.patch('/offers/:id', auth, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM offers WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Offer not found.' });
  }

  const now = new Date().toISOString();
  const updates = {
    title: req.body.title ?? existing.title,
    description: req.body.description ?? existing.description,
    is_active: req.body.isActive === undefined ? existing.is_active : (req.body.isActive ? 1 : 0),
    start_at: req.body.startAt ?? existing.start_at,
    end_at: req.body.endAt ?? existing.end_at,
    thumbnail_path: req.body.thumbnailPath ?? existing.thumbnail_path,
    pdf_path: req.body.pdfPath ?? existing.pdf_path,
    updated_at: now
  };

  db.prepare(`
    UPDATE offers SET
      title = ?,
      description = ?,
      is_active = ?,
      start_at = ?,
      end_at = ?,
      thumbnail_path = ?,
      pdf_path = ?,
      updated_at = ?
    WHERE id = ?
  `).run(
    updates.title,
    updates.description,
    updates.is_active,
    updates.start_at,
    updates.end_at,
    updates.thumbnail_path,
    updates.pdf_path,
    updates.updated_at,
    id
  );

  const offer = db.prepare('SELECT * FROM offers WHERE id = ?').get(id);
  return res.json(offer);
});

router.delete('/offers/:id', auth, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM offers WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Offer not found.' });
  }

  db.prepare('DELETE FROM offers WHERE id = ?').run(id);

  const paths = [existing.thumbnail_path, existing.pdf_path].filter(Boolean);
  paths.forEach((p) => {
    const fullPath = path.join(__dirname, '..', '..', p.replace(/^\//, ''));
    try {
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    } catch (err) {
      // Non-fatal: file cleanup best effort
    }
  });

  return res.json({ ok: true });
});

module.exports = router;
