import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { addToWishlist, fetchWishlist, removeFromWishlist } from './wishlist'
import type { Movie } from '../types'

type WishlistContextValue = {
  movies: Movie[]
  loading: boolean
  isSaved: (movieId: number) => boolean
  toggle: (movie: Movie) => void
}

const WishlistContext = createContext<WishlistContextValue | null>(null)

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWishlist()
      .then(setMovies)
      .catch(() => setMovies([]))
      .finally(() => setLoading(false))
  }, [])

  function isSaved(movieId: number) {
    return movies.some((m) => m.id === movieId)
  }

  function toggle(movie: Movie) {
    if (isSaved(movie.id)) {
      // Remove immediately from the screen, then tell the backend
      setMovies((prev) => prev.filter((m) => m.id !== movie.id))
      removeFromWishlist(movie.id).catch(() => {
        // If it failed, put it back
        setMovies((prev) => [movie, ...prev])
      })
    } else {
      setMovies((prev) => [movie, ...prev])
      addToWishlist(movie).catch(() => {
        setMovies((prev) => prev.filter((m) => m.id !== movie.id))
      })
    }
  }

  return (
    <WishlistContext.Provider value={{ movies, loading, isSaved, toggle }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (!context) throw new Error('useWishlist must be used inside WishlistProvider')
  return context
}