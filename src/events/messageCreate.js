const { addXp } = require('../systems/leveling');

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot) return;
    if (!message.guild) return;

    // Leveling system - add XP on message
    await addXp(message);
  },
};
