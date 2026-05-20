import { NextResponse } from "next/server";

interface GNewsArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  image: string;
  publishedAt: string;
  source: {
    name: string;
    url: string;
  };
}

interface GNewsResponse {
  totalArticles: number;
  articles: GNewsArticle[];
}

export interface NewsArticle {
  id: string;
  judul: string;
  ringkasan: string;
  tanggal: string;
  url: string;
  gambar: string | null;
  sumber: string;
}

// In-memory cache
let cachedArticles: NewsArticle[] | null = null;
let cacheTimestamp = 0;
let cachedIsLive = false;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

// RSS feed sources for electricity/energy news
const RSS_FEEDS = [
  {
    url: "https://www.power-technology.com/feed/",
    sumber: "Power Technology",
  },
  {
    url: "https://www.renewableenergyworld.com/feed/",
    sumber: "Renewable Energy World",
  },
  {
    url: "https://electrek.co/feed/",
    sumber: "Electrek",
  },
  {
    url: "https://cleantechnica.com/feed/",
    sumber: "CleanTechnica",
  },
];

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// Extract text content between XML tags
function extractTag(xml: string, tag: string): string {
  // Try CDATA first
  const cdataRegex = new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`, "i");
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1].trim();

  // Regular tag content
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const match = xml.match(regex);
  return match ? match[1].trim() : "";
}

// Extract image URL from RSS item
function extractImage(itemXml: string): string | null {
  // Try media:content
  const mediaMatch = itemXml.match(/<media:content[^>]+url=["']([^"']+)["']/i);
  if (mediaMatch) return mediaMatch[1];

  // Try media:thumbnail
  const thumbMatch = itemXml.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i);
  if (thumbMatch) return thumbMatch[1];

  // Try enclosure
  const enclosureMatch = itemXml.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]+type=["']image/i);
  if (enclosureMatch) return enclosureMatch[1];

  // Try image tag in content or description
  const imgMatch = itemXml.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch) return imgMatch[1];

  // Try og:image style content
  const ogMatch = itemXml.match(/https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp|gif)(?:\?[^\s"'<>]*)?/i);
  if (ogMatch) return ogMatch[0];

  return null;
}

// Strip HTML tags from text
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Parse a single RSS feed and return articles
async function parseRSSFeed(feedUrl: string, sourceName: string): Promise<NewsArticle[]> {
  try {
    const response = await fetch(feedUrl, {
      cache: "no-store",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; NewsBot/1.0)",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      console.warn(`RSS feed ${feedUrl} returned ${response.status}`);
      return [];
    }

    const xml = await response.text();

    // Split into items
    const items = xml.split(/<item[\s>]/i).slice(1);

    return items.slice(0, 5).map((item, index) => {
      const title = stripHtml(extractTag(item, "title"));
      const link = extractTag(item, "link") || extractTag(item, "guid");
      const description = stripHtml(extractTag(item, "description"));
      const pubDate = extractTag(item, "pubDate");
      const image = extractImage(item);

      return {
        id: `rss-${sourceName.toLowerCase().replace(/\s+/g, "-")}-${index}-${Date.now()}`,
        judul: title,
        ringkasan: description.slice(0, 250) + (description.length > 250 ? "..." : ""),
        tanggal: formatDate(pubDate),
        url: link,
        gambar: image,
        sumber: sourceName,
      };
    }).filter(a => a.judul && a.url);
  } catch (err) {
    console.warn(`Failed to parse RSS feed ${feedUrl}:`, err);
    return [];
  }
}

// Fetch from all RSS feeds
async function fetchFromRSS(): Promise<NewsArticle[]> {
  const feedPromises = RSS_FEEDS.map(feed => parseRSSFeed(feed.url, feed.sumber));
  const results = await Promise.allSettled(feedPromises);

  const allArticles: NewsArticle[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      allArticles.push(...result.value);
    }
  }

  // Sort: articles with images first, then interleave sources
  allArticles.sort((a, b) => {
    if (a.gambar && !b.gambar) return -1;
    if (!a.gambar && b.gambar) return 1;
    return 0;
  });

  return allArticles.slice(0, 10);
}

// Fetch from GNews API (requires API key)
async function fetchFromGNews(): Promise<NewsArticle[]> {
  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey) return [];

  const query = encodeURIComponent("electricity OR electrical engineering OR power grid OR renewable energy");
  const url = `https://gnews.io/api/v4/search?q=${query}&lang=en&max=10&apikey=${apiKey}`;

  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    console.error("GNews API error:", response.status, await response.text());
    return [];
  }

  const data: GNewsResponse = await response.json();

  const mapped = data.articles.map((article, index) => ({
    id: `gnews-${index}-${Date.now()}`,
    judul: article.title,
    ringkasan: article.description || article.content?.slice(0, 200) || "",
    tanggal: formatDate(article.publishedAt),
    url: article.url,
    gambar: article.image || null,
    sumber: article.source.name,
  }));

  // Prioritize articles with images
  mapped.sort((a, b) => {
    if (a.gambar && !b.gambar) return -1;
    if (!a.gambar && b.gambar) return 1;
    return 0;
  });

  return mapped;
}

// Main fetch: try GNews first, then RSS feeds
async function fetchNews(): Promise<{ articles: NewsArticle[]; isLive: boolean }> {
  // Try GNews first (if API key available)
  const gnewsArticles = await fetchFromGNews();
  if (gnewsArticles.length >= 5) {
    return { articles: gnewsArticles, isLive: true };
  }

  // Fallback to RSS feeds (always free, no key needed)
  console.log("Fetching from RSS feeds...");
  const rssArticles = await fetchFromRSS();
  if (rssArticles.length > 0) {
    return { articles: rssArticles, isLive: true };
  }

  // Should rarely happen — both GNews and all RSS feeds failed
  return { articles: [], isLive: false };
}

// GET /api/news — Public: Fetch realtime electricity/energy news
export async function GET() {
  try {
    const now = Date.now();

    // Return cached data if still valid
    if (cachedArticles && cachedArticles.length > 0 && now - cacheTimestamp < CACHE_DURATION_MS) {
      return NextResponse.json({
        articles: cachedArticles,
        cached: true,
        live: cachedIsLive,
        cachedAt: new Date(cacheTimestamp).toISOString(),
      });
    }

    // Fetch fresh data
    const { articles, isLive } = await fetchNews();

    if (articles.length > 0) {
      // Update cache
      cachedArticles = articles;
      cacheTimestamp = now;
      cachedIsLive = isLive;
    }

    return NextResponse.json({
      articles,
      cached: false,
      live: isLive,
      cachedAt: new Date(now).toISOString(),
    });
  } catch (err) {
    console.error("News API error:", err);

    // If cache exists but expired, still serve it as stale
    if (cachedArticles && cachedArticles.length > 0) {
      return NextResponse.json({
        articles: cachedArticles,
        cached: true,
        stale: true,
        live: cachedIsLive,
        cachedAt: new Date(cacheTimestamp).toISOString(),
      });
    }

    return NextResponse.json({
      articles: [],
      cached: false,
      live: false,
    });
  }
}
