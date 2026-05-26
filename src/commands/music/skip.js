const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getQueue } = require('../../systems/music');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip lagu yang sedang diputar'),

  async execute(interaction, client) {
    const queue = getQueue(client, interaction.guild.id);

    if (!queue.current) {
      return interaction.reply({ content: '❌ Tidak ada lagu yang diputar!', ephemeral: true });
    }

    const skipped = queue.current.title;
    queue.skip();

    const embed = new EmbedBuilder()
      .setDescription(`⏭️ Skipped **${skipped}**`)
      .setColor(0x5865f2);

    await interaction.reply({ embeds: [embed] });
  },
};
