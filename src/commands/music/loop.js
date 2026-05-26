const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getQueue } = require('../../systems/music');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Toggle loop mode'),

  async execute(interaction, client) {
    const queue = getQueue(client, interaction.guild.id);
    const looping = queue.toggleLoop();

    const embed = new EmbedBuilder()
      .setDescription(looping ? '🔁 Loop **enabled**!' : '➡️ Loop **disabled**!')
      .setColor(looping ? 0x57f287 : 0x99aab5);

    await interaction.reply({ embeds: [embed] });
  },
};
