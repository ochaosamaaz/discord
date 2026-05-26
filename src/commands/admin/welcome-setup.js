const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const { getDb } = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('welcome-setup')
    .setDescription('Setup welcome & goodbye system')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('welcome')
        .setDescription('Set channel untuk welcome message')
        .addChannelOption(opt =>
          opt.setName('channel').setDescription('Channel welcome').setRequired(true).addChannelTypes(ChannelType.GuildText)
        )
        .addStringOption(opt =>
          opt.setName('message').setDescription('Pesan welcome ({user} = mention, {server} = nama server, {count} = jumlah member)')
        )
    )
    .addSubcommand(sub =>
      sub.setName('goodbye')
        .setDescription('Set channel untuk goodbye message')
        .addChannelOption(opt =>
          opt.setName('channel').setDescription('Channel goodbye').setRequired(true).addChannelTypes(ChannelType.GuildText)
        )
        .addStringOption(opt =>
          opt.setName('message').setDescription('Pesan goodbye ({user} = username, {server} = nama server, {count} = jumlah member)')
        )
    )
    .addSubcommand(sub =>
      sub.setName('test')
        .setDescription('Test welcome/goodbye message')
        .addStringOption(opt =>
          opt.setName('type').setDescription('Tipe pesan').setRequired(true)
            .addChoices(
              { name: 'Welcome', value: 'welcome' },
              { name: 'Goodbye', value: 'goodbye' },
            )
        )
    )
    .addSubcommand(sub =>
      sub.setName('disable')
        .setDescription('Nonaktifkan welcome/goodbye')
        .addStringOption(opt =>
          opt.setName('type').setDescription('Tipe yang dinonaktifkan').setRequired(true)
            .addChoices(
              { name: 'Welcome', value: 'welcome' },
              { name: 'Goodbye', value: 'goodbye' },
              { name: 'Both', value: 'both' },
            )
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const db = getDb();
    const guildId = interaction.guild.id;

    if (sub === 'welcome') {
      const channel = interaction.options.getChannel('channel');
      const message = interaction.options.getString('message') || 'Selamat datang {user} di **{server}**! 🎉\nKamu adalah member ke-**{count}**!';

      db.prepare(`INSERT OR REPLACE INTO welcome_config (guild_id, welcome_channel_id, welcome_message) 
        VALUES (?, ?, COALESCE(?, (SELECT welcome_message FROM welcome_config WHERE guild_id = ?)))`)
        .run(guildId, channel.id, message, guildId);

      // Also ensure goodbye config exists
      db.prepare(`INSERT OR IGNORE INTO welcome_config (guild_id, welcome_channel_id, welcome_message) VALUES (?, ?, ?)`)
        .run(guildId, channel.id, message);

      const embed = new EmbedBuilder()
        .setTitle('✅ Welcome Channel Set!')
        .setDescription(`Welcome messages akan dikirim ke ${channel}\n\n**Preview:**\n${message.replace('{user}', interaction.user.toString()).replace('{server}', interaction.guild.name).replace('{count}', interaction.guild.memberCount)}`)
        .setColor(0x57f287)
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'goodbye') {
      const channel = interaction.options.getChannel('channel');
      const message = interaction.options.getString('message') || 'Goodbye **{user}**... 😢\nSekarang kita tinggal **{count}** member.';

      db.prepare(`UPDATE welcome_config SET goodbye_channel_id = ?, goodbye_message = ? WHERE guild_id = ?`)
        .run(channel.id, message, guildId);

      // If no row existed, create one
      const row = db.prepare('SELECT * FROM welcome_config WHERE guild_id = ?').get(guildId);
      if (!row) {
        db.prepare('INSERT INTO welcome_config (guild_id, goodbye_channel_id, goodbye_message) VALUES (?, ?, ?)')
          .run(guildId, channel.id, message);
      }

      const embed = new EmbedBuilder()
        .setTitle('✅ Goodbye Channel Set!')
        .setDescription(`Goodbye messages akan dikirim ke ${channel}`)
        .setColor(0x57f287)
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'test') {
      const type = interaction.options.getString('type');
      const { sendWelcome, sendGoodbye } = require('../../systems/welcome');

      if (type === 'welcome') {
        await sendWelcome(interaction.member, interaction.guild);
      } else {
        await sendGoodbye(interaction.member, interaction.guild);
      }

      await interaction.reply({ content: '✅ Test message sent!', ephemeral: true });
    }

    if (sub === 'disable') {
      const type = interaction.options.getString('type');
      
      if (type === 'welcome' || type === 'both') {
        db.prepare('UPDATE welcome_config SET welcome_channel_id = NULL WHERE guild_id = ?').run(guildId);
      }
      if (type === 'goodbye' || type === 'both') {
        db.prepare('UPDATE welcome_config SET goodbye_channel_id = NULL WHERE guild_id = ?').run(guildId);
      }

      await interaction.reply({ content: `✅ ${type} system telah dinonaktifkan.`, ephemeral: true });
    }
  },
};
