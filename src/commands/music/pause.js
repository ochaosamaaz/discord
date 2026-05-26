const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getQueue } = require('../../systems/music');
const { AudioPlayerStatus } = require('@discordjs/voice');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pause/Resume lagu yang sedang diputar'),

  async execute(interaction, client) {
    const queue = getQueue(client, interaction.guild.id);

    if (!queue.current) {
      return interaction.reply({ content: '❌ Tidak ada lagu yang diputar!', ephemeral: true });
    }

    if (queue.player.state.status === AudioPlayerStatus.Paused) {
      queue.resume();
      const embed = new EmbedBuilder()
        .setDescription('▶️ Resumed!')
        .setColor(0x57f287);
      await interaction.reply({ embeds: [embed] });
    } else {
      queue.pause();
      const embed = new EmbedBuilder()
        .setDescription('⏸️ Paused!')
        .setColor(0xfee75c);
      await interaction.reply({ embeds: [embed] });
    }
  },
};
