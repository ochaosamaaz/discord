const { handleVoiceStateUpdate } = require('../systems/tempvoice');

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState, client) {
    // Temp voice system
    await handleVoiceStateUpdate(oldState, newState);
  },
};
