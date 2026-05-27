const { ActivityType } = require('discord.js');
const { generateDependencyReport } = require('@discordjs/voice');

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`✅ Bot online sebagai ${client.user.tag}!`);
    console.log('\n📋 Voice Dependencies:');
    console.log(generateDependencyReport());
    console.log('');
    client.user.setActivity('Zen Developer', { type: ActivityType.Watching });
  },
};
