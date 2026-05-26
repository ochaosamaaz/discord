const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserLevel, getXpForLevel } = require('../../systems/leveling');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Lihat level dan XP kamu')
    .addUserOption(option =>
      option.setName('user').setDescription('Lihat rank user lain')
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    const data = getUserLevel(user.id, interaction.guild.id);

    const xpNeeded = getXpForLevel(data.level);
    const progress = Math.floor((data.xp / xpNeeded) * 20);
    const progressBar = '█'.repeat(progress) + '░'.repeat(20 - progress);

    const embed = new EmbedBuilder()
      .setTitle(`📊 Rank - ${user.username}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '🏆 Level', value: `${data.level}`, inline: true },
        { name: '✨ XP', value: `${data.xp}/${xpNeeded}`, inline: true },
        { name: '💬 Messages', value: `${data.total_messages}`, inline: true },
        { name: '📈 Progress', value: `\`${progressBar}\` ${Math.floor((data.xp / xpNeeded) * 100)}%` }
      )
      .setColor(0x5865f2)
      .setFooter({ text: 'Zen Developer • Leveling System' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
