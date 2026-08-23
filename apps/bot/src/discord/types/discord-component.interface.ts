import { MessageComponentInteraction } from 'discord.js';

export interface DiscordComponent {
  /**
   * The prefix for the customId that this component handles.
   * e.g., 'duel:' will handle 'duel:attack:123'
   */
  readonly customIdPrefix: string;

  /**
   * Logic to execute when the component is interacted with.
   */
  execute(interaction: MessageComponentInteraction): Promise<void>;
}
