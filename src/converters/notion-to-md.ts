import { BlockObjectResponse, RichTextItemResponse } from '@notionhq/client/build/src/api-endpoints';

// Extended block type to include children
type BlockWithChildren = BlockObjectResponse & {
  children?: BlockWithChildren[];
};

export interface ConversionResult {
  markdown: string;
  images: ImageReference[];
}

export interface ImageReference {
  url: string;
  filename: string;
  blockId: string;
}

/**
 * Convert Notion blocks to Markdown
 */
export function blocksToMarkdown(blocks: BlockWithChildren[]): ConversionResult {
  const images: ImageReference[] = [];
  const lines: string[] = [];

  for (const block of blocks) {
    const result = blockToMarkdown(block, 0);
    lines.push(result.markdown);
    images.push(...result.images);
  }

  return {
    markdown: lines.join('\n'),
    images,
  };
}

/**
 * Convert a single Notion block to Markdown
 */
function blockToMarkdown(block: BlockWithChildren, indent: number): ConversionResult {
  const images: ImageReference[] = [];
  let markdown = '';
  const indentStr = '  '.repeat(indent);

  switch (block.type) {
    case 'paragraph':
      markdown = richTextToMarkdown(block.paragraph.rich_text);
      break;

    case 'heading_1':
      markdown = `# ${richTextToMarkdown(block.heading_1.rich_text)}`;
      break;

    case 'heading_2':
      markdown = `## ${richTextToMarkdown(block.heading_2.rich_text)}`;
      break;

    case 'heading_3':
      markdown = `### ${richTextToMarkdown(block.heading_3.rich_text)}`;
      break;

    case 'bulleted_list_item':
      markdown = `${indentStr}- ${richTextToMarkdown(block.bulleted_list_item.rich_text)}`;
      break;

    case 'numbered_list_item':
      markdown = `${indentStr}1. ${richTextToMarkdown(block.numbered_list_item.rich_text)}`;
      break;

    case 'to_do':
      const checked = block.to_do.checked ? 'x' : ' ';
      markdown = `${indentStr}- [${checked}] ${richTextToMarkdown(block.to_do.rich_text)}`;
      break;

    case 'toggle':
      // Use details/summary for toggles, or just render as collapsible in Obsidian
      const toggleText = richTextToMarkdown(block.toggle.rich_text);
      markdown = `> [!info]- ${toggleText}`;
      break;

    case 'quote':
      const quoteLines = richTextToMarkdown(block.quote.rich_text).split('\n');
      markdown = quoteLines.map(line => `> ${line}`).join('\n');
      break;

    case 'code':
      const language = block.code.language || '';
      const codeContent = richTextToMarkdown(block.code.rich_text);
      markdown = `\`\`\`${language}\n${codeContent}\n\`\`\``;
      break;

    case 'divider':
      markdown = '---';
      break;

    case 'callout':
      const calloutIcon = block.callout.icon?.type === 'emoji' ? block.callout.icon.emoji : '';
      const calloutText = richTextToMarkdown(block.callout.rich_text);
      markdown = `> [!note] ${calloutIcon}\n> ${calloutText}`;
      break;

    case 'image':
      const imageUrl = block.image.type === 'external'
        ? block.image.external.url
        : block.image.file.url;
      const imageCaption = block.image.caption
        ? richTextToMarkdown(block.image.caption)
        : '';
      const filename = `image_${block.id.replace(/-/g, '')}.png`;

      images.push({
        url: imageUrl,
        filename,
        blockId: block.id,
      });

      // Use Obsidian image embed syntax
      markdown = imageCaption
        ? `![[${filename}]]\n*${imageCaption}*`
        : `![[${filename}]]`;
      break;

    case 'bookmark':
      const bookmarkUrl = block.bookmark.url;
      const bookmarkCaption = block.bookmark.caption
        ? richTextToMarkdown(block.bookmark.caption)
        : bookmarkUrl;
      markdown = `[${bookmarkCaption}](${bookmarkUrl})`;
      break;

    case 'link_preview':
      markdown = `[Link](${block.link_preview.url})`;
      break;

    case 'equation':
      // Block equation
      markdown = `$$\n${block.equation.expression}\n$$`;
      break;

    case 'table':
      markdown = '<!-- Table import not yet supported -->';
      break;

    case 'column_list':
      // Columns are not directly supported in Markdown
      markdown = '<!-- Column layout not supported -->';
      break;

    case 'child_page':
      // Create a wikilink to the child page
      markdown = `[[${block.child_page.title}]]`;
      break;

    case 'child_database':
      markdown = `<!-- Database: ${block.child_database.title} -->`;
      break;

    case 'embed':
      markdown = `[Embed](${block.embed.url})`;
      break;

    case 'video':
      const videoUrl = block.video.type === 'external'
        ? block.video.external.url
        : block.video.file.url;
      markdown = `[Video](${videoUrl})`;
      break;

    case 'file':
      const fileUrl = block.file.type === 'external'
        ? block.file.external.url
        : block.file.file.url;
      const fileName = block.file.name || 'file';
      markdown = `[${fileName}](${fileUrl})`;
      break;

    case 'pdf':
      const pdfUrl = block.pdf.type === 'external'
        ? block.pdf.external.url
        : block.pdf.file.url;
      markdown = `[PDF](${pdfUrl})`;
      break;

    case 'audio':
      const audioUrl = block.audio.type === 'external'
        ? block.audio.external.url
        : block.audio.file.url;
      markdown = `[Audio](${audioUrl})`;
      break;

    case 'synced_block':
      // Handle synced block children
      if (block.synced_block.synced_from === null && block.children) {
        const syncResult = processChildren(block.children, indent);
        markdown = syncResult.markdown;
        images.push(...syncResult.images);
      }
      break;

    case 'template':
      markdown = '<!-- Template block not supported -->';
      break;

    case 'link_to_page':
      if (block.link_to_page.type === 'page_id') {
        markdown = `[[notion://${block.link_to_page.page_id}]]`;
      }
      break;

    case 'table_of_contents':
      markdown = '<!-- Table of Contents -->';
      break;

    case 'breadcrumb':
      markdown = '<!-- Breadcrumb -->';
      break;

    default:
      markdown = `<!-- Unsupported block type: ${block.type} -->`;
  }

  // Process children for blocks that have them
  if (block.children && block.children.length > 0 && !['synced_block'].includes(block.type)) {
    const childResult = processChildren(block.children, indent + 1);
    markdown += '\n' + childResult.markdown;
    images.push(...childResult.images);
  }

  return { markdown, images };
}

/**
 * Process child blocks
 */
function processChildren(children: BlockWithChildren[], indent: number): ConversionResult {
  const images: ImageReference[] = [];
  const lines: string[] = [];

  for (const child of children) {
    const result = blockToMarkdown(child, indent);
    lines.push(result.markdown);
    images.push(...result.images);
  }

  return {
    markdown: lines.join('\n'),
    images,
  };
}

/**
 * Convert Notion rich text to Markdown
 */
function richTextToMarkdown(richText: RichTextItemResponse[]): string {
  if (!richText || richText.length === 0) {
    return '';
  }

  return richText.map(item => {
    let text = item.plain_text;

    // Handle annotations
    if (item.annotations) {
      if (item.annotations.code) {
        text = `\`${text}\``;
      }
      if (item.annotations.bold) {
        text = `**${text}**`;
      }
      if (item.annotations.italic) {
        text = `*${text}*`;
      }
      if (item.annotations.strikethrough) {
        text = `~~${text}~~`;
      }
      if (item.annotations.underline) {
        // Markdown doesn't have native underline, use HTML
        text = `<u>${text}</u>`;
      }
    }

    // Handle links
    if (item.type === 'text' && item.text.link) {
      text = `[${text}](${item.text.link.url})`;
    }

    // Handle mentions
    if (item.type === 'mention') {
      if (item.mention.type === 'page') {
        text = `[[notion://${item.mention.page.id}|${text}]]`;
      } else if (item.mention.type === 'date') {
        const date = item.mention.date;
        text = date.end
          ? `${date.start} → ${date.end}`
          : date.start;
      } else if (item.mention.type === 'user') {
        text = `@${text}`;
      }
    }

    // Handle equations (inline)
    if (item.type === 'equation') {
      text = `$${item.equation.expression}$`;
    }

    return text;
  }).join('');
}

/**
 * Generate frontmatter YAML for a Notion page
 */
export function generateFrontmatter(page: {
  id: string;
  title: string;
  url: string;
  lastEditedTime: string;
  icon?: string;
}): string {
  const frontmatter: Record<string, string> = {
    notion_id: page.id,
    notion_url: page.url,
    notion_last_sync: new Date().toISOString(),
    notion_last_edited: page.lastEditedTime,
  };

  if (page.icon) {
    frontmatter.icon = page.icon;
  }

  const yaml = Object.entries(frontmatter)
    .map(([key, value]) => `${key}: "${value}"`)
    .join('\n');

  return `---\n${yaml}\n---\n\n`;
}
