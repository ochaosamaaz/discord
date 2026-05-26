const { sendWelcome } = require('../systems/welcome');
const { updateServerStats } = require('../systems/serverstats');
const { getDb } = require('../utils/database');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client) {
    const guild = member.guild;

    // Auto-roles
    const db = getDb();
    const autoroles = db.prepare('SELECT role_id FROM autoroles WHERE guild_id = ?').all(guild.id);
    for (const { role_id } of autoroles) {
      const role = guild.roles.cache.get(role_id);
      if (role) {
        await member.roles.add(role).catch(err => {
          console.error(`Failed to add autorole ${role_id}:`, err);
        });
      }
    }

    // Welcome message
    await sendWelcome(member, guild);

    // Update server stats
    await updateServerStats(guild);
  },
};
