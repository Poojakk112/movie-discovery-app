const KEY = 'movie-app-device-id'

// Returns the same random ID every time, for this browser
export function getDeviceId(): string {
  let id = localStorage.getItem(KEY)

  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(KEY, id)
  }

  return id
}