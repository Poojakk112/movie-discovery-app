import { getDeviceId } from './deviceId'
import type { Movie } from '../types'

import { API_URL } from './config'

function headers() {
  return {
    'x-device-id': getDeviceId(),
    'Content-Type': 'application/json',
  }
}

export async function fetchWishlist(): Promise<Movie[]> {
  const res = await fetch(`${API_URL}/api/wishlist`, { headers: headers() })
  if (!res.ok) throw new Error('Could not load wishlist')
  const data = await res.json()
  return data.movies
}

export async function addToWishlist(movie: Movie): Promise<void> {
  const res = await fetch(`${API_URL}/api/wishlist`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      id: movie.id,
      title: movie.title,
      posterUrl: movie.posterUrl,
      year: movie.year,
      rating: movie.rating,
    }),
  })
  if (!res.ok) throw new Error('Could not save movie')
}

export async function removeFromWishlist(movieId: number): Promise<void> {
  const res = await fetch(`${API_URL}/api/wishlist/${movieId}`, {
    method: 'DELETE',
    headers: headers(),
  })
  if (!res.ok) throw new Error('Could not remove movie')
}