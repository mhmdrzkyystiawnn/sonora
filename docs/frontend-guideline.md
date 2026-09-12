# sonora — frontend design guideline

> wajib dibaca sebelum bikin komponen UI apapun di `apps/web`. tujuannya: semua screen konsisten, ga ada styling liar di luar sistem yang udah ditentuin.

---

## 1. prinsip utama

1. **shadcn/ui dulu, custom kemudian.** Sebelum bikin komponen manual (button, card, dialog, dll), cek dulu apakah shadcn punya. Kalau ada, `pnpm dlx shadcn@latest add <component>` — jangan reinvent.
2. **Semua warna lewat CSS variable/theme token**, ga pernah hardcode hex/rgb di JSX atau className.
3. **Tailwind utility classes**, bukan inline `style={{}}` — kecuali buat nilai yang bener-bener dinamis dari JS (misal width dari progress bar).
4. **Radius, spacing, font ikut token yang udah didefinisikan** di `index.css`, ga bikin skala sendiri.
5. **Layout editorial, bukan grid seragam.** Jangan default ke grid kotak-kotak sama besar buat semua konten (lihat §9). Prioritaskan hero/featured item + list-view atau slider kalau datanya punya elemen unggulan.

---

## 2. warna — WAJIB pakai token ini, jangan hardcode

| Token Tailwind | Variable | Hex | Dipakai untuk |
|---|---|---|---|
| `bg-background` | `--background` | `#0a1e30` | background utama app |
| `text-foreground` | `--foreground` | `#f4ecdd` | teks utama |
| `bg-card` / `text-card-foreground` | `--card` | `#102a41` | card, panel |
| `bg-popover` / `text-popover-foreground` | `--popover` | `#102a41` | dropdown, popover, tooltip |
| `bg-primary` / `text-primary-foreground` | `--primary` | `#5b9bd1` / `#0a1e30` | tombol utama, link aktif, highlight |
| `bg-secondary` / `text-secondary-foreground` | `--secondary` | `#2c4d68` / `#f4ecdd` | tombol sekunder |
| `bg-muted` / `text-muted-foreground` | `--muted` | `#142f47` bg / `#9db3c4` text | teks kurang penting, placeholder, disabled |
| `bg-accent` / `text-accent-foreground` | `--accent` | `#1a3651` / `#f4ecdd` | hover state, selected item |
| `bg-destructive` / `text-destructive-foreground` | `--destructive` | `#7a2a1f` / `#f4ecdd` | error, delete, warning |
| `border-border` | `--border` | `#22415c` | semua border |
| `border-input` | `--input` | `#22415c` | border form field |
| `ring-ring` | `--ring` | `#5b9bd1` | focus ring |

Palet ini biru sebagai satu-satunya hue dominan (deep navy → biru-slate), dipadu cream/off-white (`--foreground`) sebagai warna teks hangat. **Jangan** masukin warna di luar keluarga biru+netral (pink, hijau, dst) ke token utama — kalau butuh warna semantik baru (misal "success"), tambahin token baru di `:root`/`.dark`, jangan hardcode inline.

### ❌ Jangan
```tsx
<div className="bg-[#0a1e30] text-[#f4ecdd]">
<div style={{ backgroundColor: '#5b9bd1' }}>
```

### ✅ Harus
```tsx
<div className="bg-background text-foreground">
<Button className="bg-primary text-primary-foreground">
```

Kalau butuh warna yang ga ada di token — **jangan hardcode**, tambahin dulu token barunya di `:root` dan `.dark` di `index.css`.

---

## 3. komponen — urutan pengecekan

1. **Sudah ada di shadcn?** → install (`button`, `card`, `input`, `dialog`, `dropdown-menu`, `avatar`, `skeleton`, `badge`, `tabs`, `separator`, `sonner`, dll)
2. **Sudah pernah dibikin custom di project ini?** → reuse dari `apps/web/src/components/`, jangan duplikat
3. **Belum ada di keduanya?** → bikin baru, tapi **compose dari primitive shadcn**

### Komponen shadcn buat artist frontend

| Kebutuhan | Komponen shadcn |
|---|---|
| Search input | `Input` + `Button` |
| Artist card | `Card`, `CardContent`, `CardHeader` |
| Avatar artist | `Avatar`, `AvatarImage`, `AvatarFallback` |
| Loading state | `Skeleton` |
| Error state | `Alert` |
| Tags | `Badge` |
| Bio expandable | `Collapsible` |
| Top tracks list | `Table` atau list + `Separator` |
| Toast notif | `Sonner` |

Install yang belum ada:
```bash
pnpm dlx shadcn@latest add card avatar skeleton alert badge collapsible separator sonner
```

---

## 4. layout & spacing

- Pakai skala spacing Tailwind default (`p-4`, `gap-6`, `space-y-4`) — **jangan** `p-[13px]`.
- Radius ikut token: `rounded-lg`, `rounded-xl`, `rounded-2xl`. Jangan `rounded-[10px]`.
- Container utama page: `max-w-5xl mx-auto px-4`.
- Kasih whitespace lega antar section (`space-y-16` s/d `space-y-28` di page level) — elemen premium ga pernah terasa berdesakan.

---

## 5. state pattern (loading / error / empty) — WAJIB

```tsx
if (isLoading) return <ArtistCardSkeleton />;
if (isError) return <Alert variant="destructive">...</Alert>;
if (!data || data.length === 0) return <EmptyState />;

return <ArtistList data={data} />;
```

Skeleton harus **mirror bentuk komponen asli** (kalau card punya image + 2 baris teks, skeleton juga gitu). Kalau satu section punya sub-layout berbeda (misal hero + list), pisahkan skeleton & error jadi komponen kecil sendiri per section (`SectionSkeleton`, `SectionError`) — jangan satu blok besar dengan banyak nested ternary, biar gampang di-maintain dan ga rawan mismatch bracket.

---

## 6. dark mode

Theme kamu sekarang `:root` dan `.dark` isinya **sama persis** — ini emang **single dark theme**, bukan dual-mode. Jangan bikin toggle dark/light sampai ada keputusan eksplisit buat bikin light theme yang beda.

---

## 7. font

Ada 3 font family, masing-masing peran fix — jangan tuker fungsi:

| Token | Font | Dipakai untuk |
|---|---|---|
| `font-sans` (default) | Geist Variable | Body text, UI element (nav, button, form, label, deskripsi) |
| `font-display` | Beautique Display (bold) | Heading besar/editorial (`h1` hero, judul featured item) — bukan buat body/UI |
| `font-script` | Classique Script | Logo/brand mark & aksen dekoratif kecil saja — **jangan** dipakai buat teks yang harus gampang dibaca cepat (nav, body, label form) |

- Butuh hierarchy di dalam `font-sans`/`font-display`? Mainkan `font-weight` dan `text-{size}`, jangan ganti-ganti font-family di luar 3 role di atas.
- Nav item & label kategori pakai `text-xs uppercase tracking-widest` biar konsisten sama nuansa editorial (contoh: `Discover`, `Search Music`, label "editorial pick").

---

## 8. checklist sebelum commit komponen baru

- [ ] Ga ada hex/rgb hardcoded di className atau style
- [ ] Semua warna pakai token (`bg-primary`, bukan `bg-pink-400` atau warna di luar keluarga biru+netral)
- [ ] Font sesuai role (`font-sans` body/UI, `font-display` heading besar, `font-script` cuma buat aksen/logo)
- [ ] Komponen shadcn dipakai kalau tersedia
- [ ] Loading, error, empty state ada semua (kalau fetch data), dipecah per-section kalau section-nya kompleks
- [ ] Radius & spacing pakai skala default Tailwind
- [ ] Layout ga default ke grid kotak seragam kalau ada elemen yang bisa ditonjolkan (lihat §9)
- [ ] Responsive dicek minimal mobile + desktop

---

## 9. pola layout editorial

Referensi: halaman `Discovery`.

- **Featured/hero item**: kalau ada list data dan salah satu item bisa ditonjolkan (item pertama, trending, dsb), tampilkan lebih besar terpisah dari list biasa — bukan card seragam di grid.
- **List-view**: buat data sekuensial (misal tracks), pakai list vertikal dengan nomor urut + `border-b` tipis, bukan card kotak ber-background solid untuk tiap item.
- **Horizontal slider**: buat data yang cocok ditampilkan sebagai koleksi yang di-scroll (misal artists), pakai `overflow-x-auto` + `snap-x snap-mandatory`, card portrait (`aspect-[3/4]`) dengan overlay gradient buat teks di atas gambar, bukan grid card sejajar.
- Icon dekoratif di section header (misal ikon play segitiga) — lebih baik diganti garis aksen vertikal tipis (`bg-primary`) kalau proporsinya janggal, daripada dipaksa pakai ikon literal.