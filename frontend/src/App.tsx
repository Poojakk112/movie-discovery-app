import { useEffect, useState } from 'react'
import MovieCard from './components/MovieCard'
import type { Movie } from './types'

const API_URL = 'http://localhost:5000'

function App() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API_URL}/api/movies`)
      .then((res) => {
        if (!res.ok) throw new Error('Server error')
        return res.json()
      })
      .then((data) => setMovies(data.movies))
      .catch(() => setError('Could not load movies'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <h1>Movie Discovery</h1>
      </header>

      <main>
        {loading && <p className="message">Loading...</p>}
        {error && <p className="message">{error}</p>}

        <div className="movie-grid">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      </main>
    </div>
  )
}

export default App