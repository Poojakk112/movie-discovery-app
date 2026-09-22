import { Link } from 'react-router-dom'
import { useWishlist } from '../lib/WishlistContext'
import type { Movie } from '../types'

type Props = {
  movie: Movie
}

function MovieCard({ movie }: Props) {
  const { isSaved, toggle } = useWishlist()
  const saved = isSaved(movie.id)

  return (
    <div className="movie-card">
      <Link to={`/movie/${movie.id}`} className="movie-card-link">
        <div className="poster">
          {movie.posterUrl ? (
            <img src={movie.posterUrl} alt={`${movie.title} poster`} loading="lazy" />
          ) : (
            <div className="poster-placeholder">No poster</div>
          )}
          <span className="rating">{movie.rating ? `★ ${movie.rating}` : 'NR'}</span>
        </div>
        <h3 className="movie-title" title={movie.title}>
          {movie.title}
        </h3>
        <p className="movie-year">{movie.year ?? 'Year unknown'}</p>
      </Link>

      <button
        type="button"
        className={`wishlist-button ${saved ? 'saved' : ''}`}
        onClick={(e) => {
          e.preventDefault()
          toggle(movie)
        }}
        aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        {saved ? '♥' : '♡'}
      </button>
    </div>
  )
}

export default MovieCard