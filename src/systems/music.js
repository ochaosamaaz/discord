const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus, entersState, StreamType } = require('@discordjs/voice');
const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

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
    this.currentProcess = null;

    this.player.on(AudioPlayerStatus.Idle, () => {
      if (this.loop && this.current) {
        this.songs.unshift(this.current);
      }
      this.playNext();
    });

    this.player.on('error', (error) => {
      console.error('Music player error:', error.message);
      this.playNext();
    });
  }

  async connect(voiceChannel, textChannel) {
    this.textChannel = textChannel;
    this.connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: this.guildId,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      selfDeaf: false,
      selfMute: false,
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
      setTimeout(() => {
        if (!this.current && this.connection) {
          this.destroy();
        }
      }, 120000);
      return;
    }

    this.current = this.songs.shift();

    try {
      // Step 1: Get direct audio URL from yt-dlp
      const { stdout } = await execAsync(
        `yt-dlp -f "bestaudio/best" --get-url --no-playlist "${this.current.url}"`,
        { timeout: 15000 }
      );
      const audioUrl = stdout.trim();

      if (!audioUrl) {
        throw new Error('Could not get audio URL');
      }

      // Step 2: Use ffmpeg to stream directly from the URL
      const ffmpeg = spawn('ffmpeg', [
        '-reconnect', '1',
        '-reconnect_streamed', '1',
        '-reconnect_delay_max', '5',
        '-i', audioUrl,
        '-analyzeduration', '0',
        '-loglevel', '0',
        '-f', 's16le',
        '-ar', '48000',
        '-ac', '2',
        'pipe:1',
      ]);

      this.currentProcess = ffmpeg;

      ffmpeg.on('error', (err) => {
        console.error('ffmpeg error:', err.message);
      });

      ffmpeg.stdin.on('error', () => {});

      const resource = createAudioResource(ffmpeg.stdout, {
        inputType: StreamType.Raw,
      });

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
      console.error('Error playing song:', error.message || error);
      if (this.textChannel) {
        this.textChannel.send('❌ Error memutar lagu, skip ke berikutnya...').catch(() => {});
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
    this.killProcess();
    this.player.stop();
  }

  stop() {
    this.songs = [];
    this.current = null;
    this.killProcess();
    this.player.stop();
  }

  toggleLoop() {
    this.loop = !this.loop;
    return this.loop;
  }

  killProcess() {
    if (this.currentProcess) {
      try { this.currentProcess.kill('SIGTERM'); } catch {}
      this.currentProcess = null;
    }
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
