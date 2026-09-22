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
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [loading, setLoading] = useState(true) // first load of a new search/filter
  const [loadingMore, setLoadingMore] = useState(false) // loading page 2, 3...
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

  // Whenever the search, genre or sort changes, start over at page 1
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, genre, sort])

  // Loads whichever page number is current. Page 1 replaces the list; later pages add to it.
  useEffect(() => {
    const controller = new AbortController()

    if (page === 1) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }
    setError(null)

    const params = new URLSearchParams()
    params.set('page', String(page))
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
        setTotalPages(data.totalPages)
        setMovies((prev) => {
          const combined = page === 1 ? data.movies : [...prev, ...data.movies]
          // Remove any duplicate movie id (can happen with TMDB search paging)
          const seen = new Set<number>()
          return combined.filter((m) => {
            if (seen.has(m.id)) return false
            seen.add(m.id)
            return true
          })
        })
        setLoading(false)
        setLoadingMore(false)
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        if (page === 1) setMovies([])
        setError('Could not load movies. Please try again.')
        setLoading(false)
        setLoadingMore(false)
      })

    return () => controller.abort()
  }, [debouncedSearch, genre, sort, page])

  const isSearching = debouncedSearch !== ''
  const noResults = !loading && !error && movies.length === 0
  const canLoadMore = !loading && !error && page < totalPages

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

        {canLoadMore && (
          <div className="load-more">
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={loadingMore}
            >
              {loadingMore ? 'Loading...' : 'Load more'}
            </button>
          </div>
        )}
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