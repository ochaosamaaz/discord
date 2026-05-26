const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { deleteQueue } = require('../../systems/music');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop musik dan disconnect bot'),

  async execute(interaction, client) {
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({ content: '❌ Kamu harus di voice channel!', ephemeral: true });
    }

    deleteQueue(client, interaction.guild.id);

    const embed = new EmbedBuilder()
      .setDescription('⏹️ Music stopped & bot disconnected!')
      .setColor(0xed4245);

    await interaction.reply({ embeds: [embed] });
  },
};
