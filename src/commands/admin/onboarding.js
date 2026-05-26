const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ChannelType } = require('discord.js');
const { getDb } = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('onboarding')
    .setDescription('Setup onboarding system')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('setup')
        .setDescription('Setup onboarding panel')
        .addChannelOption(opt =>
          opt.setName('channel').setDescription('Channel untuk onboarding').setRequired(true).addChannelTypes(ChannelType.GuildText)
        )
        .addStringOption(opt => opt.setName('title').setDescription('Judul onboarding'))
        .addStringOption(opt => opt.setName('description').setDescription('Deskripsi'))
    )
    .addSubcommand(sub =>
      sub.setName('add-question')
        .setDescription('Tambah pertanyaan onboarding (max 3)')
        .addStringOption(opt => opt.setName('question').setDescription('Pertanyaan').setRequired(true))
        .addStringOption(opt => opt.setName('options').setDescription('Opsi jawaban (pisah dengan |). Contoh: Gaming|Developer|Artist').setRequired(true))
        .addStringOption(opt => opt.setName('roles').setDescription('Role untuk tiap opsi (pisah dengan |). Contoh: roleId1|roleId2|roleId3'))
    )
    .addSubcommand(sub =>
      sub.setName('send')
        .setDescription('Kirim onboarding panel yang sudah di-setup')
    )
    .addSubcommand(sub =>
      sub.setName('reset')
        .setDescription('Reset onboarding setup')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const db = getDb();
    const guildId = interaction.guild.id;

    if (sub === 'setup') {
      const channel = interaction.options.getChannel('channel');
      const title = interaction.options.getString('title') || '🎯 Server Onboarding';
      const description = interaction.options.getString('description') || 'Selamat datang! Bantu kami mengenal kamu lebih baik dengan menjawab pertanyaan di bawah.';

      db.prepare('DELETE FROM onboarding WHERE guild_id = ?').run(guildId);
      db.prepare('INSERT INTO onboarding (guild_id, channel_id, title, description) VALUES (?, ?, ?, ?)')
        .run(guildId, channel.id, title, description);

      const embed = new EmbedBuilder()
        .setTitle('✅ Onboarding Setup!')
        .setDescription(
          `**Channel:** ${channel}\n` +
          `**Title:** ${title}\n\n` +
          `Sekarang tambahkan pertanyaan dengan:\n\`/onboarding add-question\` (max 3 pertanyaan)\n\n` +
          `Setelah selesai, kirim dengan:\n\`/onboarding send\``
        )
        .setColor(0x57f287)
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'add-question') {
      const question = interaction.options.getString('question');
      const optionsStr = interaction.options.getString('options');
      const rolesStr = interaction.options.getString('roles') || '';

      // Check max 3 questions
      const existing = db.prepare('SELECT COUNT(*) as count FROM onboarding_questions WHERE guild_id = ?').get(guildId);
      if (existing && existing.count >= 3) {
        return interaction.reply({ content: '❌ Maksimal 3 pertanyaan! Gunakan `/onboarding reset` untuk memulai ulang.', ephemeral: true });
      }

      const onboarding = db.prepare('SELECT * FROM onboarding WHERE guild_id = ?').get(guildId);
      if (!onboarding) {
        return interaction.reply({ content: '❌ Setup onboarding dulu dengan `/onboarding setup`!', ephemeral: true });
      }

      db.prepare('INSERT INTO onboarding_questions (guild_id, question, options, roles) VALUES (?, ?, ?, ?)')
        .run(guildId, question, optionsStr, rolesStr);

      const questionNum = (existing?.count || 0) + 1;

      await interaction.reply({
        content: `✅ Pertanyaan #${questionNum} ditambahkan!\n**Q:** ${question}\n**Options:** ${optionsStr}`,
        ephemeral: true,
      });
    }

    if (sub === 'send') {
      const onboarding = db.prepare('SELECT * FROM onboarding WHERE guild_id = ?').get(guildId);
      if (!onboarding) {
        return interaction.reply({ content: '❌ Setup dulu dengan `/onboarding setup`!', ephemeral: true });
      }

      const questions = db.prepare('SELECT * FROM onboarding_questions WHERE guild_id = ?').all(guildId);
      if (questions.length === 0) {
        return interaction.reply({ content: '❌ Tambahkan minimal 1 pertanyaan!', ephemeral: true });
      }

      const channel = interaction.guild.channels.cache.get(onboarding.channel_id);
      if (!channel) {
        return interaction.reply({ content: '❌ Channel tidak ditemukan!', ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setTitle(onboarding.title)
        .setDescription(onboarding.description + '\n\nPilih jawaban dari dropdown di bawah:')
        .setColor(0x5865f2)
        .setFooter({ text: 'Zen Developer • Onboarding' })
        .setTimestamp();

      // Add question descriptions
      questions.forEach((q, i) => {
        embed.addFields({ name: `❓ Pertanyaan ${i + 1}`, value: q.question });
      });

      // Create select menus for each question
      const rows = questions.map((q, i) => {
        const options = q.options.split('|').map((opt, j) => ({
          label: opt.trim(),
          value: `onboard_${i}_${j}`,
          description: `Pilih ${opt.trim()}`,
        }));

        return new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`onboarding_q${i}_${guildId}`)
            .setPlaceholder(q.question.substring(0, 100))
            .setMinValues(1)
            .setMaxValues(1)
            .addOptions(options)
        );
      });

      await channel.send({ embeds: [embed], components: rows });
      await interaction.reply({ content: `✅ Onboarding panel dikirim ke ${channel}!`, ephemeral: true });
    }

    if (sub === 'reset') {
      db.prepare('DELETE FROM onboarding WHERE guild_id = ?').run(guildId);
      db.prepare('DELETE FROM onboarding_questions WHERE guild_id = ?').run(guildId);
      await interaction.reply({ content: '✅ Onboarding di-reset!', ephemeral: true });
    }
  },
};
