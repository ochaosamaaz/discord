const { EmbedBuilder } = require('discord.js');
const { getDb } = require('../utils/database');

const XP_PER_MESSAGE_MIN = 15;
const XP_PER_MESSAGE_MAX = 25;
const XP_COOLDOWN = 60000; // 60 seconds cooldown

function getXpForLevel(level) {
  return 5 * (level * level) + 50 * level + 100;
}

function getRandomXp() {
  return Math.floor(Math.random() * (XP_PER_MESSAGE_MAX - XP_PER_MESSAGE_MIN + 1)) + XP_PER_MESSAGE_MIN;
}

async function addXp(message) {
  const db = getDb();
  const userId = message.author.id;
  const guildId = message.guild.id;
  const now = Date.now();

  // Get or create user data
  let userData = db.prepare('SELECT * FROM levels WHERE user_id = ? AND guild_id = ?').get(userId, guildId);

  if (!userData) {
    db.prepare('INSERT INTO levels (user_id, guild_id, xp, level, total_messages, last_xp_time) VALUES (?, ?, 0, 0, 0, 0)')
      .run(userId, guildId);
    userData = { user_id: userId, guild_id: guildId, xp: 0, level: 0, total_messages: 0, last_xp_time: 0 };
  }

  // Update total messages
  db.prepare('UPDATE levels SET total_messages = total_messages + 1 WHERE user_id = ? AND guild_id = ?')
    .run(userId, guildId);

  // Check cooldown
  if (now - userData.last_xp_time < XP_COOLDOWN) return;

  // Add XP
  const xpGained = getRandomXp();
  const newXp = userData.xp + xpGained;
  const xpNeeded = getXpForLevel(userData.level);

  if (newXp >= xpNeeded) {
    // Level up!
    const newLevel = userData.level + 1;
    const remainingXp = newXp - xpNeeded;

    db.prepare('UPDATE levels SET xp = ?, level = ?, last_xp_time = ? WHERE user_id = ? AND guild_id = ?')
      .run(remainingXp, newLevel, now, userId, guildId);

    // Send level up message
    const embed = new EmbedBuilder()
      .setTitle('🎉 Level Up!')
      .setDescription(`Selamat ${message.author}! Kamu naik ke **Level ${newLevel}**!`)
      .addFields(
        { name: '📊 Level', value: `${newLevel}`, inline: true },
        { name: '✨ Total XP', value: `${remainingXp}/${getXpForLevel(newLevel)}`, inline: true }
      )
      .setColor(0xfee75c)
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: 'Zen Developer • Leveling System' })
      .setTimestamp();

    try {
      await message.channel.send({ embeds: [embed] });
    } catch (err) {
      // Silently fail if can't send
    }
  } else {
    db.prepare('UPDATE levels SET xp = ?, last_xp_time = ? WHERE user_id = ? AND guild_id = ?')
      .run(newXp, now, userId, guildId);
  }
}

function getUserLevel(userId, guildId) {
  const db = getDb();
  const userData = db.prepare('SELECT * FROM levels WHERE user_id = ? AND guild_id = ?').get(userId, guildId);
  if (!userData) return { xp: 0, level: 0, total_messages: 0 };
  return userData;
}

function getLeaderboard(guildId, limit = 10) {
  const db = getDb();
  return db.prepare('SELECT * FROM levels WHERE guild_id = ? ORDER BY level DESC, xp DESC LIMIT ?').all(guildId, limit);
}

module.exports = { addXp, getUserLevel, getLeaderboard, getXpForLevel };
