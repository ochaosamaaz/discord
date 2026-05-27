const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus, entersState, StreamType } = require('@discordjs/voice');
const { spawn } = require('child_process');

class MusicQueue {
  constructor(guildId) {
    this.guildId = guildId;
    this.songs = [];
    this.current = null;
    this.player = createAudioPlayer();
    this.connection = null;
    this.loop = false;
    this.textChannel = null;
    this.currentProcess = null;

    this.player.on(AudioPlayerStatus.Idle, () => {
      console.log('[Music] Player idle');
      if (this.loop && this.current) {
        this.songs.unshift(this.current);
      }
      this.playNext();
    });

    this.player.on('error', (error) => {
      console.error('[Music] Player error:', error.message);
      this.playNext();
    });

    this.player.on(AudioPlayerStatus.Playing, () => {
      console.log('[Music] ✅ Player is now PLAYING');
    });

    this.player.on(AudioPlayerStatus.Buffering, () => {
      console.log('[Music] Player is BUFFERING...');
    });
  }

  async connect(voiceChannel, textChannel) {
    this.textChannel = textChannel;
    
    this.connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: this.guildId,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      debug: true,
    });

    this.connection.on('stateChange', (oldState, newState) => {
      console.log(`[Music] Connection: ${oldState.status} -> ${newState.status}`);
    });

    // Check if already ready, otherwise wait
    if (this.connection.state.status !== VoiceConnectionStatus.Ready) {
      try {
        await entersState(this.connection, VoiceConnectionStatus.Ready, 20000);
      } catch (err) {
        console.log('[Music] Wait for Ready timed out, checking current state:', this.connection.state.status);
        // If it's at least signalling/connecting, try to continue anyway
        if (this.connection.state.status === VoiceConnectionStatus.Destroyed) {
          throw new Error('Connection destroyed');
        }
        // Otherwise, just continue - bot might already be connected
      }
    }

    console.log('[Music] Voice connection state:', this.connection.state.status);
    this.connection.subscribe(this.player);
    console.log('[Music] Player subscribed to connection');

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
      const url = this.current.url;
      console.log(`[Music] Playing: ${this.current.title}`);

      // yt-dlp output to stdout | ffmpeg encode to OGG Opus
      const cmd = `yt-dlp -f "bestaudio/best" --no-playlist --no-live-from-start -o - "${url}" | ffmpeg -i pipe:0 -analyzeduration 0 -loglevel 0 -acodec libopus -f ogg -ar 48000 -ac 2 pipe:1`;

      const process = spawn(cmd, [], {
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      this.currentProcess = process;

      process.on('error', (err) => {
        console.error('[Music] Process error:', err.message);
      });

      process.on('close', (code) => {
        console.log(`[Music] Process exited with code: ${code}`);
      });

      process.stderr.on('data', (data) => {
        const msg = data.toString();
        if (msg.includes('ERROR') || msg.includes('not available')) {
          console.error('[Music] Stream error:', msg);
          if (this.textChannel) {
            this.textChannel.send('❌ Video tidak bisa diputar. Skipping...').catch(() => {});
          }
          this.killProcess();
          this.playNext();
        }
      });

      // Wait for data to start flowing
      await new Promise(resolve => setTimeout(resolve, 2000));

      const resource = createAudioResource(process.stdout, {
        inputType: StreamType.OggOpus,
      });

      console.log('[Music] Resource created, playing...');
      this.player.play(resource);

      // Log state after a moment
      setTimeout(() => {
        console.log(`[Music] Player state after 2s: ${this.player.state.status}`);
        if (this.connection) {
          console.log(`[Music] Connection state: ${this.connection.state.status}`);
        }
      }, 2000);

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
      console.error('[Music] Error:', error.message || error);
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
