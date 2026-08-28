import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalActionRowComponentBuilder,
  ModalBuilder,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { NOTES_CONSTANTS } from '../notes.constants.js';
import { UserNote } from '../notes.types.js';

/**
 * Builds the modal for adding a new private personal note.
 */
export function createAddNoteModal(): ModalBuilder {
  const titleInput = new TextInputBuilder()
    .setCustomId('title')
    .setLabel('Title')
    .setStyle(TextInputStyle.Short)
    .setMinLength(NOTES_CONSTANTS.TITLE_MIN_LENGTH)
    .setMaxLength(NOTES_CONSTANTS.TITLE_MAX_LENGTH)
    .setPlaceholder('Enter a title for your note...')
    .setRequired(true);

  const contentInput = new TextInputBuilder()
    .setCustomId('content')
    .setLabel('Content')
    .setStyle(TextInputStyle.Paragraph)
    .setMinLength(NOTES_CONSTANTS.CONTENT_MIN_LENGTH)
    .setMaxLength(NOTES_CONSTANTS.CONTENT_MAX_LENGTH)
    .setPlaceholder('Write your private note content here...')
    .setRequired(true);

  const firstRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(titleInput);
  const secondRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(contentInput);

  return new ModalBuilder()
    .setCustomId(NOTES_CONSTANTS.MODAL_CUSTOM_ID_ADD)
    .setTitle('Create Personal Note')
    .addComponents(firstRow, secondRow);
}

/**
 * Builds the prefilled modal for editing an existing private note.
 */
export function createEditNoteModal(note: UserNote): ModalBuilder {
  const titleInput = new TextInputBuilder()
    .setCustomId('title')
    .setLabel('Title')
    .setStyle(TextInputStyle.Short)
    .setMinLength(NOTES_CONSTANTS.TITLE_MIN_LENGTH)
    .setMaxLength(NOTES_CONSTANTS.TITLE_MAX_LENGTH)
    .setValue(note.title)
    .setRequired(true);

  const contentInput = new TextInputBuilder()
    .setCustomId('content')
    .setLabel('Content')
    .setStyle(TextInputStyle.Paragraph)
    .setMinLength(NOTES_CONSTANTS.CONTENT_MIN_LENGTH)
    .setMaxLength(NOTES_CONSTANTS.CONTENT_MAX_LENGTH)
    .setValue(note.content)
    .setRequired(true);

  const firstRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(titleInput);
  const secondRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(contentInput);

  return new ModalBuilder()
    .setCustomId(`${NOTES_CONSTANTS.MODAL_CUSTOM_ID_EDIT_PREFIX}${note.id}`)
    .setTitle('Edit Personal Note')
    .addComponents(firstRow, secondRow);
}

/**
 * Builds the interactive UI components for the notes list (dropdown + pagination buttons).
 */
export function createNoteListComponents(
  notesOnPage: UserNote[],
  page: number,
  totalPages: number,
  canAdd: boolean,
  startIndex: number,
): Array<ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>> {
  const rows: Array<ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>> = [];

  // Dropdown select menu (if there are notes on this page)
  if (notesOnPage.length > 0) {
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`${NOTES_CONSTANTS.COMPONENT_LIST_PREFIX}select:${page}`)
      .setPlaceholder('Select a note to view...');

    const options = notesOnPage.map((note, index) => {
      const globalNumber = startIndex + index + 1;
      const cleanTitle = note.title.length > 85 ? `${note.title.slice(0, 82)}...` : note.title;
      const cleanContent =
        note.content.length > 90 ? `${note.content.replace(/\s+/g, ' ').slice(0, 87)}...` : note.content;

      return {
        label: `${globalNumber}. ${cleanTitle}`,
        description: cleanContent || 'No content preview',
        value: note.id,
        emoji: '📝',
      };
    });

    selectMenu.addOptions(options);
    rows.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu));
  }

  // Navigation & Action buttons
  const prevButton = new ButtonBuilder()
    .setCustomId(`${NOTES_CONSTANTS.COMPONENT_LIST_PREFIX}page:${page - 1}`)
    .setLabel('Previous')
    .setEmoji('◀️')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(page <= 1);

  const newNoteButton = new ButtonBuilder()
    .setCustomId(`${NOTES_CONSTANTS.COMPONENT_BTN_PREFIX}add`)
    .setLabel('New Note')
    .setEmoji('➕')
    .setStyle(ButtonStyle.Success)
    .setDisabled(!canAdd);

  const nextButton = new ButtonBuilder()
    .setCustomId(`${NOTES_CONSTANTS.COMPONENT_LIST_PREFIX}page:${page + 1}`)
    .setLabel('Next')
    .setEmoji('▶️')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(page >= totalPages);

  const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    prevButton,
    newNoteButton,
    nextButton,
  );

  rows.push(buttonRow);
  return rows;
}

/**
 * Builds the interactive action buttons for the Note View screen.
 */
export function createNoteViewComponents(
  noteId: string,
  page = 1,
): ActionRowBuilder<ButtonBuilder> {
  const editButton = new ButtonBuilder()
    .setCustomId(`${NOTES_CONSTANTS.COMPONENT_BTN_PREFIX}edit:${noteId}:${page}`)
    .setLabel('Edit')
    .setEmoji('✏️')
    .setStyle(ButtonStyle.Primary);

  const deleteButton = new ButtonBuilder()
    .setCustomId(`${NOTES_CONSTANTS.COMPONENT_BTN_PREFIX}delete:${noteId}:${page}`)
    .setLabel('Delete')
    .setEmoji('🗑️')
    .setStyle(ButtonStyle.Danger);

  const backButton = new ButtonBuilder()
    .setCustomId(`${NOTES_CONSTANTS.COMPONENT_BTN_PREFIX}back:${page}`)
    .setLabel('Back to List')
    .setEmoji('◀️')
    .setStyle(ButtonStyle.Secondary);

  return new ActionRowBuilder<ButtonBuilder>().addComponents(editButton, deleteButton, backButton);
}

