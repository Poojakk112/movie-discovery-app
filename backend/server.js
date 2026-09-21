require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

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

app.get('/', (req, res) => {
  res.json({
    message: 'Hello! Movie API is running.',
    tmdbKeyLoaded: Boolean(process.env.TMDB_API_KEY),
  });
});

app.get('/api/movies', async (req, res) => {
  try {
    const url = `${TMDB_BASE_URL}/movie/popular?api_key=${process.env.TMDB_API_KEY}&page=1`;
    const response = await fetch(url);

    if (!response.ok) {
      const body = await response.text();
      console.error('TMDB status:', response.status);
      console.error('TMDB reply:', body);
      return res.status(502).json({ error: 'Movie service failed' });
    }

    const data = await response.json();

    res.json({
      page: data.page,
      totalPages: data.total_pages,
      totalResults: data.total_results,
      movies: data.results.map(formatMovie),
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});