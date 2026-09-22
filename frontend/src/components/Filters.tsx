import type { Genre } from '../types'

type Props = {
  genres: Genre[]
  genre: string
  sort: string
  onGenreChange: (value: string) => void
  onSortChange: (value: string) => void
  disabled: boolean
}

function Filters({ genres, genre, sort, onGenreChange, onSortChange, disabled }: Props) {
  return (
    <div className="filters">
      <label>
        Genre
        <select
          value={genre}
          onChange={(e) => onGenreChange(e.target.value)}
          disabled={disabled}
        >
          <option value="">All genres</option>
          {genres.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Sort by
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          disabled={disabled}
        >
          <option value="popularity">Most popular</option>
          <option value="rating">Highest rated</option>
          <option value="newest">Newest</option>
          <option value="title">Title (A-Z)</option>
        </select>
      </label>
    </div>
  )
}

export default Filters