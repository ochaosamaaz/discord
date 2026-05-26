const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus, entersState } = require('@discordjs/voice');

class MusicQueue {
  constructor(guildId) {
    this.guildId = guildId;
    this.songs = [];
    this.current = null;
    this.player = createAudioPlayer();
    this.connection = null;
    this.loop = false;
    this.volume = 100;
    this.textChannel = null;

    this.player.on(AudioPlayerStatus.Idle, () => {
      if (this.loop && this.current) {
        this.songs.unshift(this.current);
      }
      this.playNext();
    });

    this.player.on('error', (error) => {
      console.error('Music player error:', error);
      this.playNext();
    });
  }

  async connect(voiceChannel, textChannel) {
    this.textChannel = textChannel;
    this.connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: this.guildId,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });

    this.connection.subscribe(this.player);

    this.connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(this.connection, VoiceConnectionStatus.Signalling, 5000),
          entersState(this.connection, VoiceConnectionStatus.Connecting, 5000),
        ]);
      } catch {
        this.destroy();
      }
    });
  }

  addSong(song) {
    this.songs.push(song);
    if (!this.current) {
      this.playNext();
    }
  }

  async playNext() {
    if (this.songs.length === 0) {
      this.current = null;
      if (this.textChannel) {
        const embed = new EmbedBuilder()
          .setDescription('🎵 Queue habis! Tambahkan lagu lagi atau bot akan leave.')
          .setColor(0xfee75c);
        this.textChannel.send({ embeds: [embed] }).catch(() => {});
      }
      // Auto-disconnect after 2 minutes of no songs
      setTimeout(() => {
        if (!this.current && this.connection) {
          this.destroy();
        }
      }, 120000);
      return;
    }

    this.current = this.songs.shift();

    try {
      const play = require('play-dl');
      const stream = await play.stream(this.current.url);
      const resource = createAudioResource(stream.stream, { inputType: stream.type });
      this.player.play(resource);

      if (this.textChannel) {
        const embed = new EmbedBuilder()
          .setTitle('🎵 Now Playing')
          .setDescription(`**[${this.current.title}](${this.current.url})**`)
          .addFields(
            { name: '⏱️ Duration', value: this.current.duration || 'Unknown', inline: true },
            { name: '👤 Requested by', value: `${this.current.requestedBy}`, inline: true },
            { name: '📋 Queue', value: `${this.songs.length} song(s)`, inline: true },
          )
          .setThumbnail(this.current.thumbnail || null)
          .setColor(0x1db954)
          .setFooter({ text: 'Zen Developer • Music System' });

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('music_pause').setEmoji('⏸️').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('music_skip').setEmoji('⏭️').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('music_stop').setEmoji('⏹️').setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId('music_loop').setEmoji('🔁').setStyle(this.loop ? ButtonStyle.Success : ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('music_queue').setEmoji('📋').setStyle(ButtonStyle.Primary),
        );

        this.textChannel.send({ embeds: [embed], components: [row] }).catch(() => {});
      }
    } catch (error) {
      console.error('Error playing song:', error);
      if (this.textChannel) {
        this.textChannel.send('❌ Error memutar lagu, skip ke lagu berikutnya...').catch(() => {});
      }
      this.playNext();
    }
  }

  pause() {
    this.player.pause();
  }

  resume() {
    this.player.unpause();
  }

  skip() {
    this.player.stop();
  }

  stop() {
    this.songs = [];
    this.current = null;
    this.player.stop();
  }

  toggleLoop() {
    this.loop = !this.loop;
    return this.loop;
  }

  destroy() {
    this.stop();
    if (this.connection) {
      this.connection.destroy();
      this.connection = null;
    }
  }
}

function getQueue(client, guildId) {
  if (!client.musicQueues.has(guildId)) {
    client.musicQueues.set(guildId, new MusicQueue(guildId));
  }
  return client.musicQueues.get(guildId);
}

function deleteQueue(client, guildId) {
  const queue = client.musicQueues.get(guildId);
  if (queue) {
    queue.destroy();
    client.musicQueues.delete(guildId);
  }
}

module.exports = { MusicQueue, getQueue, deleteQueue };
