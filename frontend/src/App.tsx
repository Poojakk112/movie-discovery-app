import { useEffect, useState } from 'react'
import MovieCard from './components/MovieCard'
import SearchBar from './components/SearchBar'
import { useDebounce } from './hooks/useDebounce'
import type { Movie } from './types'

const API_URL = 'http://localhost:5000'

function App() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search.trim(), 400)

  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Lets us cancel this request if a newer search starts
    const controller = new AbortController()

    setLoading(true)
    setError(null)

    const url = debouncedSearch
      ? `${API_URL}/api/movies?q=${encodeURIComponent(debouncedSearch)}`
      : `${API_URL}/api/movies`

    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('Server error')
        return res.json()
      })
      .then((data) => {
        setMovies(data.movies)
        setLoading(false)
      })
      .catch((err) => {
        if (err.name === 'AbortError') return // cancelled on purpose, not an error
        setMovies([])
        setError('Could not load movies. Please try again.')
        setLoading(false)
      })

    return () => controller.abort()
  }, [debouncedSearch])

  const noResults = !loading && !error && movies.length === 0

  return (
    <div className="app">
      <header className="app-header">
        <h1>Movie Discovery</h1>
        <SearchBar value={search} onChange={setSearch} />
      </header>

      <main>
        {loading && <p className="message">Loading...</p>}
        {error && <p className="message">{error}</p>}
        {noResults && (
          <p className="message">No movies found for "{debouncedSearch}".</p>
        )}

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