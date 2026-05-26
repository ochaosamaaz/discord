const { getDb } = require('../utils/database');

async function updateServerStats(guild) {
  const db = getDb();
  const config = db.prepare('SELECT * FROM stats_config WHERE guild_id = ?').get(guild.id);
  if (!config) return;

  const totalMembers = guild.memberCount;
  const humans = guild.members.cache.filter(m => !m.user.bot).size;
  const bots = guild.members.cache.filter(m => m.user.bot).size;

  // Update total members channel
  if (config.total_channel_id) {
    const ch = guild.channels.cache.get(config.total_channel_id);
    if (ch) {
      const newName = `👥︱All Members: ${totalMembers}`;
      if (ch.name !== newName) {
        try { await ch.setName(newName); } catch {}
      }
    }
  }

  // Update human members channel
  if (config.members_channel_id) {
    const ch = guild.channels.cache.get(config.members_channel_id);
    if (ch) {
      const newName = `👤︱Members: ${humans}`;
      if (ch.name !== newName) {
        try { await ch.setName(newName); } catch {}
      }
    }
  }

  // Update bots channel
  if (config.bots_channel_id) {
    const ch = guild.channels.cache.get(config.bots_channel_id);
    if (ch) {
      const newName = `🤖︱Bots: ${bots}`;
      if (ch.name !== newName) {
        try { await ch.setName(newName); } catch {}
      }
    }
  }
}

// Run every 10 minutes
function startStatsInterval(client) {
  setInterval(async () => {
    for (const [guildId, guild] of client.guilds.cache) {
      try {
        await updateServerStats(guild);
      } catch (err) {
        console.error(`Error updating stats for ${guildId}:`, err);
      }
    }
  }, 600000); // 10 minutes
}

module.exports = { updateServerStats, startStatsInterval };
