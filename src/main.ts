import { Plugin, Notice } from 'obsidian';
import { NotionSyncSettings, DEFAULT_SETTINGS } from './settings';
import { NotionSyncSettingTab } from './settings-tab';
import { NotionClient } from './notion/client';
import { ImportModal } from './ui/import-modal';

export default class NotionSyncPlugin extends Plugin {
  settings: NotionSyncSettings;
  notionClient: NotionClient | null = null;

  async onload(): Promise<void> {
    await this.loadSettings();

    // Initialize Notion client if API key is set
    this.initNotionClient();

    // Add settings tab
    this.addSettingTab(new NotionSyncSettingTab(this.app, this));

    // Add ribbon icon for quick access
    this.addRibbonIcon('download', 'Import from Notion', async () => {
      await this.importFromNotion();
    });

    // Add commands
    this.addCommand({
      id: 'import-from-notion',
      name: 'Import from Notion',
      callback: async () => {
        await this.importFromNotion();
      },
    });

    this.addCommand({
      id: 'export-to-notion',
      name: 'Export to Notion',
      callback: async () => {
        await this.exportToNotion();
      },
    });

    console.log('Notion Sync plugin loaded');
  }

  onunload(): void {
    console.log('Notion Sync plugin unloaded');
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    // Reinitialize client when settings change
    this.initNotionClient();
  }

  /**
   * Initialize or reinitialize the Notion client
   */
  initNotionClient(): void {
    if (this.settings.notionApiKey) {
      this.notionClient = new NotionClient(this.settings.notionApiKey);
    } else {
      this.notionClient = null;
    }
  }

  /**
   * Test the connection to Notion API
   */
  async testNotionConnection(): Promise<boolean> {
    if (!this.settings.notionApiKey) {
      new Notice('Please enter your Notion API key first');
      return false;
    }

    // Create a fresh client for testing
    const testClient = new NotionClient(this.settings.notionApiKey);
    const isValid = await testClient.testConnection();

    if (!isValid) {
      new Notice('Failed to connect to Notion. Please check your API key.');
    }

    return isValid;
  }

  async importFromNotion(): Promise<void> {
    if (!this.settings.notionApiKey) {
      new Notice('Please configure your Notion API key in settings');
      return;
    }

    if (!this.notionClient) {
      this.initNotionClient();
    }

    // Open import modal
    new ImportModal(this.app, this).open();
  }

  async exportToNotion(): Promise<void> {
    if (!this.settings.notionApiKey) {
      new Notice('Please configure your Notion API key in settings');
      return;
    }

    new Notice('Export to Notion - Coming soon!');
    // TODO: Implement export logic
  }
}
