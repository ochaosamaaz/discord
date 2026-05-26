const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getDb } = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autorole')
    .setDescription('Manage auto-roles yang diberikan saat member join')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Tambah role ke auto-role list')
        .addRoleOption(opt => opt.setName('role').setDescription('Role yang akan diberikan otomatis').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Hapus role dari auto-role list')
        .addRoleOption(opt => opt.setName('role').setDescription('Role yang akan dihapus').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('Lihat semua auto-roles')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const db = getDb();
    const guildId = interaction.guild.id;

    if (sub === 'add') {
      const role = interaction.options.getRole('role');
      
      db.prepare('INSERT OR IGNORE INTO autoroles (guild_id, role_id) VALUES (?, ?)').run(guildId, role.id);

      const embed = new EmbedBuilder()
        .setTitle('✅ Auto-Role Ditambahkan')
        .setDescription(`Role ${role} akan diberikan otomatis saat member baru join!`)
        .setColor(0x57f287)
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'remove') {
      const role = interaction.options.getRole('role');
      
      db.prepare('DELETE FROM autoroles WHERE guild_id = ? AND role_id = ?').run(guildId, role.id);

      const embed = new EmbedBuilder()
        .setTitle('🗑️ Auto-Role Dihapus')
        .setDescription(`Role ${role} dihapus dari auto-role list.`)
        .setColor(0xed4245)
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'list') {
      const roles = db.prepare('SELECT role_id FROM autoroles WHERE guild_id = ?').all(guildId);

      if (roles.length === 0) {
        return interaction.reply({ content: '📋 Belum ada auto-roles yang di-set.', ephemeral: true });
      }

      const roleList = roles.map((r, i) => `${i + 1}. <@&${r.role_id}>`).join('\n');

      const embed = new EmbedBuilder()
        .setTitle('📋 Auto-Roles List')
        .setDescription(roleList)
        .setColor(0x5865f2)
        .setFooter({ text: `${roles.length} role(s) aktif` })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
