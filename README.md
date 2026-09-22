# Movie Discovery App

A full-stack movie discovery app built with React (TypeScript, Vite) and a Node.js/Express backend, using TMDB for movie data.

## Setup Instructions

### Backend

    cd backend
    npm install

Create a `.env` file in `backend/` with:

    TMDB_API_KEY=your_tmdb_api_key_here

Run the server:

    node --watch server.js

Runs on `http://localhost:5000`.

### Frontend

    cd frontend
    npm install
    npm run dev

Runs on `http://localhost:5173`.

Both the backend and frontend need to be running at the same time.

## Approach

The app is split into two independent parts. The backend is a thin abstraction layer over TMDB: it never exposes the raw TMDB response shape to the client, reshaping every response into a smaller, consistent format (id, title, overview, posterUrl, year, rating, genreIds for lists, and a richer shape for a single movie's details). This means the frontend never needs to know anything about TMDB's field names or quirks, and the backend could swap to a different movie data provider without the frontend changing at all.

The frontend is a single-page app with three routes (home/browse, movie details, wishlist), built with React Router. State for search, filters, sort and pagination lives in the home page component; the wishlist has its own React Context so any component (the heart button on a card, the wishlist page) can read and update it without prop drilling.

## Technical Decisions

- Backend framework: Express, for its simplicity and because the internship listing specifically asks for Node.js.
- Database: SQLite (via Node's built-in node:sqlite), used only for the wishlist. No separate database server to install; the whole database is one file (wishlist.db).
- No login: Since the assignment doesn't ask for user accounts, each browser generates a random device ID (stored in localStorage) the first time it's used. The wishlist is saved against that ID.
- Caching: The backend caches every TMDB response in memory for 5 minutes, keyed by the request path and query parameters (not including the API key). This also protects against TMDB's rate limits.
- Request timeout: Every TMDB request is aborted after 8 seconds if TMDB hasn't responded, so a slow TMDB never hangs the app indefinitely.
- Debounced search: The search input waits 400ms after the user stops typing before firing a request.
- Search vs. browse are separate modes: TMDB's search endpoint doesn't support sorting or genre filtering, so when a search query is active, the genre and sort dropdowns are disabled in the UI.
- Duplicate removal on "Load more": TMDB's search results can shift slightly between pages, occasionally returning the same movie twice. The frontend de-duplicates by movie ID whenever a new page is appended.
- Styling: Plain CSS with CSS variables for theming, no CSS framework.

## Assumptions

- No user accounts or login were required.
- Adult content is excluded from all TMDB requests.
- Only movies (not TV shows) are in scope.

## Known Limitations

- While a search query is active, genre filtering and sorting are disabled.
- Some movies from TMDB have missing data (no rating, no poster, no trailer). The app shows sensible fallbacks rather than failing.
- The in-memory cache resets whenever the backend restarts.
- No automated tests are included, given the assignment's timeframe.

## AI Tools Used

I used Claude to help scaffold the Express backend, understand the TMDB API's response format, and debug environment setup issues (API keys, file paths, DNS) on my machine. I also used it to review my CSS and React component structure for improvements. The API design, database choice (SQLite for the wishlist), caching strategy, and overall architecture were decisions I made myself, and I can explain and modify any part of the implementation.

## What I'd Improve With More Time

- Add automated tests for the backend endpoints.
- Add a proper loading skeleton for the movie grid.
- Support keyboard navigation and better accessibility labels.
- Move the API key check and input validation into shared middleware.
- Add sorting options within search results.
