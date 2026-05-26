const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { sendTicketPanel } = require('../../systems/ticket');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-setup')
    .setDescription('Setup panel tiket di channel ini')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Channel untuk panel tiket')
        .addChannelTypes(ChannelType.GuildText)
    ),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const guild = interaction.guild;

    // Create Support role if it doesn't exist
    let supportRole = guild.roles.cache.find(r => r.name === '🎫 Support');
    if (!supportRole) {
      supportRole = await guild.roles.create({
        name: '🎫 Support',
        color: 0x5865f2,
        reason: 'Ticket system setup',
      });
    }

    await sendTicketPanel(channel);

    await interaction.reply({
      content: `✅ Panel tiket telah dikirim ke ${channel}!\nSupport Role: ${supportRole}`,
      ephemeral: true,
    });
  },
};
