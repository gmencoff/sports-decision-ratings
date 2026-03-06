import { XMLParser } from 'fast-xml-parser';
import { type RssItem } from '@/lib/data';

export type { RssItem };

const ESPN_RSS_URL = 'https://www.espn.com/espn/rss/nfl/news';
const YAHOO_RSS_URL = 'https://sports.yahoo.com/nfl/rss.xml';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

export async function fetchFeed(url: string, source: 'espn' | 'yahoo'): Promise<RssItem[]> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NFLTransactionBot/1.0)' },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error(`Feed fetch failed for ${source}: HTTP ${response.status}`);
      return [];
    }

    const xml = await response.text();
    return parseRssXml(xml, source);
  } catch (err) {
    console.error(`Feed fetch error for ${source}:`, err);
    return [];
  }
}

export function parseRssXml(xml: string, source: 'espn' | 'yahoo'): RssItem[] {
  try {
    const parsed = parser.parse(xml);
    const channel = parsed?.rss?.channel;
    if (!channel) return [];

    const items: unknown[] = Array.isArray(channel.item) ? channel.item : channel.item ? [channel.item] : [];

    return items.flatMap((item: unknown) => {
      const i = item as Record<string, unknown>;
      const guid = extractGuid(i, source);
      const title = typeof i.title === 'string' ? i.title.trim() : '';
      const description = extractDescription(i);
      const link = typeof i.link === 'string' ? i.link.trim() : '';
      const pubDateStr = typeof i.pubDate === 'string' ? i.pubDate : '';

      if (!guid || !title) return [];

      const pubDate = pubDateStr ? new Date(pubDateStr) : new Date();
      if (isNaN(pubDate.getTime())) return [];

      return [{
        guid,
        source,
        title,
        description,
        link,
        pubDate,
      }];
    });
  } catch (err) {
    console.error(`RSS XML parse error for ${source}:`, err);
    return [];
  }
}

function extractGuid(item: Record<string, unknown>, source: string): string {
  const guid = item.guid;
  if (typeof guid === 'string') return guid.trim();
  if (guid && typeof guid === 'object') {
    const g = guid as Record<string, unknown>;
    if (typeof g['#text'] === 'string') return g['#text'].trim();
  }
  // Fall back to link
  if (typeof item.link === 'string') return item.link.trim();
  return `${source}-${item.title}`;
}

function extractDescription(item: Record<string, unknown>): string {
  const desc = item.description;
  if (typeof desc === 'string') return desc.trim();
  if (desc && typeof desc === 'object') {
    const d = desc as Record<string, unknown>;
    if (typeof d['#text'] === 'string') return d['#text'].trim();
    if (typeof d['__cdata'] === 'string') return d['__cdata'].trim();
  }
  return '';
}

export async function fetchRssItems(): Promise<RssItem[]> {
  const [espnItems, yahooItems] = await Promise.all([
    fetchFeed(ESPN_RSS_URL, 'espn'),
    fetchFeed(YAHOO_RSS_URL, 'yahoo'),
  ]);
  return [...espnItems, ...yahooItems];
}
