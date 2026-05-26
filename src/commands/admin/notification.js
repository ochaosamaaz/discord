const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const { getDb } = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('notification')
    .setDescription('Setup notifikasi YouTube/TikTok')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('youtube')
        .setDescription('Setup YouTube notification')
        .addStringOption(opt => opt.setName('channel_id').setDescription('YouTube Channel ID').setRequired(true))
        .addChannelOption(opt => opt.setName('discord_channel').setDescription('Channel untuk notifikasi').setRequired(true).addChannelTypes(ChannelType.GuildText))
        .addStringOption(opt => opt.setName('message').setDescription('Custom message ({title}, {url}, {channel})'))
        .addRoleOption(opt => opt.setName('ping_role').setDescription('Role yang di-ping'))
    )
    .addSubcommand(sub =>
      sub.setName('tiktok')
        .setDescription('Setup TikTok notification')
        .addStringOption(opt => opt.setName('username').setDescription('TikTok username (tanpa @)').setRequired(true))
        .addChannelOption(opt => opt.setName('discord_channel').setDescription('Channel untuk notifikasi').setRequired(true).addChannelTypes(ChannelType.GuildText))
        .addStringOption(opt => opt.setName('message').setDescription('Custom message ({user}, {url})'))
        .addRoleOption(opt => opt.setName('ping_role').setDescription('Role yang di-ping'))
    )
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('Lihat semua notifikasi yang aktif')
    )
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Hapus notifikasi')
        .addIntegerOption(opt => opt.setName('id').setDescription('ID notifikasi (dari /notification list)').setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const db = getDb();
    const guildId = interaction.guild.id;

    if (sub === 'youtube') {
      const ytChannelId = interaction.options.getString('channel_id');
      const discordChannel = interaction.options.getChannel('discord_channel');
      const message = interaction.options.getString('message') || '🔔 **{channel}** uploaded a new video!\n\n**{title}**\n{url}';
      const pingRole = interaction.options.getRole('ping_role');

      db.prepare(`INSERT INTO notifications (guild_id, platform, platform_id, discord_channel_id, message_template, ping_role_id) 
        VALUES (?, 'youtube', ?, ?, ?, ?)`)
        .run(guildId, ytChannelId, discordChannel.id, message, pingRole?.id || null);

      const embed = new EmbedBuilder()
        .setTitle('✅ YouTube Notification Setup!')
        .setDescription(
          `**Platform:** YouTube\n` +
          `**Channel ID:** \`${ytChannelId}\`\n` +
          `**Discord Channel:** ${discordChannel}\n` +
          `**Ping Role:** ${pingRole || 'None'}\n\n` +
          `⚠️ *Note: Untuk YouTube notifications berfungsi, bot memerlukan interval check (setiap 5-10 menit). Pastikan YouTube API key sudah di-set di .env*`
        )
        .setColor(0xff0000)
        .setFooter({ text: 'Zen Developer • Notifications' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'tiktok') {
      const username = interaction.options.getString('username');
      const discordChannel = interaction.options.getChannel('discord_channel');
      const message = interaction.options.getString('message') || '🎵 **@{user}** posted a new TikTok!\n{url}';
      const pingRole = interaction.options.getRole('ping_role');

      db.prepare(`INSERT INTO notifications (guild_id, platform, platform_id, discord_channel_id, message_template, ping_role_id) 
        VALUES (?, 'tiktok', ?, ?, ?, ?)`)
        .run(guildId, username, discordChannel.id, message, pingRole?.id || null);

      const embed = new EmbedBuilder()
        .setTitle('✅ TikTok Notification Setup!')
        .setDescription(
          `**Platform:** TikTok\n` +
          `**Username:** @${username}\n` +
          `**Discord Channel:** ${discordChannel}\n` +
          `**Ping Role:** ${pingRole || 'None'}\n\n` +
          `⚠️ *Note: TikTok notifications menggunakan RSS feed check.*`
        )
        .setColor(0x010101)
        .setFooter({ text: 'Zen Developer • Notifications' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'list') {
      const notifications = db.prepare('SELECT * FROM notifications WHERE guild_id = ?').all(guildId);

      if (notifications.length === 0) {
        return interaction.reply({ content: '📋 Belum ada notifikasi yang di-setup.', ephemeral: true });
      }

      const list = notifications.map((n, i) =>
        `**${n.id}.** ${n.platform === 'youtube' ? '📺' : '🎵'} ${n.platform} - \`${n.platform_id}\` → <#${n.discord_channel_id}>`
      ).join('\n');

      const embed = new EmbedBuilder()
        .setTitle('📋 Active Notifications')
        .setDescription(list)
        .setColor(0x5865f2)
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'remove') {
      const id = interaction.options.getInteger('id');
      db.prepare('DELETE FROM notifications WHERE id = ? AND guild_id = ?').run(id, guildId);
      await interaction.reply({ content: `✅ Notifikasi #${id} dihapus!`, ephemeral: true });
    }
  },
};
