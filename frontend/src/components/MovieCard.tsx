import type { Movie } from '../types'

type Props = {
  movie: Movie
}

function MovieCard({ movie }: Props) {
  return (
    <article className="movie-card">
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
    </article>
  )
}

export default MovieCard