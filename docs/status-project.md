# sonora — roadmap

> aplikasi eksplorasi musik berbasis last.fm dengan arsitektur monorepo, shared package, backend api, dan frontend vite.

---

## 1. project setup

### status: ✅ selesai

- [x] setup monorepo
- [x] setup pnpm workspace
- [x] struktur `apps/`
- [x] frontend vite + react + typescript
- [x] backend api
- [x] package `@sonora/shared`
- [x] konfigurasi typescript antar package
- [x] shared package bisa digunakan oleh frontend dan backend
- [x] command `shared:add` untuk menambahkan package shared ke frontend/backend
- [x] backend bisa menjalankan typescript menggunakan `tsx`
- [x] backend typecheck menggunakan `tsc --noEmit`

---

## 2. shared package

### status: ✅ selesai

- [x] setup package `@sonora/shared`
- [x] shared types
- [x] shared zod schemas
- [x] `musicSchema`
- [x] `artistSchema`
- [x] frontend menggunakan type dari shared
- [x] backend menggunakan schema dari shared
- [x] validasi response menggunakan zod

---

## 3. last.fm integration

### status: ✅ selesai

- [x] membuat last.fm api client
- [x] konfigurasi `LASTFM_API_KEY`
- [x] generic `lastFmRequest()`
- [x] query parameter otomatis:
  - [x] `api_key`
  - [x] `format=json`
- [x] error handling untuk request last.fm
- [x] mendapatkan api key last.fm
- [x] test request ke last.fm berhasil

### endpoint last.fm yang sudah digunakan

- [x] `track.search`
- [x] `artist.search`
- [x] `artist.getinfo`
- [x] `artist.gettoptracks`

---

## 4. last.fm image handling

### status: ✅ selesai

last.fm kadang mengembalikan gambar placeholder.

sudah dibuat:

- [x] `isLastFmPlaceholder()`
- [x] `getLastFmImageUrl()`
- [x] deteksi placeholder image last.fm
- [x] mencari ukuran image berdasarkan prioritas:
  - [x] extralarge
  - [x] large
  - [x] medium
  - [x] small
- [x] mengembalikan `undefined` kalau hanya placeholder

---

## 5. itunes image fallback

### status: ✅ selesai

karena last.fm search sering memberikan placeholder image, digunakan itunes sebagai fallback.

- [x] membuat integration client itunes
- [x] request ke itunes search api
- [x] mencari cover berdasarkan artist + track
- [x] mengubah artwork `100x100` menjadi `600x600`
- [x] image fallback ketika last.fm tidak mempunyai image valid
- [x] memory cache untuk cover art
- [x] cache ttl 24 jam
- [x] mencegah request itunes berulang untuk lagu yang sama

alur image:

```text
last.fm image
     │
     ├── valid ────────> gunakan last.fm
     │
     └── placeholder
              │
              ▼
       itunes search api
              │
              ├── ditemukan ──> gunakan itunes
              │
              └── tidak ditemukan ──> undefined
```

## 6. music module

status: ✅ selesai

struktur module sudah dibuat.
```text
modules/
└── music/
    ├── music.controller.ts
    ├── music.service.ts
    └── music.routes.ts
```

### fitur
 - search music
 - query parameter q
 - validasi query kosong
 - request ke last.fm
 - mapping response last.fm
 - enrichment cover art menggunakan itunes
 - validasi hasil menggunakan musicSchema
 - response { data: [...] }
 - error handling
 - endpoint get /api/music/search?q=wonderwall

## 7. artist module
status: 🟡 backend selesai

struktur:

modules/
└── artist/
    ├── artist.controller.ts
    ├── artist.service.ts
    └── artist.routes.ts
artist search
 search artist
 artist.search
 query parameter q
 sorting berdasarkan listeners
 mengambil maksimal 10 hasil
 last.fm image handling
 validasi menggunakan artistSchema

endpoint:

get /api/artists/search?q=oasis
artist detail
 mendapatkan informasi artist
 artist.getinfo
 listeners
 playcount
 image
 bio
 tags
 members/content dari response last.fm
 membersihkan html dari bio
 validasi menggunakan artistSchema

endpoint:

get /api/artists/:artist

contoh:

get /api/artists/oasis
artist top tracks
 mendapatkan top tracks artist
 artist.gettoptracks
 track name
 artist
 url
 playcount
 last.fm image
 itunes fallback image

endpoint:

get /api/artists/:artist/tracks

contoh:

get /api/artists/oasis/tracks
8. api routing
status: 🟡 sebagian selesai
 music routes
 artist routes
 controller/service separation
 module-based routing
 api response menggunakan { data }
yang perlu dicek
 semua module sudah diregister di root router
 semua endpoint dites dari browser/postman
 error response dibuat konsisten
 404 handler
 global error handler
9. cors
status: ✅ selesai
 frontend berjalan di localhost:5173
 backend berjalan di localhost:3000
 menemukan masalah cors
 memperbaiki cors backend
 frontend dapat request ke backend

arsitektur sekarang:

vite
localhost:5173
      │
      │ http
      ▼
express api
localhost:3000
      │
      ▼
last.fm / itunes
10. frontend
status: 🟡 dasar selesai

frontend sudah memiliki:

 vite
 react
 typescript
 tailwind
 shadcn
 geist font
 search input
 search button
 loading state
 error state
 empty state
 music result list
 cover art
 fallback icon
 artist name
 track title
 playcount
 link ke last.fm
11. frontend theme
status: 🟡 sudah ditentukan

palette sonora:

#51331b
#dee6bf
#d2deeb
#e58b9e
#550600
penggunaan warna
#51331b
primary dark / brown

#dee6bf
cream / light background

#d2deeb
soft blue

#e58b9e
pink accent

#550600
deep red / dark accent
yang masih perlu
 finalisasi design system
 dark mode
 hover states
 focus states
 skeleton loading
 responsive mobile
 typography hierarchy
 consistent spacing
12. frontend music search
status: 🟡 functional

sudah bisa:

user
 │
 ▼
search input
 │
 ▼
vite frontend
 │
 ▼
GET /api/music/search?q=...
 │
 ▼
backend
 │
 ▼
last.fm
 │
 ▼
itunes fallback
 │
 ▼
response
 │
 ▼
frontend
 │
 ▼
music cards
yang masih perlu
 debounce search
 abort request lama
 pagination / load more
 better loading state
 image loading state
 image error fallback
 duplicate result handling
 search history
13. artist frontend
status: ❌ belum

backend sudah siap, frontend belum dibuat.

target
artist search
search
   │
   ▼
artist results
   │
   ├── image
   ├── name
   ├── listeners
   └── playcount
artist detail
artist page

├── hero
│   ├── image
│   ├── name
│   ├── listeners
│   └── playcount
│
├── bio
│
├── tags
│
└── top tracks
    ├── title
    ├── artist
    ├── image
    └── playcount
14. music detail
status: ❌ belum

rencana:

get /api/music/:artist/:track

fitur:

 track detail
 album
 artist
 duration
 playcount
 listeners
 tags
 cover
 similar tracks
15. discovery
status: ❌ belum

fitur yang direncanakan:

 trending music
 popular tracks
 popular artists
 similar artists
 similar tracks
 top charts
 genre/tag discovery

contoh:

discover

popular tracks
────────────────────
track 1
track 2
track 3

popular artists
────────────────────
artist 1
artist 2
artist 3

trending
────────────────────
...
16. user system
status: ❌ belum
 authentication
 register
 login
 logout
 session
 user profile
 avatar
 preferences
17. music library
status: ❌ belum
 favorite tracks
 favorite artists
 playlists
 save music
 remove music
 recently viewed
 search history
18. database
status: ❌ belum

database belum menjadi bagian utama aplikasi.

rencana tabel:

users
profiles
favorites
playlists
playlist_tracks
search_history

relasi:

users
 │
 ├── profile
 ├── favorites
 ├── playlists
 │      │
 │      └── playlist_tracks
 │
 └── search_history
19. recommendation system
status: ❌ belum

setelah data musik sudah stabil:

 similar artists
 similar tracks
 recommendation berdasarkan history
 recommendation berdasarkan favorite
 recommendation berdasarkan genre
 personalized discovery
20. quality & production
status: ❌ belum
 unit test
 integration test
 api test
 frontend test
 lint
 typecheck semua workspace
 environment validation
 rate limiting
 request logging
 error logging
 api documentation
 production build
21. deployment
status: ❌ belum

frontend:

vite/react
      │
      ▼
deployment

backend:

express
   │
   ▼
deployment

yang perlu:

 deploy frontend
 deploy backend
 configure production env
 configure cors production
 configure last.fm api key
 configure itunes fallback
 production smoke test
milestone

milestone 1 — foundation

status: ✅

 monorepo
 pnpm
 vite
 express
 shared package
 typescript
 zod
milestone 2 — music api

status: ✅

 last.fm client
 music module
 music search
 itunes fallback
 image cache
 cors
 api validation
milestone 3 — artist api

status: 🟡

 artist search
 artist detail
 artist top tracks
 image fallback
 test seluruh endpoint
 finalisasi error handling
milestone 4 — frontend experience

status: 🟡

 music search ui
 result cards
 loading
 error
 empty state
 theme palette
 artist search ui
 artist detail page
 top tracks ui
 responsive design
 skeleton loading
milestone 5 — discovery

status: ❌

 discover page
 popular tracks
 popular artists
 similar artists
 similar tracks
 tags / genres
milestone 6 — user features

status: ❌

 auth
 profile
 favorites
 playlists
 history
milestone 7 — recommendation

status: ❌

 personalized recommendation
 recommendation engine
 user taste profile
milestone 8 — production

status: ❌

 testing
 security
 logging
 api documentation
 deployment
 production environment
current architecture
sonora/
│
├── apps/
│   │
│   ├── web/
│   │   └── vite + react + typescript
│   │
│   └── api/
│       │
│       ├── integrations/
│       │   ├── lastfm/
│       │   │   ├── lastfm.client.ts
│       │   │   └── lastfm.utils.ts
│       │   │
│       │   └── itunes/
│       │       └── itunes.client.ts
│       │
│       └── modules/
│           │
│           ├── music/
│           │   ├── music.controller.ts
│           │   ├── music.service.ts
│           │   └── music.routes.ts
│           │
│           └── artist/
│               ├── artist.controller.ts
│               ├── artist.service.ts
│               └── artist.routes.ts
│
└── packages/
    │
    └── shared/
        ├── schemas/
        ├── types/
        └── index.ts
next step

prioritas pengerjaan sekarang:

1. finish artist api
        ↓
2. test artist endpoints
        ↓
3. create artist api client di vite
        ↓
4. artist search ui
        ↓
5. artist detail page
        ↓
6. top tracks section
        ↓
7. discovery page
        ↓
8. auth + database
        ↓
9. favorites / playlist
        ↓
10. recommendation ai integration
        ↓
11. testing + production
current status
foundation        ████████████████████ 100%
music api         ████████████████████ 100%
artist api        █████████████████░░░  85%
music frontend    █████████████████░░░  85%
artist frontend   ░░░░░░░░░░░░░░░░░░░░   0%
discovery         ░░░░░░░░░░░░░░░░░░░░   0%
auth              ░░░░░░░░░░░░░░░░░░░░   0%
library           ░░░░░░░░░░░░░░░░░░░░   0%
recommendation    ░░░░░░░░░░░░░░░░░░░░   0%
production        ░░░░░░░░░░░░░░░░░░░░   0%

jadi posisi kita sekarang: backend music udah mateng, artist api udah hampir beres, dan next yang paling masuk akal adalah nyambungin artist api ke vite lalu bikin halaman artist detail. jangan loncat ke auth/database dulu, nanti malah jadi spaghetti sebelum core fitur sonora kelar, wkwk.