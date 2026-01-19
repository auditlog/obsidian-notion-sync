import { Client } from '@notionhq/client';
import {
  PageObjectResponse,
  DatabaseObjectResponse,
  BlockObjectResponse,
  ListBlockChildrenResponse
} from '@notionhq/client/build/src/api-endpoints';

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

export class NotionClient {
  private client: Client;

  constructor(apiKey: string) {
    this.client = new Client({ auth: apiKey });
  }

  /**
   * Test the connection to Notion API by fetching user info
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.users.me({});
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
      const response = await this.client.search({
        start_cursor: startCursor,
        page_size: 100,
      });

      for (const result of response.results) {
        if (result.object === 'page') {
          const page = result as PageObjectResponse;
          pages.push(this.parsePageObject(page));
        } else if (result.object === 'database') {
          const db = result as DatabaseObjectResponse;
          databases.push({
            id: db.id,
            title: this.getDatabaseTitle(db),
            url: db.url,
          });
        }
      }

      hasMore = response.has_more;
      startCursor = response.next_cursor ?? undefined;
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
      const response = await this.client.databases.query({
        database_id: databaseId,
        start_cursor: startCursor,
        page_size: 100,
      });

      for (const result of response.results) {
        if ('properties' in result) {
          pages.push(this.parsePageObject(result as PageObjectResponse));
        }
      }

      hasMore = response.has_more;
      startCursor = response.next_cursor ?? undefined;
    }

    return pages;
  }

  /**
   * Get page content (all blocks)
   */
  async getPageBlocks(pageId: string): Promise<BlockObjectResponse[]> {
    const blocks: BlockObjectResponse[] = [];
    let hasMore = true;
    let startCursor: string | undefined = undefined;

    while (hasMore) {
      const response: ListBlockChildrenResponse = await this.client.blocks.children.list({
        block_id: pageId,
        start_cursor: startCursor,
        page_size: 100,
      });

      for (const block of response.results) {
        if ('type' in block) {
          blocks.push(block as BlockObjectResponse);

          // Recursively fetch children for blocks that have them
          if (block.has_children) {
            const children = await this.getPageBlocks(block.id);
            (block as BlockObjectResponse & { children?: BlockObjectResponse[] }).children = children;
          }
        }
      }

      hasMore = response.has_more;
      startCursor = response.next_cursor ?? undefined;
    }

    return blocks;
  }

  /**
   * Get page metadata
   */
  async getPage(pageId: string): Promise<NotionPage> {
    const page = await this.client.pages.retrieve({ page_id: pageId });

    if (!('properties' in page)) {
      throw new Error('Invalid page response');
    }

    return this.parsePageObject(page as PageObjectResponse);
  }

  private parsePageObject(page: PageObjectResponse): NotionPage {
    let parentType: 'database' | 'page' | 'workspace' = 'workspace';
    let parentId: string | undefined;

    if (page.parent.type === 'database_id') {
      parentType = 'database';
      parentId = page.parent.database_id;
    } else if (page.parent.type === 'page_id') {
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

  private getPageTitle(page: PageObjectResponse): string {
    // Try to get title from properties
    const properties = page.properties;

    for (const key in properties) {
      const prop = properties[key];
      if (prop.type === 'title' && prop.title.length > 0) {
        return prop.title.map(t => t.plain_text).join('');
      }
    }

    // Fallback to "Untitled"
    return 'Untitled';
  }

  private getDatabaseTitle(db: DatabaseObjectResponse): string {
    if (db.title && db.title.length > 0) {
      return db.title.map(t => t.plain_text).join('');
    }
    return 'Untitled Database';
  }

  private getPageIcon(page: PageObjectResponse): string | undefined {
    if (!page.icon) return undefined;

    if (page.icon.type === 'emoji') {
      return page.icon.emoji;
    }

    return undefined;
  }
}
