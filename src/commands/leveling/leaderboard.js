const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLeaderboard, getXpForLevel } = require('../../systems/leveling');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Lihat leaderboard leveling server'),

  async execute(interaction) {
    await interaction.deferReply();

    const data = getLeaderboard(interaction.guild.id, 10);

    if (data.length === 0) {
      return interaction.editReply('📊 Belum ada data leveling!');
    }

    let description = '';
    const medals = ['🥇', '🥈', '🥉'];

    for (let i = 0; i < data.length; i++) {
      const user = await interaction.client.users.fetch(data[i].user_id).catch(() => null);
      const username = user ? user.username : 'Unknown User';
      const medal = medals[i] || `**#${i + 1}**`;
      description += `${medal} ${username} — Level **${data[i].level}** (${data[i].xp}/${getXpForLevel(data[i].level)} XP)\n`;
    }

    const embed = new EmbedBuilder()
      .setTitle('🏆 Leaderboard')
      .setDescription(description)
      .setColor(0xfee75c)
      .setFooter({ text: `Zen Developer • Top ${data.length} members` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
