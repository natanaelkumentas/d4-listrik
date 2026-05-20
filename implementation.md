# Dashboard API Optimization — Deferred Per-Menu Fetching

## Summary
Optimize dashboard so APIs are only called when the specific menu/submenu is accessed. No unnecessary requests on pages that don't need the data.

## Current Problems

| Page | APIs called on mount | Problem |
|---|---|---|
| Admin Overview (`/dashboard/admin`) | `/api/dosen` + N×`/api/karya` + `/api/galeri` + `/api/statistik` + `/api/kurikulum` | Loads full dosen+karya+galeri just for count cards (~14+ requests) |
| Admin Kurikulum (`/dashboard/admin/kurikulum`) | `/api/kurikulum` + `/api/mata-kuliah` + `/api/cpl` all at once | Loads mata-kuliah & CPL even if admin only views "Kurikulum Aktif" tab |

Pages already correct (no changes needed): Admin Dosen, Admin Galeri, Admin Karya, Dosen Profile, Dosen Karya.

---

## Phase 1 — Admin Overview: Lightweight Stats

**Files:**
- `src/app/api/statistik/route.ts` [MODIFY]
- `src/app/dashboard/admin/page.tsx` [MODIFY]

**Changes:**
1. Extend `/api/statistik` to return `total_dosen` and `total_galeri` counts (simple SQL count queries)
2. Remove `useData()` / `ensureDosenLoaded()` / `ensureGaleriLoaded()` from overview page
3. Read all counts from the single `/api/statistik` response

**Result:** Overview page makes **2 API calls** (`/api/statistik` + `/api/kurikulum`) instead of ~14+.

---

## Phase 2 — Kurikulum: Defer Sub-Tab Data

**File:** `src/app/dashboard/admin/kurikulum/page.tsx` [MODIFY]

**Changes:**
1. On mount: fetch `/api/kurikulum` only (always needed)
2. On tab switch to "Mata Kuliah": fetch `/api/mata-kuliah` (once, tracked by `useRef`)
3. On tab switch to "CPL": fetch `/api/cpl` (once, tracked by `useRef`)
4. Add per-tab loading state so user sees "Memuat..." on first access
5. Use refs to prevent re-fetch when switching back to already-loaded tab

**Result:** Opening kurikulum page makes **1 API call** instead of 3. Sub-tab APIs fire only on first access.

---

## Verification
1. DevTools Network → `/login` = no dosen/galeri/karya calls
2. `/dashboard/admin` = only `/api/statistik` + `/api/kurikulum`
3. `/dashboard/admin/kurikulum` = only `/api/kurikulum` on load
4. Click "Mata Kuliah" tab → `/api/mata-kuliah` fires
5. Click "CPL" tab → `/api/cpl` fires
6. Switch back → no re-fetch
7. All CRUD still works on every page

---

## Execution
Each phase = 1 prompt. Say "Phase N" to execute.
**Use less token/credit so not exceed limit.**
