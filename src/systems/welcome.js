const { EmbedBuilder } = require('discord.js');
const { getDb } = require('../utils/database');

async function sendWelcome(member, guild) {
  const db = getDb();
  const config = db.prepare('SELECT * FROM welcome_config WHERE guild_id = ?').get(guild.id);

  if (!config || !config.welcome_channel_id) return;

  const channel = guild.channels.cache.get(config.welcome_channel_id);
  if (!channel) return;

  const message = (config.welcome_message || 'Selamat datang {user} di **{server}**! 🎉\nKamu adalah member ke-**{count}**!')
    .replace(/{user}/g, member.toString())
    .replace(/{server}/g, guild.name)
    .replace(/{count}/g, guild.memberCount);

  const embed = new EmbedBuilder()
    .setTitle('👋 Welcome!')
    .setDescription(message)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
    .setColor(0x57f287)
    .setImage('https://media.giphy.com/media/l0MYGb1LuZ3n7dRnO/giphy.gif')
    .setFooter({ text: `Zen Developer • Member #${guild.memberCount}` })
    .setTimestamp();

  try {
    await channel.send({ content: `${member}`, embeds: [embed] });
  } catch (err) {
    console.error('Error sending welcome message:', err);
  }
}

async function sendGoodbye(member, guild) {
  const db = getDb();
  const config = db.prepare('SELECT * FROM welcome_config WHERE guild_id = ?').get(guild.id);

  if (!config || !config.goodbye_channel_id) return;

  const channel = guild.channels.cache.get(config.goodbye_channel_id);
  if (!channel) return;

  const message = (config.goodbye_message || 'Goodbye **{user}**... 😢\nSekarang kita tinggal **{count}** member.')
    .replace(/{user}/g, member.user.username)
    .replace(/{server}/g, guild.name)
    .replace(/{count}/g, guild.memberCount);

  const embed = new EmbedBuilder()
    .setTitle('😢 Goodbye!')
    .setDescription(message)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
    .setColor(0xed4245)
    .setFooter({ text: `Zen Developer • ${guild.memberCount} members remaining` })
    .setTimestamp();

  try {
    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.error('Error sending goodbye message:', err);
  }
}

module.exports = { sendWelcome, sendGoodbye };
