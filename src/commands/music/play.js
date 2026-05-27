const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getQueue } = require('../../systems/music');
const { execSync } = require('child_process');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Putar lagu dari YouTube')
    .addStringOption(opt =>
      opt.setName('query').setDescription('URL atau nama lagu').setRequired(true)
    ),

  async execute(interaction, client) {
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({ content: '❌ Kamu harus join voice channel dulu!', ephemeral: true });
    }

    await interaction.deferReply();

    const query = interaction.options.getString('query');
    const queue = getQueue(client, interaction.guild.id);

    try {
      let songs = [];

      // Check if it's a URL or search query
      const isUrl = query.startsWith('http://') || query.startsWith('https://');
      let searchQuery = isUrl ? query : `ytsearch:${query}`;

      // Use yt-dlp to get song info
      const result = execSync(
        `yt-dlp --no-playlist --print "%(title)s|||%(webpage_url)s|||%(duration_string)s|||%(thumbnail)s" "${searchQuery}"`,
        { encoding: 'utf-8', timeout: 15000 }
      ).trim();

      const lines = result.split('\n');
      for (const line of lines.slice(0, 1)) { // Only take first result
        const [title, url, duration, thumbnail] = line.split('|||');
        if (title && url) {
          songs.push({
            title: title.trim(),
            url: url.trim(),
            duration: duration?.trim() || 'Unknown',
            thumbnail: thumbnail?.trim() || null,
            requestedBy: interaction.user,
          });
        }
      }

      if (songs.length === 0) {
        return interaction.editReply('❌ Lagu tidak ditemukan!');
      }

      // Connect if not connected
      if (!queue.connection) {
        await queue.connect(voiceChannel, interaction.channel);
      }

      // Add songs to queue
      for (const song of songs) {
        queue.addSong(song);
      }

      const embed = new EmbedBuilder()
        .setTitle('🎵 Added to Queue')
        .setDescription(`**[${songs[0].title}](${songs[0].url})**`)
        .addFields(
          { name: '⏱️ Duration', value: songs[0].duration || 'Unknown', inline: true },
          { name: '📋 Position', value: `#${queue.songs.length}`, inline: true },
        )
        .setThumbnail(songs[0].thumbnail || null)
        .setColor(0x1db954)
        .setFooter({ text: `Requested by ${interaction.user.username}` });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Play command error:', error);
      await interaction.editReply('❌ Gagal memutar lagu! Pastikan yt-dlp & ffmpeg sudah terinstall.');
    }
  },
};
