import { useEffect, useState } from 'react'
import Filters from './components/Filters'
import MovieCard from './components/MovieCard'
import SearchBar from './components/SearchBar'
import { useDebounce } from './hooks/useDebounce'
import type { Genre, Movie } from './types'

const API_URL = 'http://localhost:5000'

function App() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search.trim(), 400)

  const [genre, setGenre] = useState('')
  const [sort, setSort] = useState('popularity')
  const [genres, setGenres] = useState<Genre[]>([])

  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load the genre list once, when the page opens
  useEffect(() => {
    fetch(`${API_URL}/api/genres`)
      .then((res) => {
        if (!res.ok) throw new Error('Server error')
        return res.json()
      })
      .then((data) => setGenres(data.genres))
      .catch(() => setGenres([])) // the dropdown simply shows "All genres"
  }, [])

  // Load movies whenever the search, genre or sort changes
  useEffect(() => {
    const controller = new AbortController()

    setLoading(true)
    setError(null)

    const params = new URLSearchParams()
    if (debouncedSearch) {
      params.set('q', debouncedSearch)
    } else {
      params.set('sort', sort)
      if (genre) params.set('genre', genre)
    }

    fetch(`${API_URL}/api/movies?${params}`, { signal: controller.signal })
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
  }, [debouncedSearch, genre, sort])

  const isSearching = debouncedSearch !== ''
  const noResults = !loading && !error && movies.length === 0

  return (
    <div className="app">
      <header className="app-header">
        <h1>Movie Discovery</h1>
        <SearchBar value={search} onChange={setSearch} />
        <Filters
          genres={genres}
          genre={genre}
          sort={sort}
          onGenreChange={setGenre}
          onSortChange={setSort}
          disabled={isSearching}
        />
      </header>

      <main>
        {loading && <p className="message">Loading...</p>}
        {error && <p className="message">{error}</p>}
        {noResults && (
          <p className="message">
            {isSearching
              ? `No movies found for "${debouncedSearch}".`
              : 'No movies match these filters.'}
          </p>
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