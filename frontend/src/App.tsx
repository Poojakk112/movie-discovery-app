import { useEffect, useState } from 'react'

const API_URL = 'http://localhost:5000'

type Movie = {
  id: number
  title: string
  year: string | null
  rating: number | null
}

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

  if (loading) return <p>Loading...</p>
  if (error) return <p>{error}</p>

  return (
    <div>
      <h1>Movies</h1>
      <ul>
        {movies.map((movie) => (
          <li key={movie.id}>
            {movie.title} ({movie.year ?? 'N/A'}) - {movie.rating ?? 'No rating'}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App