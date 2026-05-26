const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { sendVerifyPanel } = require('../../systems/verification');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verify-setup')
    .setDescription('Setup panel verifikasi di channel ini')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Channel untuk panel verifikasi')
        .addChannelTypes(ChannelType.GuildText)
    ),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const guild = interaction.guild;

    // Create Verified role if it doesn't exist
    let verifiedRole = guild.roles.cache.find(r => r.name === '✅ Verified');
    if (!verifiedRole) {
      verifiedRole = await guild.roles.create({
        name: '✅ Verified',
        color: 0x57f287,
        reason: 'Verification system setup',
      });
    }

    await sendVerifyPanel(channel, verifiedRole);

    await interaction.reply({
      content: `✅ Panel verifikasi telah dikirim ke ${channel}!\nRole: ${verifiedRole}`,
      ephemeral: true,
    });
  },
};
