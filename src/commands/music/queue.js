const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getQueue } = require('../../systems/music');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Lihat antrian lagu'),

  async execute(interaction, client) {
    const queue = getQueue(client, interaction.guild.id);

    if (!queue.current && queue.songs.length === 0) {
      return interaction.reply({ content: '📋 Queue kosong!', ephemeral: true });
    }

    let description = '';

    if (queue.current) {
      description += `**Now Playing:**\n🎵 [${queue.current.title}](${queue.current.url}) - ${queue.current.duration || '?'}\n\n`;
    }

    if (queue.songs.length > 0) {
      description += '**Up Next:**\n';
      const display = queue.songs.slice(0, 10);
      display.forEach((song, i) => {
        description += `\`${i + 1}.\` [${song.title}](${song.url}) - ${song.duration || '?'}\n`;
      });
      if (queue.songs.length > 10) {
        description += `\n... dan ${queue.songs.length - 10} lagu lagi.`;
      }
    }

    const embed = new EmbedBuilder()
      .setTitle('📋 Music Queue')
      .setDescription(description)
      .addFields(
        { name: '🔁 Loop', value: queue.loop ? 'On' : 'Off', inline: true },
        { name: '📊 Total', value: `${queue.songs.length + (queue.current ? 1 : 0)} song(s)`, inline: true },
      )
      .setColor(0x1db954)
      .setFooter({ text: 'Zen Developer • Music System' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
