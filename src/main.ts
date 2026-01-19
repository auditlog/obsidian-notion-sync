import { Plugin, Notice } from 'obsidian';
import { NotionSyncSettings, DEFAULT_SETTINGS } from './settings';
import { NotionSyncSettingTab } from './settings-tab';

export default class NotionSyncPlugin extends Plugin {
  settings: NotionSyncSettings;

  async onload(): Promise<void> {
    await this.loadSettings();

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
  }

  async importFromNotion(): Promise<void> {
    if (!this.settings.notionApiKey) {
      new Notice('Please configure your Notion API key in settings');
      return;
    }

    new Notice('Import from Notion - Coming soon!');
    // TODO: Implement import logic
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
