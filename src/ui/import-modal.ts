import { App, Modal, Notice, Setting } from 'obsidian';
import NotionSyncPlugin from '../main';
import { NotionPage, NotionDatabase } from '../notion/client';
import { blocksToMarkdown, generateFrontmatter } from '../converters/notion-to-md';
import { requestUrl } from 'obsidian';

interface SelectableItem {
  type: 'page' | 'database';
  data: NotionPage | NotionDatabase;
  selected: boolean;
}

export class ImportModal extends Modal {
  plugin: NotionSyncPlugin;
  items: SelectableItem[] = [];
  isLoading: boolean = true;
  selectedFolder: string;

  constructor(app: App, plugin: NotionSyncPlugin) {
    super(app);
    this.plugin = plugin;
    this.selectedFolder = plugin.settings.importFolder;
  }

  async onOpen(): Promise<void> {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('notion-sync-modal');

    contentEl.createEl('h2', { text: 'Import from Notion' });

    // Loading state
    const loadingEl = contentEl.createDiv({ cls: 'notion-sync-loading' });
    loadingEl.createEl('p', { text: 'Loading pages from Notion...' });

    try {
      await this.loadNotionContent();
      this.renderContent();
    } catch (error) {
      contentEl.empty();
      contentEl.createEl('h2', { text: 'Import from Notion' });
      contentEl.createEl('p', {
        text: `Error loading Notion content: ${error instanceof Error ? error.message : 'Unknown error'}`,
        cls: 'notion-sync-error',
      });
    }
  }

  async loadNotionContent(): Promise<void> {
    if (!this.plugin.notionClient) {
      throw new Error('Notion client not initialized');
    }

    const { pages, databases } = await this.plugin.notionClient.searchAll();

    this.items = [
      ...databases.map(db => ({
        type: 'database' as const,
        data: db,
        selected: false,
      })),
      ...pages.map(page => ({
        type: 'page' as const,
        data: page,
        selected: false,
      })),
    ];

    this.isLoading = false;
  }

  renderContent(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('notion-sync-modal');

    contentEl.createEl('h2', { text: 'Import from Notion' });

    if (this.items.length === 0) {
      contentEl.createEl('p', {
        text: 'No pages or databases found. Make sure you have shared pages with your integration.',
      });
      return;
    }

    // Folder selection
    new Setting(contentEl)
      .setName('Import folder')
      .setDesc('Folder where imported notes will be saved')
      .addText(text =>
        text
          .setValue(this.selectedFolder)
          .onChange(value => {
            this.selectedFolder = value;
          })
      );

    // Select all / none buttons
    const buttonContainer = contentEl.createDiv({ cls: 'notion-sync-buttons' });

    const selectAllBtn = buttonContainer.createEl('button', { text: 'Select All' });
    selectAllBtn.onclick = () => {
      this.items.forEach(item => item.selected = true);
      this.renderContent();
    };

    const selectNoneBtn = buttonContainer.createEl('button', { text: 'Select None' });
    selectNoneBtn.onclick = () => {
      this.items.forEach(item => item.selected = false);
      this.renderContent();
    };

    // Pages list
    const listEl = contentEl.createDiv({ cls: 'page-list' });

    // Databases section
    const databases = this.items.filter(i => i.type === 'database');
    if (databases.length > 0) {
      listEl.createEl('h4', { text: 'Databases' });
      for (const item of databases) {
        this.renderItem(listEl, item);
      }
    }

    // Pages section
    const pages = this.items.filter(i => i.type === 'page');
    if (pages.length > 0) {
      listEl.createEl('h4', { text: 'Pages' });
      for (const item of pages) {
        this.renderItem(listEl, item);
      }
    }

    // Import button
    const importContainer = contentEl.createDiv({ cls: 'notion-sync-import-actions' });

    const selectedCount = this.items.filter(i => i.selected).length;
    importContainer.createEl('span', {
      text: `${selectedCount} item(s) selected`,
      cls: 'notion-sync-selection-count',
    });

    const importBtn = importContainer.createEl('button', {
      text: 'Import Selected',
      cls: 'mod-cta',
    });
    importBtn.disabled = selectedCount === 0;
    importBtn.onclick = () => this.performImport();
  }

  renderItem(container: HTMLElement, item: SelectableItem): void {
    const itemEl = container.createDiv({ cls: 'page-item' });

    const checkbox = itemEl.createEl('input', { type: 'checkbox' });
    checkbox.checked = item.selected;
    checkbox.onchange = () => {
      item.selected = checkbox.checked;
      this.renderContent();
    };

    const labelEl = itemEl.createDiv({ cls: 'page-item-label' });

    if (item.type === 'page') {
      const page = item.data as NotionPage;
      const icon = page.icon || '📄';
      labelEl.createSpan({ text: `${icon} ${page.title}` });
    } else {
      const db = item.data as NotionDatabase;
      labelEl.createSpan({ text: `🗃️ ${db.title}` });
    }

    itemEl.onclick = (e) => {
      if (e.target !== checkbox) {
        item.selected = !item.selected;
        this.renderContent();
      }
    };
  }

  async performImport(): Promise<void> {
    const { contentEl } = this;
    const selectedItems = this.items.filter(i => i.selected);

    if (selectedItems.length === 0) {
      new Notice('No items selected');
      return;
    }

    // Show progress
    contentEl.empty();
    contentEl.createEl('h2', { text: 'Importing...' });

    const progressContainer = contentEl.createDiv({ cls: 'notion-sync-progress' });
    const progressBar = progressContainer.createDiv({ cls: 'progress-bar' });
    const progressFill = progressBar.createDiv({ cls: 'progress-bar-fill' });
    const progressText = progressContainer.createDiv({ cls: 'progress-text' });

    let imported = 0;
    let failed = 0;

    // Ensure import folder exists
    await this.ensureFolderExists(this.selectedFolder);

    for (let i = 0; i < selectedItems.length; i++) {
      const item = selectedItems[i];
      const progress = ((i + 1) / selectedItems.length) * 100;
      progressFill.style.width = `${progress}%`;

      if (item.type === 'page') {
        const page = item.data as NotionPage;
        progressText.setText(`Importing: ${page.title}`);

        try {
          await this.importPage(page);
          imported++;
        } catch (error) {
          console.error(`Failed to import page ${page.title}:`, error);
          failed++;
        }
      } else if (item.type === 'database') {
        const db = item.data as NotionDatabase;
        progressText.setText(`Importing database: ${db.title}`);

        try {
          await this.importDatabase(db);
          imported++;
        } catch (error) {
          console.error(`Failed to import database ${db.title}:`, error);
          failed++;
        }
      }
    }

    // Show result
    contentEl.empty();
    contentEl.createEl('h2', { text: 'Import Complete' });
    contentEl.createEl('p', { text: `Successfully imported: ${imported} items` });

    if (failed > 0) {
      contentEl.createEl('p', {
        text: `Failed: ${failed} items (check console for details)`,
        cls: 'notion-sync-error',
      });
    }

    const closeBtn = contentEl.createEl('button', { text: 'Close', cls: 'mod-cta' });
    closeBtn.onclick = () => this.close();
  }

  async importPage(page: NotionPage): Promise<void> {
    if (!this.plugin.notionClient) {
      throw new Error('Notion client not initialized');
    }

    // Get page blocks
    const blocks = await this.plugin.notionClient.getPageBlocks(page.id);

    // Convert to markdown
    const { markdown, images } = blocksToMarkdown(blocks as any);

    // Generate frontmatter if enabled
    let content = '';
    if (this.plugin.settings.includeMetadata) {
      content = generateFrontmatter(page);
    }
    content += markdown;

    // Sanitize filename
    const filename = this.sanitizeFilename(page.title) + '.md';
    const filepath = `${this.selectedFolder}/${filename}`;

    // Save markdown file
    await this.app.vault.adapter.write(filepath, content);

    // Download and save images
    if (images.length > 0) {
      const imageFolder = `${this.selectedFolder}/attachments`;
      await this.ensureFolderExists(imageFolder);

      for (const image of images) {
        try {
          await this.downloadImage(image.url, `${imageFolder}/${image.filename}`);
        } catch (error) {
          console.error(`Failed to download image: ${image.url}`, error);
        }
      }
    }
  }

  async importDatabase(db: NotionDatabase): Promise<void> {
    if (!this.plugin.notionClient) {
      throw new Error('Notion client not initialized');
    }

    // Create folder for database
    const dbFolder = `${this.selectedFolder}/${this.sanitizeFilename(db.title)}`;
    await this.ensureFolderExists(dbFolder);

    // Get all pages from database
    const pages = await this.plugin.notionClient.getDatabasePages(db.id);

    // Import each page
    for (const page of pages) {
      try {
        // Get page blocks
        const blocks = await this.plugin.notionClient.getPageBlocks(page.id);

        // Convert to markdown
        const { markdown, images } = blocksToMarkdown(blocks as any);

        // Generate frontmatter if enabled
        let content = '';
        if (this.plugin.settings.includeMetadata) {
          content = generateFrontmatter(page);
        }
        content += markdown;

        // Sanitize filename
        const filename = this.sanitizeFilename(page.title) + '.md';
        const filepath = `${dbFolder}/${filename}`;

        // Save markdown file
        await this.app.vault.adapter.write(filepath, content);

        // Download and save images
        if (images.length > 0) {
          const imageFolder = `${dbFolder}/attachments`;
          await this.ensureFolderExists(imageFolder);

          for (const image of images) {
            try {
              await this.downloadImage(image.url, `${imageFolder}/${image.filename}`);
            } catch (error) {
              console.error(`Failed to download image: ${image.url}`, error);
            }
          }
        }
      } catch (error) {
        console.error(`Failed to import page ${page.title} from database:`, error);
      }
    }
  }

  async ensureFolderExists(folderPath: string): Promise<void> {
    const folders = folderPath.split('/').filter(f => f);
    let currentPath = '';

    for (const folder of folders) {
      currentPath = currentPath ? `${currentPath}/${folder}` : folder;

      if (!await this.app.vault.adapter.exists(currentPath)) {
        await this.app.vault.adapter.mkdir(currentPath);
      }
    }
  }

  async downloadImage(url: string, filepath: string): Promise<void> {
    try {
      const response = await requestUrl({ url });

      if (response.arrayBuffer) {
        await this.app.vault.adapter.writeBinary(filepath, response.arrayBuffer);
      }
    } catch (error) {
      console.error(`Failed to download image from ${url}:`, error);
      throw error;
    }
  }

  sanitizeFilename(name: string): string {
    // Remove or replace invalid filename characters
    return name
      .replace(/[\\/:*?"<>|]/g, '-')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 200) // Limit filename length
      || 'Untitled';
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}
