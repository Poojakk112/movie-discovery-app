const express = require('express');
const { DatabaseSync } = require('node:sqlite');
const path = require('path');

// Opens (or creates) the database file inside the backend folder
const db = new DatabaseSync(path.join(__dirname, 'wishlist.db'));

// The table: one row per movie per device.
// PRIMARY KEY (device_id, movie_id) means the same movie cannot be saved twice.
db.exec(`
  CREATE TABLE IF NOT EXISTS wishlist (
    device_id TEXT NOT NULL,
    movie_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    poster_url TEXT,
    year TEXT,
    rating REAL,
    added_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (device_id, movie_id)
  )
`);

const router = express.Router();

// Every wishlist request must send an x-device-id header
router.use((req, res, next) => {
  const deviceId = req.get('x-device-id') || '';
  if (!/^[A-Za-z0-9-]{8,64}$/.test(deviceId)) {
    return res.status(400).json({ error: 'Missing or invalid x-device-id header' });
  }
  req.deviceId = deviceId;
  next();
});

// GET /api/wishlist -> all saved movies, newest first
router.get('/', (req, res) => {
  try {
    const rows = db
      .prepare(
        `SELECT movie_id, title, poster_url, year, rating
         FROM wishlist
         WHERE device_id = ?
         ORDER BY added_at DESC, rowid DESC`
      )
      .all(req.deviceId);

    const movies = rows.map((row) => ({
      id: row.movie_id,
      title: row.title,
      posterUrl: row.poster_url,
      year: row.year,
      rating: row.rating,
    }));

    res.json({ movies });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Could not load wishlist' });
  }
});

// POST /api/wishlist -> save a movie
router.post('/', (req, res) => {
  const { id, title, posterUrl, year, rating } = req.body || {};

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'A valid movie id is required' });
  }
  if (typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'A movie title is required' });
  }

  try {
    db.prepare(
      `INSERT INTO wishlist (device_id, movie_id, title, poster_url, year, rating)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (device_id, movie_id) DO NOTHING`
    ).run(
      req.deviceId,
      id,
      title.trim().slice(0, 300),
      typeof posterUrl === 'string' ? posterUrl : null,
      year ? String(year) : null,
      typeof rating === 'number' ? rating : null
    );

    res.status(201).json({ saved: true });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Could not save movie' });
  }
});

// DELETE /api/wishlist/278 -> remove a movie
router.delete('/:movieId', (req, res) => {
  if (!/^\d+$/.test(req.params.movieId)) {
    return res.status(400).json({ error: 'Movie id must be a number' });
  }

  try {
    const result = db
      .prepare('DELETE FROM wishlist WHERE device_id = ? AND movie_id = ?')
      .run(req.deviceId, Number(req.params.movieId));

    res.json({ removed: result.changes > 0 });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Could not remove movie' });
  }
});

module.exports = router;