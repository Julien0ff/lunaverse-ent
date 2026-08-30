import { ModalBuilder, ActionRowBuilder, TextInputBuilder, StringSelectMenuBuilder } from 'discord.js'
const modal = new ModalBuilder()
const sel = new StringSelectMenuBuilder().setCustomId('sel')
modal.addComponents(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(sel))
