/**
 * Determines the correct "Kembali ke ..." label AND the target href
 * based on the previous path.
 *
 * Priority:
 *  1. sessionStorage `prev_path` (tracks SPA navigations accurately)
 *  2. `document.referrer`        (fallback for hard-navigations / external links)
 *  3. The provided defaults
 *
 * The back button should always use `router.push(href)` — never `router.back()` —
 * so that "going back" behaves as a fresh navigation.
 */
export function getBackInfo(defaults: { label: string; href: string }): {
  label: string;
  href: string;
} {
  let source = "";

  try {
    source = sessionStorage.getItem("prev_path") || "";
  } catch {
    // sessionStorage unavailable
  }

  // Fallback to document.referrer if sessionStorage had nothing useful
  if (!source && typeof window !== "undefined" && document.referrer) {
    try {
      source = new URL(document.referrer).pathname;
    } catch {
      source = document.referrer;
    }
  }

  if (!source) return defaults;

  return mapPathToResult(source, defaults);
}

/**
 * Navigate "back" by pushing to the target href while resetting the
 * navigation tracking chain. This ensures the destination page becomes
 * a fresh starting point — prev_path won't point back to the page
 * the user just left.
 *
 * Use this instead of raw `router.push(href)` in back buttons.
 */
export function navigateBack(
  router: { push: (href: string) => void },
  href: string
): void {
  try {
    // Set current_path to the destination so when DataContext's useEffect
    // fires on the new page (pathname === current_path), it won't update
    // prev_path. Also clear prev_path to cut the chain.
    sessionStorage.setItem("current_path", href);
    sessionStorage.removeItem("prev_path");
  } catch {
    // sessionStorage unavailable — navigation still works
  }
  router.push(href);
}

/** Keep the old name working for any other callers. */
export function getBackLabel(defaultLabel: string): string {
  return getBackInfo({ label: defaultLabel, href: "/" }).label;
}

// ─── internal ───────────────────────────────────────────

interface BackResult {
  label: string;
  href: string;
}

/**
 * Map a pathname to a human-friendly back-button label + the href to navigate to.
 * Order matters — more specific routes are checked first.
 */
function mapPathToResult(path: string, defaults: BackResult): BackResult {
  if (path.includes("/dashboard"))
    return { label: "Kembali ke Dashboard", href: path };

  // /staf/<id>/karya/... → back to staff profile
  if (/\/staf\/[^/]+\/karya/.test(path)) {
    const staffPath = path.match(/\/staf\/[^/]+/)?.[0] || "/staf";
    return { label: "Kembali ke Profil Staf", href: staffPath };
  }
  // /staf/<id> → profile page (must come before /staf check)
  if (/\/staf\/[^/]+/.test(path))
    return { label: "Kembali ke Profil Staf", href: path };
  if (path.includes("/staf"))
    return { label: "Kembali ke Daftar Staf", href: "/staf" };

  // /galeri/<id> → detail page
  if (/\/galeri\/[^/]+/.test(path))
    return { label: "Kembali ke Galeri", href: "/galeri" };
  if (path.includes("/galeri"))
    return { label: "Kembali ke Galeri", href: "/galeri" };

  if (path.includes("/fasilitas"))
    return { label: "Kembali ke Fasilitas", href: "/fasilitas" };
  if (path.includes("/tentang"))
    return { label: "Kembali ke Tentang", href: "/tentang" };
  if (path.includes("/kurikulum"))
    return { label: "Kembali ke Kurikulum", href: "/kurikulum" };

  // Homepage
  if (path === "/" || path === "")
    return { label: "Kembali ke Beranda", href: "/" };

  return defaults;
}
