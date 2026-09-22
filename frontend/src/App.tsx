import { useEffect, useState } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import Filters from './components/Filters'
import MovieCard from './components/MovieCard'
import SearchBar from './components/SearchBar'
import { useDebounce } from './hooks/useDebounce'
import MovieDetails from './pages/MovieDetails'
import Wishlist from './pages/Wishlist'
import type { Genre, Movie } from './types'

const API_URL = 'http://localhost:5000'

function HomePage() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search.trim(), 400)

  const [genre, setGenre] = useState('')
  const [sort, setSort] = useState('popularity')
  const [genres, setGenres] = useState<Genre[]>([])

  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API_URL}/api/genres`)
      .then((res) => {
        if (!res.ok) throw new Error('Server error')
        return res.json()
      })
      .then((data) => setGenres(data.genres))
      .catch(() => setGenres([]))
  }, [])

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
        if (err.name === 'AbortError') return
        setMovies([])
        setError('Could not load movies. Please try again.')
        setLoading(false)
      })

    return () => controller.abort()
  }, [debouncedSearch, genre, sort])

  const isSearching = debouncedSearch !== ''
  const noResults = !loading && !error && movies.length === 0

  return (
    <>
      <header className="app-header">
        <div className="header-top">
          <h1>Movie Discovery</h1>
          <Link to="/wishlist" className="wishlist-link">
            ♥ My Wishlist
          </Link>
        </div>
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
    </>
  )
}

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/movie/:id" element={<MovieDetails />} />
        <Route path="/wishlist" element={<Wishlist />} />
      </Routes>
    </div>
  )
}

export default App