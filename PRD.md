# Product Requirements Document (PRD)
# Obsidian Notion Sync

## 1. Overview

### 1.1 Product Name
**Obsidian Notion Sync** - A bidirectional synchronization plugin for Obsidian and Notion.

### 1.2 Problem Statement
Users who work with both Notion and Obsidian face challenges when trying to:
- Migrate their notes from Notion to Obsidian
- Keep notes synchronized between both platforms
- Maintain formatting and structure during transfer

### 1.3 Solution
A plugin that enables:
- **Import**: Pull notes from Notion into Obsidian vault
- **Export**: Push modified notes from Obsidian back to Notion
- **Configuration**: Securely store API keys and sync preferences

## 2. Goals and Non-Goals

### 2.1 Goals
- Seamless import of Notion pages and databases to Obsidian markdown
- Export modified Obsidian notes back to Notion
- Preserve formatting, links, and metadata during sync
- Secure storage of Notion API credentials
- User-friendly configuration interface within Obsidian

### 2.2 Non-Goals
- Real-time synchronization (initial version will use manual triggers)
- Support for other services beyond Notion
- Collaborative editing features
- Conflict resolution for simultaneous edits (v1 will use simple overwrite)

## 3. User Stories

### 3.1 Import from Notion
> As a user, I want to import my Notion pages into Obsidian so that I can work with them offline and use Obsidian's features.

**Acceptance Criteria:**
- User can connect to Notion via API key
- User can browse and select pages/databases to import
- Imported content preserves headings, lists, code blocks, and links
- Attachments and images are downloaded locally
- Internal Notion links are converted to Obsidian wikilinks

### 3.2 Export to Notion
> As a user, I want to export my modified Obsidian notes back to Notion so that I can share them with team members who use Notion.

**Acceptance Criteria:**
- User can select notes to export
- Markdown is converted to Notion blocks
- Existing Notion pages are updated (not duplicated)
- New notes create new Notion pages
- User receives confirmation of successful export

### 3.3 Configuration Management
> As a user, I want to securely store my Notion API credentials so that I don't have to enter them every time.

**Acceptance Criteria:**
- Plugin settings panel for API key input
- Credentials stored securely in plugin settings
- Option to use .env file for local development
- Clear feedback when credentials are invalid

## 4. Technical Requirements

### 4.1 Platform
- **Target**: Obsidian desktop and mobile
- **Language**: TypeScript
- **Build Tool**: esbuild
- **Notion API**: Official Notion API (v2022-06-28 or later)

### 4.2 Dependencies
```json
{
  "@notionhq/client": "^2.x",
  "obsidian": "latest"
}
```

### 4.3 File Structure
```
obsidian-notion-sync/
├── src/
│   ├── main.ts              # Plugin entry point
│   ├── settings.ts          # Settings tab and configuration
│   ├── notion/
│   │   ├── client.ts        # Notion API client wrapper
│   │   ├── importer.ts      # Import logic
│   │   └── exporter.ts      # Export logic
│   ├── converters/
│   │   ├── notion-to-md.ts  # Notion blocks to Markdown
│   │   └── md-to-notion.ts  # Markdown to Notion blocks
│   └── utils/
│       ├── frontmatter.ts   # YAML frontmatter handling
│       └── links.ts         # Link conversion utilities
├── styles.css               # Plugin styles
├── manifest.json            # Obsidian plugin manifest
├── package.json
├── tsconfig.json
├── esbuild.config.mjs
├── .env.example             # Example environment variables
├── .gitignore
├── README.md
└── PRD.md
```

### 4.4 Configuration Storage
1. **Plugin Settings** (recommended for end users):
   - Stored in `.obsidian/plugins/obsidian-notion-sync/data.json`
   - Managed through Obsidian's settings API

2. **Environment Variables** (for development):
   - `.env` file in vault root (gitignored)
   - Variables: `NOTION_API_KEY`, `NOTION_DATABASE_ID`

### 4.5 Data Model

#### Sync Metadata (stored in frontmatter)
```yaml
---
notion_id: "page-uuid-here"
notion_last_sync: "2024-01-15T10:30:00Z"
notion_url: "https://notion.so/..."
---
```

## 5. Features Breakdown

### 5.1 Phase 1 - MVP (Import Only)
- [ ] Notion API authentication
- [ ] List available pages and databases
- [ ] Import single page to markdown
- [ ] Convert Notion blocks: paragraphs, headings, lists, code, quotes
- [ ] Download and embed images
- [ ] Store sync metadata in frontmatter
- [ ] Basic settings UI

### 5.2 Phase 2 - Export
- [ ] Export single note to Notion
- [ ] Update existing Notion pages (based on frontmatter ID)
- [ ] Create new pages in specified database
- [ ] Convert markdown to Notion blocks
- [ ] Handle image uploads

### 5.3 Phase 3 - Advanced Features
- [ ] Batch import/export
- [ ] Selective sync (choose specific properties)
- [ ] Sync status dashboard
- [ ] Conflict detection and resolution
- [ ] Scheduled sync (optional)

## 6. Security Considerations

### 6.1 API Key Storage
- API keys stored in Obsidian's encrypted plugin data
- Never logged or exposed in error messages
- Option for users to use environment variables

### 6.2 Data Privacy
- All data processed locally
- No external servers besides Notion API
- User controls which pages are synced

## 7. Success Metrics
- Successful import of 95%+ Notion content types
- Export round-trip preserves essential formatting
- Plugin load time < 500ms
- No data loss during sync operations

## 8. Timeline

| Phase | Description | Target |
|-------|-------------|--------|
| Phase 1 | MVP - Import functionality | 4 weeks |
| Phase 2 | Export functionality | 3 weeks |
| Phase 3 | Advanced features | 4 weeks |

## 9. Open Questions
1. How to handle Notion database properties mapping to Obsidian metadata?
2. Should we support Notion's relation and rollup properties?
3. How to handle Notion embeds (videos, files)?
4. Strategy for very large pages (Notion API pagination)?

## 10. References
- [Obsidian Plugin API](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)
- [Notion API Documentation](https://developers.notion.com/)
- [obsidian-importer](https://github.com/obsidianmd/obsidian-importer) - inspiration
