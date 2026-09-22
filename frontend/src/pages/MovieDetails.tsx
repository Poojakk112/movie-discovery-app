import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

const API_URL = 'http://localhost:5000'

type CastMember = {
  id: number
  name: string
  character: string | null
  photoUrl: string | null
}

type MovieDetail = {
  id: number
  title: string
  tagline: string | null
  overview: string
  posterUrl: string | null
  backdropUrl: string | null
  year: string | null
  runtime: number | null
  rating: number | null
  voteCount: number
  genres: { id: number; name: string }[]
  cast: CastMember[]
  trailerKey: string | null
}

function MovieDetails() {
  const { id } = useParams()
  const [movie, setMovie] = useState<MovieDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    setMovie(null)

    fetch(`${API_URL}/api/movies/${id}`)
      .then((res) => {
        if (res.status === 404) throw new Error('not-found')
        if (!res.ok) throw new Error('server-error')
        return res.json()
      })
      .then((data) => setMovie(data))
      .catch((err) =>
        setError(err.message === 'not-found' ? 'Movie not found.' : 'Could not load this movie.')
      )
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="message">Loading...</p>
  if (error) {
    return (
      <div className="details-page">
        <p className="message">{error}</p>
        <Link to="/" className="back-link">
          ← Back to movies
        </Link>
      </div>
    )
  }
  if (!movie) return null

  return (
    <div className="details-page">
      <Link to="/" className="back-link">
        ← Back to movies
      </Link>

      {movie.backdropUrl && (
        <div
          className="backdrop"
          style={{ backgroundImage: `url(${movie.backdropUrl})` }}
        />
      )}

      <div className="details-content">
        <div className="details-poster">
          {movie.posterUrl ? (
            <img src={movie.posterUrl} alt={`${movie.title} poster`} />
          ) : (
            <div className="poster-placeholder">No poster</div>
          )}
        </div>

        <div className="details-info">
          <h1>{movie.title}</h1>
          {movie.tagline && <p className="tagline">{movie.tagline}</p>}

          <p className="details-meta">
            {movie.year ?? 'Year unknown'}
            {movie.runtime ? ` · ${movie.runtime} min` : ''}
            {movie.rating ? ` · ★ ${movie.rating} (${movie.voteCount} votes)` : ' · Not rated'}
          </p>

          {movie.genres.length > 0 && (
            <div className="genre-tags">
              {movie.genres.map((g) => (
                <span key={g.id} className="genre-tag">
                  {g.name}
                </span>
              ))}
            </div>
          )}

          <p className="overview">{movie.overview}</p>

          {movie.trailerKey && (
            <div className="trailer">
              <iframe
                src={`https://www.youtube.com/embed/${movie.trailerKey}`}
                title="Trailer"
                allowFullScreen
              />
            </div>
          )}

          {movie.cast.length > 0 && (
            <div className="cast-section">
              <h2>Cast</h2>
              <div className="cast-list">
                {movie.cast.map((person) => (
                  <div key={person.id} className="cast-member">
                    {person.photoUrl ? (
                      <img src={person.photoUrl} alt={person.name} />
                    ) : (
                      <div className="cast-placeholder" />
                    )}
                    <p className="cast-name">{person.name}</p>
                    <p className="cast-character">{person.character}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MovieDetails