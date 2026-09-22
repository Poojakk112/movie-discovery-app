export type Movie = {
  id: number
  title: string
  overview: string
  posterUrl: string | null
  releaseDate: string | null
  year: string | null
  rating: number | null
  genreIds: number[]
}

export type Genre = {
  id: number
  name: string
}