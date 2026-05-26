const { sendGoodbye } = require('../systems/welcome');
const { updateServerStats } = require('../systems/serverstats');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member, client) {
    // Goodbye message
    await sendGoodbye(member, member.guild);

    // Update server stats
    await updateServerStats(member.guild);
  },
};
