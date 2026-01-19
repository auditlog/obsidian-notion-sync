export interface NotionSyncSettings {
  notionApiKey: string;
  defaultDatabaseId: string;
  importFolder: string;
  syncOnStartup: boolean;
  includeMetadata: boolean;
}

export const DEFAULT_SETTINGS: NotionSyncSettings = {
  notionApiKey: '',
  defaultDatabaseId: '',
  importFolder: 'Notion Import',
  syncOnStartup: false,
  includeMetadata: true,
};
