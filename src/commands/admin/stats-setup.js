const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const { getDb } = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats-setup')
    .setDescription('Setup server stats channels (auto-updating)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(opt =>
      opt.setName('total').setDescription('Voice channel untuk "All Members"')
        .addChannelTypes(ChannelType.GuildVoice)
    )
    .addChannelOption(opt =>
      opt.setName('members').setDescription('Voice channel untuk "Members"')
        .addChannelTypes(ChannelType.GuildVoice)
    )
    .addChannelOption(opt =>
      opt.setName('bots').setDescription('Voice channel untuk "Bots"')
        .addChannelTypes(ChannelType.GuildVoice)
    ),

  async execute(interaction) {
    const db = getDb();
    const guildId = interaction.guild.id;

    const total = interaction.options.getChannel('total');
    const members = interaction.options.getChannel('members');
    const bots = interaction.options.getChannel('bots');

    db.prepare(`INSERT OR REPLACE INTO stats_config 
      (guild_id, total_channel_id, members_channel_id, bots_channel_id) 
      VALUES (?, ?, ?, ?)`)
      .run(guildId, total?.id || null, members?.id || null, bots?.id || null);

    const embed = new EmbedBuilder()
      .setTitle('✅ Server Stats Setup!')
      .setDescription(
        `**Total Members Channel:** ${total || 'Not set'}\n` +
        `**Members Channel:** ${members || 'Not set'}\n` +
        `**Bots Channel:** ${bots || 'Not set'}\n\n` +
        `Stats akan update otomatis setiap 10 menit.`
      )
      .setColor(0x57f287)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });

    // Update immediately
    const { updateServerStats } = require('../../systems/serverstats');
    await updateServerStats(interaction.guild);
  },
};
