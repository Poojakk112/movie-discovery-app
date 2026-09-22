import { Link } from 'react-router-dom'
import MovieCard from '../components/MovieCard'
import { useWishlist } from '../lib/WishlistContext'

function Wishlist() {
  const { movies, loading } = useWishlist()

  return (
    <>
      <header className="app-header">
        <h1>My Wishlist</h1>
        <Link to="/" className="back-link">
          ← Back to movies
        </Link>
      </header>

      <main>
        {loading && <p className="message">Loading...</p>}
        {!loading && movies.length === 0 && (
          <p className="message">
            No movies saved yet. Click the heart on any movie to save it here.
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

export default Wishlist