const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

async function sendVerifyPanel(channel, role) {
  const embed = new EmbedBuilder()
    .setTitle('✅ Verifikasi')
    .setDescription(
      '> Selamat datang di server!\n\n' +
      '📋 **Untuk mendapatkan akses ke server, silakan verifikasi dengan menekan tombol di bawah.**\n\n' +
      '⚠️ Dengan memverifikasi, kamu setuju untuk mengikuti semua aturan server.'
    )
    .setColor(0x2b2d31)
    .setFooter({ text: 'Zen Developer • Verification System' })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('verify_confirm')
      .setLabel('✅ Verify')
      .setStyle(ButtonStyle.Success)
  );

  await channel.send({ embeds: [embed], components: [row] });
}

async function handleVerify(interaction) {
  const guild = interaction.guild;
  const member = interaction.member;

  // Find the verified role
  let verifiedRole = guild.roles.cache.find(r => r.name === 'Verified' || r.name === '✅ Verified');

  if (!verifiedRole) {
    return interaction.reply({
      content: '❌ Role "Verified" tidak ditemukan! Admin perlu setup terlebih dahulu.',
      ephemeral: true,
    });
  }

  if (member.roles.cache.has(verifiedRole.id)) {
    return interaction.reply({
      content: '⚠️ Kamu sudah terverifikasi!',
      ephemeral: true,
    });
  }

  try {
    await member.roles.add(verifiedRole);

    const embed = new EmbedBuilder()
      .setTitle('✅ Berhasil Diverifikasi!')
      .setDescription('Kamu sekarang memiliki akses penuh ke server. Selamat bergabung!')
      .setColor(0x57f287)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    console.error('Verification error:', error);
    await interaction.reply({
      content: '❌ Gagal memverifikasi. Hubungi admin!',
      ephemeral: true,
    });
  }
}

module.exports = { sendVerifyPanel, handleVerify };
