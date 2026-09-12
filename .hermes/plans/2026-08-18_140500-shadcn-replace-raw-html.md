# Shadcn UI Component Migration Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Replace all raw HTML form/input/button elements with shadcn UI components across the frontend.

**Architecture:** The project uses base-ui primitives wrapped with class-variance-authority (cva) for shadcn-style components. Button, Card, Alert, Avatar, Skeleton, Badge, Collapsible, Dialog, and Separator already exist. Need to create Input, Textarea, Label, and FormField wrapper components, then migrate all usages.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, @base-ui/react primitives, class-variance-authority, cn utility.

---

## Current State Analysis

### Existing shadcn components (apps/web/src/components/ui/):
- `button.tsx` - Button with variants (default, outline, secondary, ghost, destructive, link) and sizes
- `card.tsx` - Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter
- `alert.tsx` - Alert, AlertTitle, AlertDescription, AlertAction
- `avatar.tsx` - Avatar, AvatarImage, AvatarFallback
- `skeleton.tsx` - Skeleton
- `badge.tsx` - Badge
- `collapsible.tsx` - Collapsible, CollapsibleTrigger, CollapsibleContent
- `dialog.tsx` - DialogRoot, DialogPortal, DialogBackdrop, DialogPopup, DialogTitle, DialogDescription, DialogClose
- `separator.tsx` - Separator

### Missing shadcn components needed:
- `input.tsx` - Input component with variants/sizes
- `textarea.tsx` - Textarea component
- `label.tsx` - Label component
- `form.tsx` - FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage (optional, for react-hook-form integration)

---

## Files Requiring Migration

### 1. **apps/web/src/pages/GenreDetail.tsx** (priority - mentioned in issue)
- Lines 219, 229, 243: Pagination buttons (3x `<button>` with custom classes) → Button component
- No form inputs in this file

### 2. **apps/web/src/pages/ArtistSearch.tsx** (lines 60-82)
- Line 67: `<input>` search field → Input component
- Line 75: `<button type="submit">` → Button component
- Line 60: `<form>` → keep native or Form wrapper

### 3. **apps/web/src/pages/MusicSearch.tsx** (lines 57-79)
- Line 64: `<input>` search field → Input component
- Line 72: `<button type="submit">` → Button component

### 4. **apps/web/src/pages/Discovery.tsx** (lines 464-532)
- Line 471: `<input>` mood field → Input component
- Line 479: `<button type="submit">` → Button component
- Line 520: `<button type="button">` save playlist → Button component

### 5. **apps/web/src/pages/Library.tsx** (multiple locations)
- Line 144: `<button>` remove favorite → Button (icon variant, size="icon")
- Line 276: `<textarea>` playlist prompt → Textarea component
- Line 284: `<button>` rewrite with AI → Button component
- Line 306: `<input>` playlist name → Input component
- Line 322: `<textarea>` playlist description → Textarea component
- Line 344: `<DialogClose>` - already shadcn
- Line 346: `<button>` create playlist → Button component
- Line 414: `<button>` new playlist → Button component
- Lines 584, 596: unfollow buttons → Button (icon variant)
- Line 622: tab buttons (favorites/playlists/following) → Button variant="ghost" or custom

### 6. **apps/web/src/pages/PlaylistDetail.tsx** (lines 207-358)
- Line 207: `<input>` playlist name (edit mode) → Input component
- Line 212: `<textarea>` playlist description (edit mode) → Textarea component
- Lines 220, 230, 261, 271, 280, 291: 6x `<button>` actions → Button components
- Line 353: `<button>` remove track → Button (icon variant, size="icon")

### 7. **apps/web/src/pages/Login.tsx** (lines 53-102)
- Line 55-59: `<label>` + `<input>` email → Label + Input components
- Line 73-79: `<label>` + `<input>` password → Label + Input components
- Line 96: `<button type="submit">` → Button component

### 8. **apps/web/src/pages/Register.tsx** (lines 54-123)
- Line 56-60: `<label>` + `<input>` displayName → Label + Input
- Line 75-81: `<label>` + `<input>` email → Label + Input
- Line 93-99: `<label>` + `<input>` password → Label + Input
- Line 117: `<button type="submit">` → Button component
- Has `inputClass` constant - good candidate for Input component default

### 9. **apps/web/src/components/AddToPlaylistButton.tsx** (lines 70, 114, 148)
- Line 70: `<button>` trigger → Button component
- Line 114: `<button>` playlist items → Button component
- Line 148: `<DialogClose>` - already shadcn, but custom class

### 10. **apps/web/src/components/AddTrackSearch.tsx** (lines 70, 110)
- Line 70: `<input>` search → Input component
- Line 110: `<button>` add track → Button (icon variant, size="icon")

### 11. **apps/web/src/components/AudioPreviewButton.tsx** (line 33)
- Line 33: `<button>` play/pause → Button (icon variant, size="icon")

### 12. **apps/web/src/components/Navbar.tsx** (line 144)
- Line 144: `<button>` logout → Button component

### 13. **apps/web/src/components/NotificationBell.tsx** (lines 31, 58, 82)
- Line 31: `<button>` bell toggle → Button (icon variant, size="icon")
- Line 58: `<button>` mark all read → Button component
- Line 82: `<button>` notification items → Button component

### 14. **apps/web/src/components/FavoriteButton.tsx** - need to check
### 15. **apps/web/src/components/FollowButton.tsx** - uses Button already ✓

---

## Implementation Plan

### Phase 1: Create Missing shadcn Components

#### Task 1.1: Create `input.tsx`
**Files:** Create `apps/web/src/components/ui/input.tsx`
**Reference:** shadcn/ui input component pattern with @base-ui/react/input

```tsx
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "@/lib/utils"

export function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      data-slot="input"
      type={type}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}
```

**Sizes to support:** default (h-9), sm (h-8), lg (h-10)
**Variants:** default, error (border-destructive focus:ring-destructive)

#### Task 1.2: Create `textarea.tsx`
**Files:** Create `apps/web/src/components/ui/textarea.tsx`

```tsx
import { Textarea as TextareaPrimitive } from "@base-ui/react/textarea"
import { cn } from "@/lib/utils"

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <TextareaPrimitive
      data-slot="textarea"
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}
```

#### Task 1.3: Create `label.tsx`
**Files:** Create `apps/web/src/components/ui/label.tsx`

```tsx
import * as React from "react"
import { Label as LabelPrimitive } from "@base-ui/react/label"
import { cn } from "@/lib/utils"

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <LabelPrimitive
      data-slot="label"
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    />
  )
}
```

#### Task 1.4: Create `form.tsx` (optional - for consistent form layout)
**Files:** Create `apps/web/src/components/ui/form.tsx`
**Use:** FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage
**Reference:** shadcn/ui form components (primarily for react-hook-form, but useful for consistent spacing)

---

### Phase 2: Migrate Pages/Components

#### Task 2.1: Migrate GenreDetail.tsx (Pagination)
**Files:** Modify `apps/web/src/pages/GenreDetail.tsx:219-251`
- Replace 3x `<button>` in Pagination component with `<Button variant="outline" size="icon">`
- Keep ChevronLeft/ChevronRight icons

#### Task 2.2: Migrate ArtistSearch.tsx
**Files:** Modify `apps/web/src/pages/ArtistSearch.tsx:60-82`
- Add import: `import { Input } from "@/components/ui/input"`, `import { Button } from "@/components/ui/button"`
- Replace `<input>` with `<Input placeholder="search an artist..." className="h-12 w-full ..." />`
- Replace `<button type="submit">` with `<Button type="submit" className="h-12 ...">`

#### Task 2.3: Migrate MusicSearch.tsx
**Files:** Modify `apps/web/src/pages/MusicSearch.tsx:57-79`
- Same pattern as ArtistSearch
- Add Input and Button imports

#### Task 2.4: Migrate Discovery.tsx
**Files:** Modify `apps/web/src/pages/Discovery.tsx:464-532`
- Add Input and Button imports
- Replace mood `<input>` with `<Input />`
- Replace Build mix `<button>` with `<Button />`
- Replace Save as playlist `<button>` with `<Button variant="outline" />`

#### Task 2.5: Migrate Library.tsx (comprehensive)
**Files:** Modify `apps/web/src/pages/Library.tsx` (multiple locations)
**Subtasks:**
- 2.5a: Lines 144-158: Favorite remove button → `<Button variant="ghost" size="icon" aria-label="...">`
- 2.5b: Lines 268-296: CreatePlaylistModal - prompt textarea → `<Textarea />`, rewrite button → `<Button variant="outline" />`
- 2.5c: Lines 299-312: Name input → `<Input />`
- 2.5d: Lines 315-329: Description textarea → `<Textarea />`
- 2.5e: Lines 344-352: DialogClose (already shadcn), Create button → `<Button />`
- 2.5f: Line 414: New playlist button → `<Button />`
- 2.5g: Lines 584-598: Unfollow buttons → `<Button variant="ghost" size="icon" />`
- 2.5h: Lines 622-635: Tab buttons → use Button with variant="ghost" or custom styling

#### Task 2.6: Migrate PlaylistDetail.tsx
**Files:** Modify `apps/web/src/pages/PlaylistDetail.tsx:207-358`
- 2.6a: Lines 207-218: Edit mode inputs → `<Input />` + `<Textarea />`
- 2.6b: Lines 220-297: Action buttons (6x) → `<Button variant="outline" />`, `<Button variant="ghost" />`, `<Button variant="destructive" />`
- 2.6c: Line 353: Remove track button → `<Button variant="ghost" size="icon" />`

#### Task 2.7: Migrate Login.tsx
**Files:** Modify `apps/web/src/pages/Login.tsx:53-102`
- Add Label, Input, Button imports
- Replace label+input pairs with `<Label htmlFor="...">` + `<Input id="..." ... />`
- Replace submit button with `<Button type="submit" className="w-full" />`

#### Task 2.8: Migrate Register.tsx
**Files:** Modify `apps/web/src/pages/Register.tsx:54-123`
- Same as Login.tsx
- Remove `inputClass` constant (replaced by Input component defaults)
- Use Label + Input for all three fields
- Submit button → Button component

#### Task 2.9: Migrate AddToPlaylistButton.tsx
**Files:** Modify `apps/web/src/components/AddToPlaylistButton.tsx:70,114,148`
- Line 70: Trigger button → `<Button variant="outline" className={className}>` 
- Line 114: Playlist item buttons → `<Button variant="outline" className="w-full justify-start gap-3 ...">`
- Line 148: DialogClose → keep but use Button component or shadcn DialogClose

#### Task 2.10: Migrate AddTrackSearch.tsx
**Files:** Modify `apps/web/src/components/AddTrackSearch.tsx:70,110`
- Line 70: Search input → `<Input placeholder="Search a song to add…" className="h-8 ...">`
- Line 110: Add button → `<Button variant="ghost" size="icon" aria-label="...">`

#### Task 2.11: Migrate AudioPreviewButton.tsx
**Files:** Modify `apps/web/src/components/AudioPreviewButton.tsx:33`
- Line 33: `<button>` → `<Button variant="ghost" size="icon" className={className}>` 

#### Task 2.12: Migrate Navbar.tsx
**Files:** Modify `apps/web/src/components/Navbar.tsx:144`
- Logout button → `<Button variant="ghost" size="sm" className="gap-1.5">`

#### Task 2.13: Migrate NotificationBell.tsx
**Files:** Modify `apps/web/src/components/NotificationBell.tsx:31,58,82`
- Line 31: Bell button → `<Button variant="ghost" size="icon" className="relative">`
- Line 58: Mark all read → `<Button variant="ghost" size="sm" className="gap-1">`
- Line 82: Notification items → `<Button variant="ghost" className="w-full justify-start gap-3 text-left p-3 ...">`

---

## Verification Steps

After each task:
1. Run `pnpm --filter @sonora/web check-types` - ensure no TypeScript errors
2. Run `pnpm --filter @sonora/web lint` - ensure no lint errors
3. Run `pnpm --filter @sonora/web build` - ensure build passes
4. Visual check in browser at `http://localhost:5173` for affected pages

## Risks & Tradeoffs

1. **Input component className overrides** - Some inputs have extensive custom classes (e.g., `h-12`, `pl-11`, focus rings). The new Input component should accept className prop to override/append.

2. **Button variant mapping** - Need to map custom inline styles to appropriate Button variants:
   - `bg-primary text-primary-foreground` → `variant="default"`
   - `border border-border bg-background` → `variant="outline"`
   - `bg-destructive/10 text-destructive` → `variant="destructive"`
   - `text-muted-foreground hover:text-foreground` → `variant="ghost"`
   - `rounded-full p-2` icon buttons → `size="icon"` or `size="icon-sm"`

3. **Label htmlFor binding** - Must ensure Label `htmlFor` matches Input `id` for accessibility.

4. **Form submission** - Native `<form onSubmit>` works with Button `type="submit"` inside; no Form wrapper needed unless using react-hook-form.

5. **DialogClose** - Already using shadcn DialogClose in some places; ensure consistency.

---

## Dependencies to Verify

Check `apps/web/package.json` for:
- `@base-ui/react/input` - for Input primitive
- `@base-ui/react/textarea` - for Textarea primitive  
- `@base-ui/react/label` - for Label primitive
- `@base-ui/react/form` - optional, for Form primitives

If not present, add via `pnpm add @base-ui/react/input @base-ui/react/textarea @base-ui/react/label --filter @sonora/web`

---

## Commit Strategy

One commit per task:
```
feat(ui): add Input component
feat(ui): add Textarea component
feat(ui): add Label component
feat(pages): migrate ArtistSearch to shadcn Input/Button
feat(pages): migrate MusicSearch to shadcn Input/Button
feat(pages): migrate Discovery to shadcn Input/Button
feat(pages): migrate Library to shadcn components
feat(pages): migrate PlaylistDetail to shadcn components
feat(pages): migrate Login to shadcn Label/Input/Button
feat(pages): migrate Register to shadcn Label/Input/Button
feat(components): migrate AddToPlaylistButton to shadcn Button
feat(components): migrate AddTrackSearch to shadcn Input/Button
feat(components): migrate AudioPreviewButton to shadcn Button
feat(components): migrate Navbar to shadcn Button
feat(components): migrate NotificationBell to shadcn Button
```