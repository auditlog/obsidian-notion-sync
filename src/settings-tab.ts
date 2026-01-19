import { App, PluginSettingTab, Setting } from 'obsidian';
import NotionSyncPlugin from './main';

export class NotionSyncSettingTab extends PluginSettingTab {
  plugin: NotionSyncPlugin;

  constructor(app: App, plugin: NotionSyncPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass('notion-sync-settings');

    containerEl.createEl('h2', { text: 'Notion Sync Settings' });

    // API Key setting
    new Setting(containerEl)
      .setName('Notion API Key')
      .setDesc('Your Notion integration token. Get it from notion.so/my-integrations')
      .setClass('notion-sync-api-key')
      .addText((text) =>
        text
          .setPlaceholder('secret_...')
          .setValue(this.plugin.settings.notionApiKey)
          .onChange(async (value) => {
            this.plugin.settings.notionApiKey = value;
            await this.plugin.saveSettings();
          })
      );

    // Default Database ID
    new Setting(containerEl)
      .setName('Default Database ID')
      .setDesc('The Notion database ID to use for imports/exports by default')
      .addText((text) =>
        text
          .setPlaceholder('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx')
          .setValue(this.plugin.settings.defaultDatabaseId)
          .onChange(async (value) => {
            this.plugin.settings.defaultDatabaseId = value;
            await this.plugin.saveSettings();
          })
      );

    // Import folder
    new Setting(containerEl)
      .setName('Import Folder')
      .setDesc('Folder where imported notes will be saved')
      .addText((text) =>
        text
          .setPlaceholder('Notion Import')
          .setValue(this.plugin.settings.importFolder)
          .onChange(async (value) => {
            this.plugin.settings.importFolder = value;
            await this.plugin.saveSettings();
          })
      );

    // Include metadata toggle
    new Setting(containerEl)
      .setName('Include Metadata')
      .setDesc('Add Notion sync metadata to frontmatter of imported notes')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.includeMetadata)
          .onChange(async (value) => {
            this.plugin.settings.includeMetadata = value;
            await this.plugin.saveSettings();
          })
      );

    // Sync on startup toggle
    new Setting(containerEl)
      .setName('Sync on Startup')
      .setDesc('Automatically check for updates when Obsidian starts')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.syncOnStartup)
          .onChange(async (value) => {
            this.plugin.settings.syncOnStartup = value;
            await this.plugin.saveSettings();
          })
      );

    // Help section
    containerEl.createEl('h3', { text: 'Help' });

    const helpDiv = containerEl.createEl('div');
    helpDiv.createEl('p', {
      text: 'To use this plugin, you need to:',
    });

    const steps = helpDiv.createEl('ol');
    steps.createEl('li', {
      text: 'Create a Notion integration at notion.so/my-integrations',
    });
    steps.createEl('li', {
      text: 'Copy the "Internal Integration Token" and paste it above',
    });
    steps.createEl('li', {
      text: 'Share the pages/databases you want to sync with your integration',
    });
  }
}
