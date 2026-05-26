const { ActivityType } = require('discord.js');

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`✅ Bot online sebagai ${client.user.tag}!`);
    client.user.setActivity('Zen Developer', { type: ActivityType.Watching });
  },
};
