export type RssSource = 'espn' | 'yahoo';
export type RssItemStatus = 'pending' | 'processed' | 'failed';

export interface RssItem {
  guid: string;
  source: RssSource;
  title: string;
  description: string;
  link: string;
  pubDate: Date;
}
