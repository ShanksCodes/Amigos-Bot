import { EmbedBuilder } from 'discord.js';
import { UserNote } from '../notes.types.js';

const EMBED_COLORS = {
  PRIMARY: 0x5865f2,
  SUCCESS: 0x57f287,
  ERROR: 0xed4245,
} as const;

/**
 * Creates the list embed displaying the user's notes, pagination, and their current quota.
 */
export function createNoteListEmbed(
  notes: UserNote[],
  totalCount: number,
  maxAllowed: number,
  page = 1,
  totalPages = 1,
  startIndex = 0,
): EmbedBuilder {
  const title =
    totalPages > 1
      ? `📝 Your Personal Notes (Page ${page}/${totalPages})`
      : '📝 Your Personal Notes';

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setColor(EMBED_COLORS.PRIMARY)
    .setFooter({ text: `${totalCount} / ${maxAllowed} notes used` });

  if (notes.length === 0) {
    embed.setDescription(
      'You do not have any notes yet.\nClick **➕ New Note** below or use `/notes add` to create your first note!',
    );
    return embed;
  }

  const lines = notes.map((note, index) => {
    const globalNumber = startIndex + index + 1;
    const timestamp = Math.floor(note.createdAt.getTime() / 1000);
    const escapedTitle = note.title.replace(/[*_`~|\\]/g, '\\$&');
    return `**${globalNumber}.** ${escapedTitle}\n↳ <t:${timestamp}:R>`;
  });

  const fullDescription = lines.join('\n\n');
  if (fullDescription.length > 4000) {
    embed.setDescription(fullDescription.slice(0, 3990) + '\n... (truncated)');
  } else {
    embed.setDescription(fullDescription);
  }

  return embed;
}

/**
 * Creates an embed displaying the full details of a specific note.
 */
export function createNoteViewEmbed(note: UserNote, noteNumber?: number): EmbedBuilder {
  const createdTimestamp = Math.floor(note.createdAt.getTime() / 1000);
  const updatedTimestamp = Math.floor(note.updatedAt.getTime() / 1000);

  const embed = new EmbedBuilder()
    .setTitle(`📝 ${note.title}`)
    .setDescription(note.content)
    .setColor(EMBED_COLORS.PRIMARY);

  if (noteNumber !== undefined) {
    embed.addFields({
      name: 'Note Number',
      value: `#${noteNumber}`,
      inline: true,
    });
  }

  embed.addFields(
    {
      name: 'Created',
      value: `<t:${createdTimestamp}:f> (<t:${createdTimestamp}:R>)`,
      inline: true,
    },
    {
      name: 'Last Updated',
      value: `<t:${updatedTimestamp}:R>`,
      inline: true,
    },
  );

  embed.setFooter({ text: `Note ID: ${note.id}` });
  return embed;
}

/**
 * Creates an embed confirming the successful creation of a note.
 */
export function createNoteCreatedEmbed(
  note: UserNote,
  count: number,
  maxAllowed: number,
): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('✅ Note Created')
    .setDescription(`Successfully created note **${note.title}**!`)
    .setColor(EMBED_COLORS.SUCCESS)
    .setFooter({ text: `${count} / ${maxAllowed} notes used` });
}

/**
 * Creates an embed confirming the successful update of a note.
 */
export function createNoteUpdatedEmbed(note: UserNote): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('✅ Note Updated')
    .setDescription(`Successfully updated note **${note.title}**!`)
    .setColor(EMBED_COLORS.SUCCESS)
    .setFooter({ text: `Note ID: ${note.id}` });
}

/**
 * Creates an embed confirming the successful deletion of a note.
 */
export function createNoteDeletedEmbed(
  noteTitle: string,
  count: number,
  maxAllowed: number,
): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('🗑️ Note Deleted')
    .setDescription(`Successfully deleted note **${noteTitle}**.`)
    .setColor(EMBED_COLORS.SUCCESS)
    .setFooter({ text: `${count} / ${maxAllowed} notes used` });
}

/**
 * Creates a standardized error embed for the notes feature.
 */
export function createErrorEmbed(message: string): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('⚠️ Notes Error')
    .setDescription(message)
    .setColor(EMBED_COLORS.ERROR);
}
