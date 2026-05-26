const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getQueue } = require('../../systems/music');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Putar lagu dari YouTube/Spotify')
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
      const play = require('play-dl');

      let songInfo;
      let songs = [];

      // Check if it's a URL or search query
      if (play.yt_validate(query) === 'video') {
        const info = await play.video_info(query);
        songs.push({
          title: info.video_details.title,
          url: info.video_details.url,
          duration: info.video_details.durationRaw,
          thumbnail: info.video_details.thumbnails[0]?.url,
          requestedBy: interaction.user,
        });
      } else if (play.yt_validate(query) === 'playlist') {
        const playlist = await play.playlist_info(query, { incomplete: true });
        const videos = await playlist.all_videos();
        for (const video of videos.slice(0, 50)) {
          songs.push({
            title: video.title,
            url: video.url,
            duration: video.durationRaw,
            thumbnail: video.thumbnails[0]?.url,
            requestedBy: interaction.user,
          });
        }
      } else {
        // Search YouTube
        const searched = await play.search(query, { limit: 1 });
        if (searched.length === 0) {
          return interaction.editReply('❌ Lagu tidak ditemukan!');
        }
        songs.push({
          title: searched[0].title,
          url: searched[0].url,
          duration: searched[0].durationRaw,
          thumbnail: searched[0].thumbnails[0]?.url,
          requestedBy: interaction.user,
        });
      }

      // Connect if not connected
      if (!queue.connection) {
        await queue.connect(voiceChannel, interaction.channel);
      }

      // Add songs to queue
      for (const song of songs) {
        queue.addSong(song);
      }

      if (songs.length === 1) {
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
      } else {
        const embed = new EmbedBuilder()
          .setTitle('🎵 Playlist Added to Queue')
          .setDescription(`**${songs.length} lagu** ditambahkan ke queue!`)
          .setColor(0x1db954)
          .setFooter({ text: `Requested by ${interaction.user.username}` });

        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Play command error:', error);
      await interaction.editReply('❌ Gagal memutar lagu! Coba lagi nanti.');
    }
  },
};
