require('dotenv').config();
const express = require('express');
const cors = require('cors');
const wishlistRouter = require('./wishlist');

const app = express();
const PORT = process.env.PORT || 5000;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/w1280';
const PROFILE_BASE_URL = 'https://image.tmdb.org/t/p/w185';
const MAX_PAGE = 500; // TMDB does not serve pages beyond 500

const CACHE_TTL_MS = 5 * 60 * 1000; // keep answers for 5 minutes
const MAX_CACHE_ENTRIES = 500; // do not let the cache grow forever
const REQUEST_TIMEOUT_MS = 8000; // give up on TMDB after 8 seconds

// Our own sort names -> TMDB sort names
const SORT_OPTIONS = {
  popularity: 'popularity.desc',
  rating: 'vote_average.desc',
  newest: 'primary_release_date.desc',
  title: 'title.asc',
};

app.use(cors());
app.use(express.json());
app.use('/api/wishlist', wishlistRouter);

// The cache: a simple Map that remembers TMDB answers for a while
const cache = new Map();

// Turns one messy TMDB movie (from a list) into our own clean format
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

// Turns one full TMDB movie (with credits and videos) into our clean detail format
function formatMovieDetails(m) {
  const cast = ((m.credits && m.credits.cast) || []).slice(0, 10).map((person) => ({
    id: person.id,
    name: person.name,
    character: person.character || null,
    photoUrl: person.profile_path ? `${PROFILE_BASE_URL}${person.profile_path}` : null,
  }));

  const videos = (m.videos && m.videos.results) || [];
  const trailer = videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer');

  return {
    id: m.id,
    title: m.title || 'Untitled',
    tagline: m.tagline || null,
    overview: m.overview || 'No description available.',
    posterUrl: m.poster_path ? `${IMAGE_BASE_URL}${m.poster_path}` : null,
    backdropUrl: m.backdrop_path ? `${BACKDROP_BASE_URL}${m.backdrop_path}` : null,
    releaseDate: m.release_date || null,
    year: m.release_date ? m.release_date.slice(0, 4) : null,
    runtime: m.runtime || null,
    rating: m.vote_average ? Math.round(m.vote_average * 10) / 10 : null,
    voteCount: m.vote_count || 0,
    genres: m.genres || [],
    cast,
    trailerKey: trailer ? trailer.key : null,
  };
}

// One helper that talks to TMDB, with a cache and a timeout.
// Throws an error (with a .status number) if TMDB fails.
async function tmdbGet(path, params = {}) {
  const queryText = new URLSearchParams(params).toString();
  const cacheKey = `${path}?${queryText}`; // no API key in here on purpose

  // 1. Do we already have a fresh answer?
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    console.log('Cache HIT :', cacheKey);
    return cached.data;
  }
  console.log('Cache MISS:', cacheKey);

  // 2. Ask TMDB, but give up if it is too slow
  const query = new URLSearchParams({
    api_key: process.env.TMDB_API_KEY,
    ...params,
  });

  let response;
  try {
    response = await fetch(`${TMDB_BASE_URL}${path}?${query}`, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    const error = new Error(
      err.name === 'TimeoutError' ? 'TMDB did not answer in time' : 'Could not reach TMDB'
    );
    error.status = err.name === 'TimeoutError' ? 504 : 502;
    throw error;
  }

  if (!response.ok) {
    const body = await response.text();
    console.error('TMDB status:', response.status);
    console.error('TMDB reply:', body);
    const error = new Error('TMDB request failed');
    error.status = response.status;
    throw error;
  }

  const data = await response.json();

  // 3. Remember the answer (errors are never saved)
  cache.set(cacheKey, { data, expiresAt: Date.now() + CACHE_TTL_MS });
  if (cache.size > MAX_CACHE_ENTRIES) {
    cache.delete(cache.keys().next().value); // remove the oldest entry
  }

  return data;
}

// Sends the right kind of error back to the client
function sendError(res, error, message) {
  if (error.status === 504) {
    return res.status(504).json({ error: 'The movie service is too slow. Please try again.' });
  }
  return res.status(502).json({ error: message });
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
    sendError(res, error, 'Could not load genres');
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
    sendError(res, error, 'Movie service failed');
  }
});

// One movie with full details: /api/movies/278
app.get('/api/movies/:id', async (req, res) => {
  const { id } = req.params;

  // The id must be a plain number
  if (!/^\d+$/.test(id)) {
    return res.status(400).json({ error: 'Movie id must be a number' });
  }

  try {
    const data = await tmdbGet(`/movie/${id}`, {
      append_to_response: 'credits,videos',
    });
    res.json(formatMovieDetails(data));
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    console.error(error.message);
    sendError(res, error, 'Movie service failed');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});