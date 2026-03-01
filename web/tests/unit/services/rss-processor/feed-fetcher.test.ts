import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchFeed, fetchRssItems, parseRssXml } from '@/server/services/rss-processor/feed-fetcher';

const VALID_ESPN_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>ESPN NFL News</title>
    <item>
      <title>Bills sign wide receiver John Doe</title>
      <description>The Buffalo Bills have signed wide receiver John Doe to a 4-year deal.</description>
      <link>https://www.espn.com/nfl/story/1</link>
      <guid>https://www.espn.com/nfl/story/1</guid>
      <pubDate>Fri, 28 Feb 2026 10:00:00 GMT</pubDate>
    </item>
    <item>
      <title>Patriots release veteran linebacker</title>
      <description>New England Patriots have released linebacker James Smith.</description>
      <link>https://www.espn.com/nfl/story/2</link>
      <guid>https://www.espn.com/nfl/story/2</guid>
      <pubDate>Fri, 28 Feb 2026 11:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

const VALID_YAHOO_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Yahoo NFL News</title>
    <item>
      <title>Chiefs trade for running back</title>
      <description>Kansas City Chiefs acquired RB Tony Brown from the Cowboys.</description>
      <link>https://sports.yahoo.com/nfl/story/3</link>
      <guid>urn:yahoo:sports:3</guid>
      <pubDate>Fri, 28 Feb 2026 12:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

describe('feed-fetcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parseRssXml', () => {
    it('parses valid ESPN RSS XML into RssItems', () => {
      const items = parseRssXml(VALID_ESPN_RSS, 'espn');

      expect(items).toHaveLength(2);
      expect(items[0]).toMatchObject({
        guid: 'https://www.espn.com/nfl/story/1',
        source: 'espn',
        title: 'Bills sign wide receiver John Doe',
        description: 'The Buffalo Bills have signed wide receiver John Doe to a 4-year deal.',
        link: 'https://www.espn.com/nfl/story/1',
      });
      expect(items[0].pubDate).toBeInstanceOf(Date);
    });

    it('parses valid Yahoo RSS XML into RssItems', () => {
      const items = parseRssXml(VALID_YAHOO_RSS, 'yahoo');

      expect(items).toHaveLength(1);
      expect(items[0]).toMatchObject({
        guid: 'urn:yahoo:sports:3',
        source: 'yahoo',
        title: 'Chiefs trade for running back',
      });
    });

    it('returns empty array for malformed XML', () => {
      const items = parseRssXml('<not valid xml', 'espn');
      expect(items).toEqual([]);
    });

    it('returns empty array when channel has no items', () => {
      const xml = `<?xml version="1.0"?><rss><channel><title>Feed</title></channel></rss>`;
      const items = parseRssXml(xml, 'espn');
      expect(items).toEqual([]);
    });

    it('returns empty array for completely invalid XML structure', () => {
      const items = parseRssXml('{ "not": "rss" }', 'espn');
      expect(items).toEqual([]);
    });

    it('handles single item (not array) in channel', () => {
      const xml = `<?xml version="1.0"?>
<rss><channel>
  <item>
    <title>Single item</title>
    <guid>single-guid-1</guid>
    <link>https://example.com/1</link>
    <pubDate>Fri, 28 Feb 2026 10:00:00 GMT</pubDate>
  </item>
</channel></rss>`;
      const items = parseRssXml(xml, 'espn');
      expect(items).toHaveLength(1);
      expect(items[0].guid).toBe('single-guid-1');
    });

    it('skips items with missing titles', () => {
      const xml = `<?xml version="1.0"?>
<rss><channel>
  <item>
    <guid>guid-1</guid>
    <link>https://example.com/1</link>
    <pubDate>Fri, 28 Feb 2026 10:00:00 GMT</pubDate>
  </item>
</channel></rss>`;
      const items = parseRssXml(xml, 'espn');
      expect(items).toEqual([]);
    });
  });

  describe('fetchFeed', () => {
    it('returns parsed items on successful fetch', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        new Response(VALID_ESPN_RSS, { status: 200 })
      );

      const items = await fetchFeed('https://espn.com/rss', 'espn');

      expect(items).toHaveLength(2);
      expect(items[0].source).toBe('espn');
    });

    it('returns empty array when HTTP response is not ok', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        new Response('Not Found', { status: 404 })
      );

      const items = await fetchFeed('https://espn.com/rss', 'espn');
      expect(items).toEqual([]);
    });

    it('returns empty array when fetch throws', async () => {
      vi.mocked(globalThis.fetch).mockRejectedValueOnce(new Error('Network error'));

      const items = await fetchFeed('https://espn.com/rss', 'espn');
      expect(items).toEqual([]);
    });

    it('returns empty array when response body is malformed XML', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        new Response('<bad xml', { status: 200 })
      );

      const items = await fetchFeed('https://espn.com/rss', 'espn');
      expect(items).toEqual([]);
    });
  });

  describe('fetchRssItems', () => {
    it('fetches and combines items from both feeds', async () => {
      vi.mocked(globalThis.fetch)
        .mockResolvedValueOnce(new Response(VALID_ESPN_RSS, { status: 200 }))
        .mockResolvedValueOnce(new Response(VALID_YAHOO_RSS, { status: 200 }));

      const items = await fetchRssItems();

      expect(items).toHaveLength(3);
      const sources = items.map((i) => i.source);
      expect(sources).toContain('espn');
      expect(sources).toContain('yahoo');
    });

    it('returns items from working feed when one feed fails', async () => {
      vi.mocked(globalThis.fetch)
        .mockRejectedValueOnce(new Error('ESPN down'))
        .mockResolvedValueOnce(new Response(VALID_YAHOO_RSS, { status: 200 }));

      const items = await fetchRssItems();

      expect(items).toHaveLength(1);
      expect(items[0].source).toBe('yahoo');
    });

    it('returns empty array when both feeds fail', async () => {
      vi.mocked(globalThis.fetch)
        .mockRejectedValueOnce(new Error('ESPN down'))
        .mockRejectedValueOnce(new Error('Yahoo down'));

      const items = await fetchRssItems();
      expect(items).toEqual([]);
    });
  });
});
