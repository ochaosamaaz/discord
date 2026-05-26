const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { getDb } = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reactionrole')
    .setDescription('Setup reaction roles / button roles')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('button')
        .setDescription('Buat button roles panel')
        .addStringOption(opt => opt.setName('title').setDescription('Judul embed').setRequired(true))
        .addStringOption(opt => opt.setName('description').setDescription('Deskripsi embed'))
        .addStringOption(opt => opt.setName('color').setDescription('Warna embed (hex, contoh: #5865f2)'))
    )
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Tambah role ke panel yang sudah ada')
        .addStringOption(opt => opt.setName('message_id').setDescription('ID pesan panel').setRequired(true))
        .addRoleOption(opt => opt.setName('role').setDescription('Role yang ditambahkan').setRequired(true))
        .addStringOption(opt => opt.setName('emoji').setDescription('Emoji untuk tombol').setRequired(true))
        .addStringOption(opt => opt.setName('label').setDescription('Label tombol'))
        .addStringOption(opt =>
          opt.setName('style').setDescription('Style tombol')
            .addChoices(
              { name: 'Blue (Primary)', value: 'Primary' },
              { name: 'Gray (Secondary)', value: 'Secondary' },
              { name: 'Green (Success)', value: 'Success' },
              { name: 'Red (Danger)', value: 'Danger' },
            )
        )
    )
    .addSubcommand(sub =>
      sub.setName('menu')
        .setDescription('Buat dropdown menu roles')
        .addStringOption(opt => opt.setName('title').setDescription('Judul embed').setRequired(true))
        .addStringOption(opt => opt.setName('placeholder').setDescription('Placeholder text untuk dropdown'))
        .addStringOption(opt => opt.setName('description').setDescription('Deskripsi embed'))
    )
    .addSubcommand(sub =>
      sub.setName('menu-add')
        .setDescription('Tambah role ke dropdown menu')
        .addStringOption(opt => opt.setName('message_id').setDescription('ID pesan panel').setRequired(true))
        .addRoleOption(opt => opt.setName('role').setDescription('Role yang ditambahkan').setRequired(true))
        .addStringOption(opt => opt.setName('emoji').setDescription('Emoji untuk opsi').setRequired(true))
        .addStringOption(opt => opt.setName('label').setDescription('Label opsi (default: nama role)'))
        .addStringOption(opt => opt.setName('description').setDescription('Deskripsi opsi'))
    )
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Hapus role dari panel')
        .addStringOption(opt => opt.setName('message_id').setDescription('ID pesan panel').setRequired(true))
        .addRoleOption(opt => opt.setName('role').setDescription('Role yang dihapus').setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const db = getDb();
    const guildId = interaction.guild.id;

    if (sub === 'button') {
      const title = interaction.options.getString('title');
      const description = interaction.options.getString('description') || 'Klik tombol di bawah untuk mendapatkan role!';
      const color = interaction.options.getString('color') || '#5865f2';

      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(parseInt(color.replace('#', ''), 16) || 0x5865f2)
        .setFooter({ text: 'Zen Developer • Reaction Roles' })
        .setTimestamp();

      const msg = await interaction.channel.send({ embeds: [embed] });

      // Save panel to database
      db.prepare('INSERT INTO reaction_panels (message_id, channel_id, guild_id, panel_type) VALUES (?, ?, ?, ?)')
        .run(msg.id, interaction.channel.id, guildId, 'button');

      await interaction.reply({
        content: `✅ Button roles panel dibuat!\nMessage ID: \`${msg.id}\`\n\nGunakan \`/reactionrole add\` untuk menambahkan role.`,
        ephemeral: true,
      });
    }

    if (sub === 'add') {
      const messageId = interaction.options.getString('message_id');
      const role = interaction.options.getRole('role');
      const emoji = interaction.options.getString('emoji');
      const label = interaction.options.getString('label') || role.name;
      const style = interaction.options.getString('style') || 'Primary';

      // Find the message
      let msg;
      try {
        msg = await interaction.channel.messages.fetch(messageId);
      } catch {
        return interaction.reply({ content: '❌ Pesan tidak ditemukan di channel ini!', ephemeral: true });
      }

      // Save role to database
      db.prepare('INSERT OR REPLACE INTO reaction_roles (message_id, guild_id, role_id, emoji, label, style) VALUES (?, ?, ?, ?, ?, ?)')
        .run(messageId, guildId, role.id, emoji, label, style);

      // Rebuild buttons
      const roles = db.prepare('SELECT * FROM reaction_roles WHERE message_id = ? AND guild_id = ?').all(messageId, guildId);

      const rows = [];
      let currentRow = new ActionRowBuilder();
      let buttonCount = 0;

      for (const r of roles) {
        if (buttonCount >= 5) {
          rows.push(currentRow);
          currentRow = new ActionRowBuilder();
          buttonCount = 0;
        }
        if (rows.length >= 5) break; // Max 5 rows

        const button = new ButtonBuilder()
          .setCustomId(`rr_${r.role_id}`)
          .setLabel(r.label)
          .setStyle(ButtonStyle[r.style] || ButtonStyle.Primary);

        try {
          button.setEmoji(r.emoji);
        } catch {}

        currentRow.addComponents(button);
        buttonCount++;
      }

      if (buttonCount > 0) rows.push(currentRow);

      await msg.edit({ components: rows });

      await interaction.reply({
        content: `✅ Role ${role} ditambahkan ke panel dengan emoji ${emoji}!`,
        ephemeral: true,
      });
    }

    if (sub === 'menu') {
      const title = interaction.options.getString('title');
      const placeholder = interaction.options.getString('placeholder') || 'Pilih role...';
      const description = interaction.options.getString('description') || 'Pilih role dari dropdown menu di bawah!';

      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(0x5865f2)
        .setFooter({ text: 'Zen Developer • Reaction Roles' })
        .setTimestamp();

      // Create empty menu with placeholder
      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('rr_menu_placeholder')
          .setPlaceholder(placeholder)
          .setMinValues(0)
          .setMaxValues(1)
          .addOptions({ label: 'Setup in progress...', value: 'placeholder', description: 'Gunakan /reactionrole menu-add' })
      );

      const msg = await interaction.channel.send({ embeds: [embed], components: [row] });

      db.prepare('INSERT INTO reaction_panels (message_id, channel_id, guild_id, panel_type, placeholder) VALUES (?, ?, ?, ?, ?)')
        .run(msg.id, interaction.channel.id, guildId, 'menu', placeholder);

      await interaction.reply({
        content: `✅ Dropdown roles panel dibuat!\nMessage ID: \`${msg.id}\`\n\nGunakan \`/reactionrole menu-add\` untuk menambahkan role.`,
        ephemeral: true,
      });
    }

    if (sub === 'menu-add') {
      const messageId = interaction.options.getString('message_id');
      const role = interaction.options.getRole('role');
      const emoji = interaction.options.getString('emoji');
      const label = interaction.options.getString('label') || role.name;
      const description = interaction.options.getString('description') || `Dapatkan role ${role.name}`;

      let msg;
      try {
        msg = await interaction.channel.messages.fetch(messageId);
      } catch {
        return interaction.reply({ content: '❌ Pesan tidak ditemukan!', ephemeral: true });
      }

      db.prepare('INSERT OR REPLACE INTO reaction_roles (message_id, guild_id, role_id, emoji, label, style) VALUES (?, ?, ?, ?, ?, ?)')
        .run(messageId, guildId, role.id, emoji, label, description);

      // Rebuild menu
      const roles = db.prepare('SELECT * FROM reaction_roles WHERE message_id = ? AND guild_id = ?').all(messageId, guildId);
      const panel = db.prepare('SELECT * FROM reaction_panels WHERE message_id = ? AND guild_id = ?').get(messageId, guildId);

      const options = roles.map(r => ({
        label: r.label,
        value: r.role_id,
        description: r.style.length > 20 ? r.style.substring(0, 100) : `Dapatkan role ${r.label}`,
        emoji: r.emoji || undefined,
      }));

      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`rr_menu_${messageId}`)
          .setPlaceholder(panel?.placeholder || 'Pilih role...')
          .setMinValues(0)
          .setMaxValues(Math.min(options.length, 25))
          .addOptions(options)
      );

      await msg.edit({ components: [row] });

      await interaction.reply({
        content: `✅ Role ${role} ditambahkan ke dropdown menu!`,
        ephemeral: true,
      });
    }

    if (sub === 'remove') {
      const messageId = interaction.options.getString('message_id');
      const role = interaction.options.getRole('role');

      db.prepare('DELETE FROM reaction_roles WHERE message_id = ? AND guild_id = ? AND role_id = ?')
        .run(messageId, guildId, role.id);

      await interaction.reply({
        content: `✅ Role ${role} dihapus dari panel.`,
        ephemeral: true,
      });
    }
  },
};
