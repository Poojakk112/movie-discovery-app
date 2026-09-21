require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const MAX_PAGE = 500; // TMDB does not serve pages beyond 500

// Our own sort names -> TMDB sort names
const SORT_OPTIONS = {
  popularity: 'popularity.desc',
  rating: 'vote_average.desc',
  newest: 'primary_release_date.desc',
  title: 'title.asc',
};

app.use(cors());
app.use(express.json());

// Turns one messy TMDB movie into our own clean format
function formatMovie(m) {
  return {
    id: m.id,
    title: m.title || 'Untitled',
    overview: m.overview || 'No description available.',
    posterUrl: m.poster_path ? `${IMAGE_BASE_URL}${m.poster_path}` : null,
    releaseDate: m.release_date || null,
    year: m.release_date ? m.release_date.slice(0, 4) : null,
    rating: m.vote_average ? Math.round(m.vote_average * 10) / 10 : null,
    genreIds: m.genre_ids || [],
  };
}

// One helper that talks to TMDB. Throws an error if TMDB fails.
async function tmdbGet(path, params = {}) {
  const query = new URLSearchParams({
    api_key: process.env.TMDB_API_KEY,
    ...params,
  });
  const response = await fetch(`${TMDB_BASE_URL}${path}?${query}`);

  if (!response.ok) {
    const body = await response.text();
    console.error('TMDB status:', response.status);
    console.error('TMDB reply:', body);
    throw new Error('TMDB request failed');
  }

  return response.json();
}

app.get('/', (req, res) => {
  res.json({
    message: 'Hello! Movie API is running.',
    tmdbKeyLoaded: Boolean(process.env.TMDB_API_KEY),
  });
});

// List of genres, like [{ id: 28, name: 'Action' }, ...]
app.get('/api/genres', async (req, res) => {
  try {
    const data = await tmdbGet('/genre/movie/list');
    res.json({ genres: data.genres });
  } catch (error) {
    res.status(502).json({ error: 'Could not load genres' });
  }
});

// Movies: /api/movies?page=2&sort=rating&genre=28
// Search: /api/movies?q=batman&page=1
app.get('/api/movies', async (req, res) => {
  try {
    const page = Math.min(MAX_PAGE, Math.max(1, parseInt(req.query.page) || 1));
    const searchText = String(req.query.q || '').trim().slice(0, 100);

    let data;

    if (searchText) {
      // Search mode
      data = await tmdbGet('/search/movie', {
        query: searchText,
        page,
        include_adult: 'false',
      });
    } else {
      // Browse mode
      const sortKey = SORT_OPTIONS[req.query.sort] ? req.query.sort : 'popularity';

      const params = {
        page,
        sort_by: SORT_OPTIONS[sortKey],
        include_adult: 'false',
      };

      // Only accept a genre that is a plain number
      if (/^\d+$/.test(req.query.genre || '')) {
        params.with_genres = req.query.genre;
      }

      // Movies with only a few votes give silly "top rated" results
      if (sortKey === 'rating') {
        params['vote_count.gte'] = '200';
      }

      // Do not show movies that are not released yet when sorting by newest
      if (sortKey === 'newest') {
        params['primary_release_date.lte'] = new Date().toISOString().slice(0, 10);
      }

      data = await tmdbGet('/discover/movie', params);
    }

    res.json({
      page: data.page,
      totalPages: Math.min(data.total_pages, MAX_PAGE),
      totalResults: data.total_results,
      movies: data.results.map(formatMovie),
    });
  } catch (error) {
    console.error(error.message);
    res.status(502).json({ error: 'Movie service failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});