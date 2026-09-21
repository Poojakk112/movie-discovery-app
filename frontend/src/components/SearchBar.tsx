type Props = {
  value: string
  onChange: (value: string) => void
}

function SearchBar({ value, onChange }: Props) {
  return (
    <div className="search-bar">
      <input
        type="search"
        placeholder="Search movies..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Search movies"
      />
    </div>
  )
}

export default SearchBar