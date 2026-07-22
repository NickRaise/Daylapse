# Daylapse

A personal daily journaling app for capturing one moment per day — a photo or short video clip, a mood, and a few lines of text — then revisiting them on a scrollable calendar.

---

## Features

### Calendar
The home screen is a scrollable calendar spanning ~5 years back and 3 months ahead. Past days that have entries show a thumbnail of the first saved media item. Tapping any past or present day opens that day's entry.

### Day Entry
Each day has three things to fill in:

- **Media** — Capture a photo or video via the in-app camera, or import from your gallery. Multiple media items per day are supported, with drag-to-reorder and full-screen lightbox view.
- **Journal** — A full-screen text editor with a random daily writing prompt (Caveat handwriting font).
- **Mood** — Five moods (happy, calm, neutral, sad, angry), each a custom SVG emoji. Tapping a selected mood deselects it.

### In-App Camera
- Photo mode — tap shutter
- Video mode — tap to start/stop recording; or long-press for hold-to-record
- Optional recording time limit (5 s, 10 s, 30 s, 1 min, 5 min, or none)
- Fallback to native system camera via settings toggle
- Gallery import directly from the camera screen

### Media Editor
After capturing, every photo or video passes through an editor before being saved:

- **Frame** — Choose 4:3, 1:1, or 9:16 aspect ratio with portrait/landscape flip
- **Caption** — Draggable text overlay; 4 text colours, 4 background tints; up to 120 characters
- **Date stamp** — Optional date label in any corner; 3 format options (`DD MMM`, `DD MMM YYYY`, `MMM DD, YYYY`)
- **Trim** (video only) — Scrollable thumbnail reel with a draggable clip block, animated playhead needle running fully on the UI thread via Reanimated SharedValue, step controls, and duration picker (1 s / 3 s / 5 s / 10 s / custom)
- **Volume** (video only) — Per-clip volume slider
- **Save** — Burns caption and date stamp into the photo via react-native-view-shot. Videos are saved as-is. Optionally copies to device gallery. Editor preferences (style, volume, date stamp) are auto-persisted for the next session.

### Settings

| Setting | Options |
|---|---|
| Video quality | Low / Medium / High |
| Use native camera | toggle |
| Recording time limit | None / 5 s / 10 s / 30 s / 1 min / 5 min |
| Default frame ratio | 4:3 / 1:1 / 9:16 |
| Save to gallery | toggle |
| Keep original photo | toggle — skips burn-in so the original stays editable |

---

## Tech stack

| Layer | Library |
|---|---|
| Framework | Expo SDK 56 / React Native 0.85 / React 19 |
| Navigation | Expo Router v4 (file-based, typed routes) |
| State | Zustand 5 |
| Database | SQLite via Drizzle ORM + expo-sqlite |
| File storage | expo-file-system (new Directory/File API) |
| Animations | Reanimated 4 + react-native-gesture-handler |
| Camera | expo-camera |
| Video playback | expo-video |
| Video thumbnails | expo-video-thumbnails |
| Photo capture | react-native-view-shot |
| Gallery | expo-media-library (legacy API) |
| Drag-to-reorder | react-native-sortables |
| Images | expo-image |
| Icons | @react-native-vector-icons/fontawesome-free-solid |
| Language | TypeScript (React Compiler enabled) |

---

## Project structure

```
src/
  app/
    _layout.tsx              # Root layout — DB migrations + settings hydration
    (tabs)/
      index.tsx              # Home tab (placeholder)
      calendar/index.tsx     # Scrollable calendar
      gallery.tsx            # Gallery tab (placeholder)
      settings.tsx           # Settings screen
    (screens)/
      camera.tsx             # In-app camera
      day.tsx                # Day entry (journal, mood, media)
      editor.tsx             # Media editor
  components/
    calendar/                # MonthView, DayCell, FloatingAction, layout utils
    camera/                  # CameraViewfinder, CameraControls, CameraPreview, CameraPermission
    day/                     # MediaPager, DayHeader, DayJournalRow, ReorderModal,
                             # MediaLightbox, DeleteConfirmModal, media-card/
    editor/                  # MediaFrame, DraggableCaption, DateStampOverlay,
                             # CaptionPanel, TrimPanel, TrimControls, ClipDurationPicker,
                             # VolumePanel, EditorHeader, EditorTabBar, EditorActions
    journal/                 # JournalEditor modal, MoodPicker
  data/
    quotes.ts                # Rotating daily writing prompts
    emoji.tsx / emojis/      # SVG-backed mood emoji components
  db/
    schema.ts                # Drizzle table definitions
    index.ts                 # openDatabaseSync + migrateDb()
    migrations/              # Auto-generated SQL files
  hooks/
    useClipBlock.ts          # Video clip drag/tap/step gestures + Reanimated styles
    useEditorSave.ts         # Photo burn-in / video copy / DB write / pref persist
    useEditorVideo.ts        # expo-video player + 50 ms playhead SharedValue
    useThumbnails.ts         # 10-frame async thumbnail generation
    useCameraReady.ts        # Promise-gate for CameraView readiness
    useEntryMedia.ts         # Load, delete, reorder media for open day
    useJournalEditor.ts      # Open/close state + debounced journal save
    useMediaPermissions.ts   # Camera + library permission flow
    useRecordingTimer.ts     # Elapsed seconds counter during recording
  repositories/
    entry.repository.ts      # CRUD for entries table
    media.repository.ts      # CRUD for media table
  service/
    media.service.ts         # Copy/delete files in {DocumentDirectory}/media/
  store/
    editor.store.ts          # pendingMedia — bridge from camera to editor
    entry.store.ts           # currentEntry + entriesCache (batch-loaded for calendar)
    media.store.ts           # recentlySavedMediaURI — signals day screen to refresh
    settings.store.ts        # All settings, persisted to app-settings.json
  themes/                    # 5 named themes: sage, vanilla, blossom, cotton, dusk
  theme.ts                   # Active theme export (currently: sage)
  types/index.ts             # Mood, CaptionStyle, DateStampStyle, AspectRatio, etc.
  utils/
    date.ts                  # todayDateKey()
    time.ts                  # fmt(seconds) → "M:SS.s"
```

---

## Data model

**entries** — one row per calendar day

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | autoincrement |
| `date` | TEXT UNIQUE | `YYYY-MM-DD` |
| `journal` | TEXT | nullable |
| `mood` | TEXT | `happy \| calm \| neutral \| sad \| angry` |
| `cover_media_id` | INTEGER | nullable FK → media.id |
| `createdAt` / `updatedAt` | INTEGER | Unix timestamps |

**media** — one or more rows per entry

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | autoincrement |
| `entry_id` | INTEGER | FK → entries.id |
| `type` | TEXT | `image \| video` |
| `uri` | TEXT | Path in app-managed storage |
| `caption` | TEXT | nullable |
| `duration` | INTEGER | nullable, seconds |
| `order` | INTEGER | display order within the entry |
| `createdAt` | INTEGER | Unix timestamp |

---

## Storage layout

All data is private to the app — no cloud sync, no remote backend.

```
{DocumentDirectory}/
  daylapse.db          # SQLite database
  app-settings.json    # Persisted settings (JSON)
  media/               # All photo and video files (timestamped filenames)
```

---

## State and caching

The entry store pre-loads all entries in the visible calendar range with one batched DB query on calendar mount. Opening any previously visited day is instant — no loading state. Mood and journal updates are optimistic: the UI updates immediately and the DB write happens in the background.

The editor prefs (caption style, date stamp style, volume, date stamp toggle) are persisted automatically on every successful save so the next editor session restores the last-used settings.

---

## Themes

Five built-in colour themes. Change the active theme by updating the import in `src/theme.ts`:

| Theme | Background | Primary accent |
|---|---|---|
| **sage** (default) | Cornsilk `#FEFAE0` | Light Bronze `#D4A373` |
| vanilla | Warm white | Warm sand |
| blossom | Blush white | Dusty rose |
| cotton | Pure white | Soft blue |
| dusk | Deep navy | Warm purple |

---

## Running locally

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go to preview on device.

For a production or standalone build:

```bash
# Android
npx expo run:android

# iOS
npx expo run:ios
```

Required device permissions (prompted at runtime):
- Camera
- Microphone
- Photo library read + write
