# Obsidian Notion Sync

A bidirectional synchronization plugin for Obsidian that allows you to import notes from Notion and export changes back to Notion.

## Features

- **Import from Notion**: Pull your Notion pages and databases into your Obsidian vault as markdown files
- **Export to Notion**: Push your modified Obsidian notes back to Notion
- **Preserve Formatting**: Maintains headings, lists, code blocks, images, and links
- **Sync Metadata**: Tracks synchronization status via frontmatter
- **Secure Configuration**: Store your Notion API credentials safely

## Installation

### From Obsidian Community Plugins (Coming Soon)
1. Open Obsidian Settings
2. Go to Community Plugins and disable Safe Mode
3. Click Browse and search for "Notion Sync"
4. Install and enable the plugin

### Manual Installation
1. Download the latest release from [GitHub Releases](https://github.com/auditlog/obsidian-notion-sync/releases)
2. Extract the files to your vault's `.obsidian/plugins/obsidian-notion-sync/` folder
3. Reload Obsidian
4. Enable the plugin in Settings > Community Plugins

### For Development
```bash
# Clone the repository
git clone https://github.com/auditlog/obsidian-notion-sync.git
cd obsidian-notion-sync

# Install dependencies
npm install

# Build the plugin
npm run build

# For development with auto-reload
npm run dev
```

## Configuration

### Getting Your Notion API Key

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Click "New integration"
3. Give it a name (e.g., "Obsidian Sync")
4. Select the workspace you want to connect
5. In the **Access** tab, select which pages/databases the integration can access
6. Copy the "Internal Integration Secret" (starts with `ntn_`)

### Plugin Settings

1. Open Obsidian Settings > Community Plugins > Notion Sync
2. Paste your Notion API Key (stored securely in plugin settings)
3. Click "Test Connection" to verify your API key works
4. (Optional) Set default database ID for exports
5. Configure import folder and sync preferences

**Note**: Your API key is stored securely in Obsidian's plugin data folder (`.obsidian/plugins/obsidian-notion-sync/data.json`). No `.env` file is needed.

## Usage

### Importing from Notion

1. Open Command Palette (Ctrl/Cmd + P)
2. Search for "Notion Sync: Import"
3. Select pages or databases to import
4. Choose destination folder in your vault
5. Click Import

Imported notes will include frontmatter with sync metadata:

```yaml
---
notion_id: "abc123-def456"
notion_last_sync: "2024-01-15T10:30:00Z"
notion_url: "https://notion.so/..."
---
```

### Exporting to Notion

1. Open the note you want to export
2. Open Command Palette (Ctrl/Cmd + P)
3. Search for "Notion Sync: Export"
4. Select target database (or update existing page)
5. Confirm export

## Supported Content Types

### Import (Notion → Obsidian)
- [x] Text and paragraphs
- [x] Headings (H1-H3)
- [x] Bullet lists
- [x] Numbered lists
- [x] To-do lists (checkboxes)
- [x] Code blocks (with language)
- [x] Quotes
- [x] Dividers
- [x] Images
- [x] Internal links
- [ ] Tables (planned)
- [ ] Embeds (planned)

### Export (Obsidian → Notion)
- [x] Text and paragraphs
- [x] Headings
- [x] Lists
- [x] Code blocks
- [x] Quotes
- [x] Images (upload)
- [ ] Wikilinks → Notion links (planned)

## Roadmap

See [PRD.md](./PRD.md) for detailed product requirements.

- **v0.1.0** - Basic import functionality
- **v0.2.0** - Export functionality
- **v0.3.0** - Batch operations and sync dashboard
- **v1.0.0** - Stable release with conflict resolution

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Development

```bash
# Install dependencies
npm install

# Run in development mode (watches for changes)
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Run tests
npm run test
```

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Acknowledgments

- Inspired by [obsidian-importer](https://github.com/obsidianmd/obsidian-importer)
- Built with [Obsidian Plugin API](https://docs.obsidian.md/)
- Uses [Notion API](https://developers.notion.com/)

## Support

If you find this plugin useful, consider:
- Starring the repository
- Reporting issues on [GitHub Issues](https://github.com/auditlog/obsidian-notion-sync/issues)
- Contributing to development
