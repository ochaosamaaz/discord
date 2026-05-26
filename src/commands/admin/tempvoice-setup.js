const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const { getDb } = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tempvoice-setup')
    .setDescription('Setup Creator Voice Channel (Temp Voice)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(opt =>
      opt.setName('channel')
        .setDescription('Voice channel "Create Voice" yang akan jadi trigger')
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildVoice)
    )
    .addStringOption(opt =>
      opt.setName('name_template')
        .setDescription('Template nama channel ({user} = username). Default: 🎙️ {user}\'s Room')
    )
    .addIntegerOption(opt =>
      opt.setName('user_limit')
        .setDescription('Default user limit (0 = unlimited)')
        .setMinValue(0)
        .setMaxValue(99)
    ),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    const nameTemplate = interaction.options.getString('name_template') || '🎙️ {user}\'s Room';
    const userLimit = interaction.options.getInteger('user_limit') || 0;
    const db = getDb();

    db.prepare(`INSERT OR REPLACE INTO tempvoice_config (guild_id, creator_channel_id, channel_name_template, default_user_limit) 
      VALUES (?, ?, ?, ?)`)
      .run(interaction.guild.id, channel.id, nameTemplate, userLimit);

    const embed = new EmbedBuilder()
      .setTitle('✅ Temp Voice Setup!')
      .setDescription(
        `**Creator Channel:** ${channel}\n` +
        `**Name Template:** \`${nameTemplate}\`\n` +
        `**User Limit:** ${userLimit === 0 ? 'Unlimited' : userLimit}\n\n` +
        `Ketika member join ${channel}, temp voice channel akan otomatis dibuat!`
      )
      .setColor(0x57f287)
      .setFooter({ text: 'Zen Developer • Temp Voice' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
