# Daylapse

A personal daily journal app for capturing one photo or video clip, a mood, and a few lines of text for each day — then browsing them on a scrollable calendar.

---

## What it does

**Calendar** — The home screen shows a scrollable calendar spanning ~5 years back and 3 months ahead. Past days with saved entries hide the "+" indicator. Tapping any past or present day opens that day's entry.

**Day entry** — Each day has three things to fill in:

- **Media** — Capture a photo or video, or pick from your gallery. Saved images appear in a horizontal scroll row; multiple clips are supported.
- **Journal** — A modal text editor with undo/redo for writing a short note about the day.
- **Mood** — Five emoji moods (happy, calm, neutral, sad, angry). Selection is saved immediately.

**Camera** — Full in-app camera with:

- Tap shutter for a photo
- Hold shutter to record a video (switches to video mode automatically)
- Tap shutter in video mode to toggle record/stop
- Preview before saving
- Saves to device gallery and to app-managed storage

---

## Tech stack

| Layer        | Library                    |
| ------------ | -------------------------- |
| Framework    | Expo SDK 56 / React Native |
| Navigation   | Expo Router (file-based)   |
| State        | Zustand                    |
| Database     | SQLite via Drizzle ORM     |
| File storage | expo-file-system (new API) |
| Camera       | expo-camera                |
| Gallery      | expo-media-library         |
| Styling      | React Native StyleSheet    |
| Language     | TypeScript                 |

---

## Project structure

```
src/
  app/
    (tabs)/
      calendar/         # Main calendar screen
      gallery.tsx       # Gallery tab
      settings.tsx      # Settings tab
    (screens)/
      day.tsx           # Per-day entry screen
      camera.tsx        # In-app camera screen
    _layout.tsx         # Root layout
  components/
    calendar/           # MonthView, DayCell, layout helpers
    camera/             # Viewfinder, controls, preview, permission
    day/                # MediaPager, AddMemoryCard, AddMediaFab
    journal/            # JournalEditor modal, MoodPicker
    sections/           # SuggestionSection
  data/                 # SVG emoji components, quote strings
  db/
    migrations/         # Auto-generated SQL migration files
  repositories/         # CRUD helpers for entries and media tables
  service/              # File copy/delete in app-managed storage
  store/                # Zustand — entry cache, media URI
  themes/               # Theme tokens (vanilla, blossom, cotton, dusk, sage)
  types/                # Shared TypeScript types
```

---

## Data model

**entries** — one row per calendar day

- `date` (unique) — date key in `YYYY-MM-DD` format
- `journal` — free-text note
- `mood` — one of `happy | calm | neutral | sad | angry`
- `coverMediaId` — FK to the primary media item

**media** — one or more rows per entry

- `entryId` — FK to entries
- `type` — `image | video`
- `uri` — path in app-managed storage (stable, not a temp URI)
- `order` — display order within the entry
- `duration`, `thumbnailUri`, `caption` — optional video metadata

---

## State and caching

The Zustand entry store pre-loads all entries in the visible calendar range (one batched DB query on calendar mount). Opening any previously visited day is instant — no DB read, no loading state. New days hit the DB once and are added to the cache. Mood and journal updates are optimistic: the UI updates immediately, the DB write happens in the background.

---

## Running locally

```bash
npm install
npx expo start
```

Requires a development build (not Expo Go) because the app uses:

- `expo-camera` with microphone permissions
- `expo-media-library` (legacy API)
- `expo-file-system` new Directory/File API
- SQLite migrations via `expo-sqlite`

Build a dev client with:

```bash
npx expo run:android
# or
npx expo run:ios
```
