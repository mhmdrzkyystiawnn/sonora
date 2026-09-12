# sonora — backend design guideline

> wajib dibaca sebelum bikin module/endpoint baru di `apps/api`. tujuannya: konsisten sama pola yang udah jalan, ga ada arsitektur nyimpang per-module.

---

## 1. struktur module — WAJIB pola ini

Tiap domain (`discovery`, `artist`, `music`, dst) punya 3 file:

```
modules/<domain>/
├── <domain>.routes.ts       # binding route → controller
├── <domain>.controller.ts   # terima req/res, panggil service, next(error)
└── <domain>.service.ts      # logic asli: call integration, transform data
```

**Controller SELALU tipis** — cuma try/catch + delegasi ke service, ga ada business logic di sini:

```typescript
export async function getPopularTracks(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const tracks = await discoveryService.getPopularTracks();
    res.json(tracks);
  } catch (error) {
    next(error);
  }
}
```

**Service isi actual logic** — panggil integration client, transform/shape data balik ke bentuk yang dipakai frontend (bukan nge-passthrough response mentah dari API eksternal).

Response ke client **langsung array/object hasil transform**, bukan dibungkus `{ data: ... }` atau `{ success: true, ... }` — ikutin pola `res.json(tracks)` yang udah ada.

---

## 2. error handling

Semua error pakai class dari `lib/api-error.ts`, jangan `throw new Error(...)` polos:

```typescript
export class ApiError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "resource not found") {
    super(404, message);
    this.name = "NotFoundError";
  }
}

export class BadRequestError extends ApiError {
  constructor(message = "bad request") {
    super(400, message);
    this.name = "BadRequestError";
  }
}
```

- Service/integration throw `ApiError` (atau subclass-nya) kalau ada error yang perlu di-propagate ke client dengan status code jelas.
- Controller **selalu** `try/catch` → `next(error)`, ga pernah nangani error manual di controller.
- Butuh error baru (misal `UnauthorizedError`, `RateLimitError`)? Extend `ApiError`, taruh di `lib/api-error.ts`, jangan bikin class error terpisah di file lain.

---

## 3. integration client — pola wajib

Tiap integration (`integrations/<provider>/<provider>.client.ts`) tanggung jawab:
1. Call HTTP ke API eksternal
2. Handle response bukan-ok (`if (!response.ok) throw new Error(...)`)
3. Return data dalam bentuk typed, service yang transform lebih lanjut

### Env var wajib via `getRequiredEnv`

API key/secret provider eksternal **ga boleh** diakses langsung via `process.env.X` di banyak tempat. Wajib lewat helper yang fail-fast saat startup kalau env var kosong:

```typescript
function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not defined`);
  }
  return value;
}

const apiKey = getRequiredEnv("LASTFM_API_KEY");
```

Panggil `getRequiredEnv` di **module-level** (bukan di dalam function), biar error muncul pas server start kalau env var lupa di-set — bukan baru ketahuan pas ada request masuk.

### Generic request wrapper

Pola `lastfm.client.ts`: satu fungsi generic `<T>` yang handle URL building + auth param + format param, dipanggil dengan `method` + params spesifik dari service:

```typescript
export async function lastFmRequest<T>(params: Record<string, string>): Promise<T> {
  const searchParams = new URLSearchParams(params);
  searchParams.set("api_key", apiKey);
  searchParams.set("format", "json");

  const response = await fetch(`${lastFmApiUrl}?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error(`last.fm request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}
```

Provider baru yang API-nya sejenis (satu base URL, banyak "method"/endpoint lewat query param) ikutin pola ini: satu wrapper generic, bukan satu function per endpoint.

> ⚠️ **Known gap**: `lastFmRequest` throw `Error` polos, bukan `ApiError`. Ini nyimpang dari aturan section 2. Kalau bikin integration client baru, **jangan tiru bagian ini** — lempar `ApiError` (misal status 502, karena ini kegagalan upstream, bukan kesalahan request dari client kita) biar konsisten. `lastfm.client.ts` yang existing perlu di-fix terpisah, bukan dijadiin acuan buat kode baru.

### Placeholder/junk data filtering

Beberapa API eksternal balikin "data kosong" yang bentuknya bukan `null`/`undefined`, tapi placeholder asset (kayak Last.fm yang balikin hash gambar generik kalau artist/track ga punya cover asli). Wajib difilter eksplisit, jangan anggap field yang "ada isinya" otomatis valid:

```typescript
const LASTFM_PLACEHOLDER_HASH = "2a96cbd8b46e442fc41c2b86b821562f";

export function isLastFmPlaceholder(url?: string) {
  if (!url) return true;
  return url.includes(LASTFM_PLACEHOLDER_HASH);
}
```

Hash placeholder ini didapat dari observasi respons asli (lihat section 4) — kalau nemu provider lain yang punya pola serupa, cari tahu placeholder-nya via curl juga, jangan asumsi ga ada.

### Fallback berjenjang untuk data bervariasi

Kalau API eksternal balikin data dalam beberapa "kualitas"/size (Last.fm: `extralarge` → `large` → `medium` → `small`), coba dari yang paling diinginkan turun ke fallback, dan **skip yang keisi placeholder** di setiap level:

```typescript
const preferredSizes = ["extralarge", "large", "medium", "small"];

for (const size of preferredSizes) {
  const image = images.find(
    (item) => item.size === size && item["#text"] && !isLastFmPlaceholder(item["#text"]),
  );
  if (image?.["#text"]) return image["#text"];
}

return undefined;
```

Kalau semua level fallback exhausted dan tetap kosong, return `undefined` — biarkan konsumen (service/frontend) yang decide fallback lanjutan (contoh: `discovery.service.ts` fallback ke `getCoverArtFromITunes` kalau Last.fm image `undefined`).

### Caching (dari `itunes.client.ts`)

Integration yang punya cost/rate-limit wajib pakai in-memory cache dengan TTL:

```typescript
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const cache = new Map<string, { url?: string; expiresAt: number }>();

const cached = cache.get(key);
if (cached && cached.expiresAt > Date.now()) return cached.url;

cache.set(key, { url, expiresAt: Date.now() + CACHE_TTL_MS });
```

Cache hasil negatif juga (fetch gagal/data ga ketemu → tetap cache `undefined` dengan TTL sama), biar request gagal berulang ga nge-hit API eksternal terus.

---

## 4. VERIFIKASI API PIHAK KETIGA — WAJIB, GA BOLEH SPEKULASI

Ini aturan paling ketat di guideline ini karena paling gampang jadi sumber bug diam-diam.

**Sebelum nulis kode yang parsing/consume response dari API eksternal (Last.fm, iTunes, atau provider baru manapun):**

1. **Nyalakan backend**, lalu **curl langsung** endpoint yang mau dipakai — jangan asumsi struktur response dari dokumentasi provider doang (dokumentasi bisa outdated atau field-nya conditional).
   ```bash
   curl "https://ws.audioscrobbler.com/2.0/?method=chart.gettoptracks&api_key=<key>&format=json&limit=5" | jq
   ```
2. **Cocokkan struktur JSON asli** ke type yang bakal ditulis (misal `LastFmTopTracksResponse`) — field opsional (`?`) di type harus based on observasi nyata (ada kasus field-nya hilang), bukan tebakan defensif.
3. **Kalau field yang dibutuhkan ternyata nggak konsisten ada/nggak ada** (kadang muncul kadang nggak di response asli), baru putuskan optional-nya di type + fallback logic-nya — keputusan itu harus berdasar hasil curl, dicatat sebagai komentar singkat kalau perlu.
4. **Kalau curl gagal dieksekusi** — API key belum ada, endpoint butuh network yang nggak tersedia di environment saat itu, atau alasan lain yang bikin verifikasi ga bisa dilakukan — **bilang eksplisit ke user**: "aku belum bisa verifikasi response asli karena [alasan], jadi kode ini based on dokumentasi/asumsi, tolong verifikasi manual sebelum merge." **Jangan** nulis kode seolah-olah udah diverifikasi kalau kenyataannya belum.
5. Larangan ini juga berlaku pas **debugging** — kalau ada bug yang diduga soal shape response API eksternal, curl ulang endpoint-nya buat konfirmasi, jangan nebak dari baca kode lama doang.

### ❌ Jangan
> "Last.fm biasanya balikin field `listeners` sebagai string, jadi aku asumsikan gitu" — tanpa pernah curl.

### ✅ Harus
> `curl` endpoint asli → lihat `listeners` emang string → baru tulis `listeners?: string` di type dengan yakin, atau kalau ga sempat curl → bilang ke user itu asumsi belum terverifikasi.

---

## 5. shared types & validation (zod)

- Type yang dipakai bareng frontend-backend taruh di `packages/shared/src/schemas/`, bukan didefinisikan ulang di `apps/api` maupun `apps/web`.
- Pola: `xSchema` (zod schema) → `type X = z.infer<typeof xSchema>` diexport bareng.
- Response type internal integration (misal `LastFmTopTracksResponse`) yang **cuma dipakai buat parsing response mentah API eksternal** (bukan dikirim ke frontend) **ga perlu** masuk `packages/shared` — cukup type lokal di service/client-nya, kayak contoh `LastFmTopTracksResponse` di `discovery.service.ts`. Yang masuk `packages/shared` cuma shape data yang **keluar** dari API sonora sendiri ke client.

---

## 6. checklist sebelum commit endpoint/module baru

- [ ] Controller cuma try/catch + delegasi, ga ada logic
- [ ] Error pakai `ApiError`/subclass dari `lib/api-error.ts`, bukan `throw new Error()` polos
- [ ] Integration eksternal yang punya cost/rate-limit dikasih cache + TTL (termasuk cache hasil negatif)
- [ ] Env var/API key baru diakses lewat `getRequiredEnv`, dipanggil di module-level
- [ ] Kalau nulis/ubah kode yang consume API eksternal: **udah di-curl langsung**, struktur type based on response asli — atau kalau belum sempat, **udah bilang eksplisit ke user** itu masih asumsi
- [ ] Shared type publik (yang dikirim ke frontend) ada di `packages/shared`, type internal parsing API eksternal cukup lokal
- [ ] Response ke client konsisten `res.json(data)` langsung, ga dibungkus wrapper baru yang beda dari pola existing