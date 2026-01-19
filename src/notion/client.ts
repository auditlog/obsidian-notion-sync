import { requestUrl, RequestUrlParam } from 'obsidian';

const NOTION_API_BASE = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

export interface NotionPage {
  id: string;
  title: string;
  url: string;
  lastEditedTime: string;
  icon?: string;
  parentType: 'database' | 'page' | 'workspace';
  parentId?: string;
}

export interface NotionDatabase {
  id: string;
  title: string;
  url: string;
}

export interface NotionBlock {
  id: string;
  type: string;
  has_children: boolean;
  [key: string]: any;
  children?: NotionBlock[];
}

export class NotionClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Make authenticated request to Notion API
   */
  private async request<T>(endpoint: string, options: Partial<RequestUrlParam> = {}): Promise<T> {
    const url = `${NOTION_API_BASE}${endpoint}`;

    const response = await requestUrl({
      url,
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: options.body,
    });

    if (response.status >= 400) {
      throw new Error(`Notion API error: ${response.status} - ${response.text}`);
    }

    return response.json as T;
  }

  /**
   * Test the connection to Notion API by fetching user info
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.request('/users/me');
      return true;
    } catch (error) {
      console.error('Notion connection test failed:', error);
      return false;
    }
  }

  /**
   * Search for all accessible pages and databases
   */
  async searchAll(): Promise<{ pages: NotionPage[]; databases: NotionDatabase[] }> {
    const pages: NotionPage[] = [];
    const databases: NotionDatabase[] = [];

    let hasMore = true;
    let startCursor: string | undefined = undefined;

    while (hasMore) {
      const body: any = { page_size: 100 };
      if (startCursor) {
        body.start_cursor = startCursor;
      }

      const response = await this.request<any>('/search', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      for (const result of response.results) {
        if (result.object === 'page') {
          pages.push(this.parsePageObject(result));
        } else if (result.object === 'database') {
          databases.push({
            id: result.id,
            title: this.getDatabaseTitle(result),
            url: result.url,
          });
        }
      }

      hasMore = response.has_more;
      startCursor = response.next_cursor;
    }

    return { pages, databases };
  }

  /**
   * Get all pages from a specific database
   */
  async getDatabasePages(databaseId: string): Promise<NotionPage[]> {
    const pages: NotionPage[] = [];
    let hasMore = true;
    let startCursor: string | undefined = undefined;

    while (hasMore) {
      const body: any = { page_size: 100 };
      if (startCursor) {
        body.start_cursor = startCursor;
      }

      const response = await this.request<any>(`/databases/${databaseId}/query`, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      for (const result of response.results) {
        if (result.properties) {
          pages.push(this.parsePageObject(result));
        }
      }

      hasMore = response.has_more;
      startCursor = response.next_cursor;
    }

    return pages;
  }

  /**
   * Get page content (all blocks)
   */
  async getPageBlocks(pageId: string): Promise<NotionBlock[]> {
    const blocks: NotionBlock[] = [];
    let hasMore = true;
    let startCursor: string | undefined = undefined;

    while (hasMore) {
      let url = `/blocks/${pageId}/children?page_size=100`;
      if (startCursor) {
        url += `&start_cursor=${startCursor}`;
      }

      const response = await this.request<any>(url);

      for (const block of response.results) {
        if (block.type) {
          blocks.push(block);

          // Recursively fetch children for blocks that have them
          if (block.has_children) {
            block.children = await this.getPageBlocks(block.id);
          }
        }
      }

      hasMore = response.has_more;
      startCursor = response.next_cursor;
    }

    return blocks;
  }

  /**
   * Get page metadata
   */
  async getPage(pageId: string): Promise<NotionPage> {
    const page = await this.request<any>(`/pages/${pageId}`);

    if (!page.properties) {
      throw new Error('Invalid page response');
    }

    return this.parsePageObject(page);
  }

  private parsePageObject(page: any): NotionPage {
    let parentType: 'database' | 'page' | 'workspace' = 'workspace';
    let parentId: string | undefined;

    if (page.parent?.type === 'database_id') {
      parentType = 'database';
      parentId = page.parent.database_id;
    } else if (page.parent?.type === 'page_id') {
      parentType = 'page';
      parentId = page.parent.page_id;
    }

    return {
      id: page.id,
      title: this.getPageTitle(page),
      url: page.url,
      lastEditedTime: page.last_edited_time,
      icon: this.getPageIcon(page),
      parentType,
      parentId,
    };
  }

  private getPageTitle(page: any): string {
    const properties = page.properties;

    if (!properties) return 'Untitled';

    for (const key in properties) {
      const prop = properties[key];
      if (prop.type === 'title' && prop.title?.length > 0) {
        return prop.title.map((t: any) => t.plain_text).join('');
      }
    }

    return 'Untitled';
  }

  private getDatabaseTitle(db: any): string {
    if (db.title && db.title.length > 0) {
      return db.title.map((t: any) => t.plain_text).join('');
    }
    return 'Untitled Database';
  }

  private getPageIcon(page: any): string | undefined {
    if (!page.icon) return undefined;

    if (page.icon.type === 'emoji') {
      return page.icon.emoji;
    }

    return undefined;
  }
}
