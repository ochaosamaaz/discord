const { ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getDb } = require('../utils/database');

async function handleVoiceStateUpdate(oldState, newState) {
  const db = getDb();
  const guildId = newState.guild.id || oldState.guild.id;

  // User joined a voice channel
  if (newState.channelId) {
    const config = db.prepare('SELECT * FROM tempvoice_config WHERE guild_id = ? AND creator_channel_id = ?')
      .get(guildId, newState.channelId);

    if (config) {
      // User joined the "Create Voice" channel
      await createTempVoice(newState, config);
    }
  }

  // User left a voice channel
  if (oldState.channelId && oldState.channelId !== newState.channelId) {
    const tempChannel = db.prepare('SELECT * FROM temp_channels WHERE channel_id = ? AND guild_id = ?')
      .get(oldState.channelId, guildId);

    if (tempChannel) {
      const channel = oldState.guild.channels.cache.get(oldState.channelId);
      if (channel && channel.members.size === 0) {
        // Delete empty temp channel
        try {
          await channel.delete('Temp voice channel empty');
          db.prepare('DELETE FROM temp_channels WHERE channel_id = ? AND guild_id = ?')
            .run(oldState.channelId, guildId);
        } catch (err) {
          console.error('Error deleting temp voice:', err);
        }
      }
    }
  }
}

async function createTempVoice(voiceState, config) {
  const db = getDb();
  const guild = voiceState.guild;
  const member = voiceState.member;

  // Check if user already has a temp channel
  const existing = db.prepare('SELECT * FROM temp_channels WHERE owner_id = ? AND guild_id = ?')
    .get(member.id, guild.id);

  if (existing) {
    const existingChannel = guild.channels.cache.get(existing.channel_id);
    if (existingChannel) {
      try {
        await member.voice.setChannel(existingChannel);
      } catch {}
      return;
    } else {
      // Channel was deleted, clean up DB
      db.prepare('DELETE FROM temp_channels WHERE channel_id = ?').run(existing.channel_id);
    }
  }

  try {
    const channelName = config.channel_name_template
      ? config.channel_name_template.replace('{user}', member.user.username)
      : `🎙️ ${member.user.username}'s Room`;

    const parentChannel = guild.channels.cache.get(config.creator_channel_id);
    const parentId = parentChannel ? parentChannel.parentId : null;

    const tempChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildVoice,
      parent: parentId,
      userLimit: config.default_user_limit || 0,
      permissionOverwrites: [
        {
          id: member.id,
          allow: [
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.MoveMembers,
            PermissionFlagsBits.MuteMembers,
            PermissionFlagsBits.DeafenMembers,
          ],
        },
      ],
    });

    // Move user to the new channel
    await member.voice.setChannel(tempChannel);

    // Save to database
    db.prepare('INSERT INTO temp_channels (channel_id, guild_id, owner_id) VALUES (?, ?, ?)')
      .run(tempChannel.id, guild.id, member.id);

    // Send control panel in a text message (if interface channel set)
    if (config.interface_channel_id) {
      const interfaceChannel = guild.channels.cache.get(config.interface_channel_id);
      if (interfaceChannel) {
        const embed = new EmbedBuilder()
          .setTitle('🎙️ Temp Voice Created')
          .setDescription(`${member} membuat voice channel: **${channelName}**`)
          .setColor(0x5865f2)
          .setTimestamp();

        await interfaceChannel.send({ embeds: [embed] });
      }
    }
  } catch (error) {
    console.error('Error creating temp voice:', error);
  }
}

module.exports = { handleVoiceStateUpdate };
