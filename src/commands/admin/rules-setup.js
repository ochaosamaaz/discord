const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rules-setup')
    .setDescription('Kirim custom rules embed ke channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(opt =>
      opt.setName('channel').setDescription('Channel untuk rules').addChannelTypes(ChannelType.GuildText)
    )
    .addStringOption(opt =>
      opt.setName('template').setDescription('Template rules')
        .addChoices(
          { name: 'Gaming Community', value: 'gaming' },
          { name: 'Developer/Scripting', value: 'developer' },
          { name: 'General Community', value: 'general' },
          { name: 'Marketplace/Store', value: 'marketplace' },
        )
    )
    .addStringOption(opt =>
      opt.setName('custom_rules').setDescription('Custom rules (pisahkan dengan | contoh: rule1|rule2|rule3)')
    ),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const template = interaction.options.getString('template') || 'general';
    const customRules = interaction.options.getString('custom_rules');

    let rules;
    if (customRules) {
      rules = customRules.split('|').map((r, i) => `**${i + 1}.** ${r.trim()}`);
    } else {
      rules = getTemplateRules(template);
    }

    const embed = new EmbedBuilder()
      .setTitle('📜 Server Rules')
      .setDescription(
        '> Dengan berada di server ini, kamu setuju untuk mengikuti aturan berikut:\n\n' +
        rules.join('\n\n') +
        '\n\n───────────────────\n' +
        '⚠️ *Pelanggaran aturan akan dikenakan sanksi berupa warn/mute/kick/ban tergantung tingkat pelanggaran.*\n\n' +
        '✅ **Dengan memverifikasi, kamu setuju untuk mematuhi semua aturan di atas.**'
      )
      .setColor(0x2b2d31)
      .setThumbnail(interaction.guild.iconURL({ dynamic: true, size: 256 }))
      .setFooter({ text: `${interaction.guild.name} • Rules` })
      .setTimestamp();

    await channel.send({ embeds: [embed] });

    await interaction.reply({
      content: `✅ Rules embed dikirim ke ${channel}!`,
      ephemeral: true,
    });
  },
};

function getTemplateRules(template) {
  const templates = {
    gaming: [
      '**1.** 🤝 Bersikap sopan dan hormati semua member.',
      '**2.** 🚫 Dilarang toxic, racism, atau diskriminasi dalam bentuk apapun.',
      '**3.** 📵 Dilarang spam, flood, atau excessive ping.',
      '**4.** 🔞 Dilarang konten NSFW/18+ di semua channel.',
      '**5.** 🚫 Dilarang cheat/hack/exploit dalam game apapun.',
      '**6.** 🎙️ Jangan teriak/earrape di voice channel.',
      '**7.** 📢 Dilarang self-promote tanpa izin admin.',
      '**8.** 🔒 Jaga privasi member lain, dilarang doxxing.',
      '**9.** 👮 Patuhi keputusan staff/admin.',
      '**10.** 📋 Gunakan channel sesuai topiknya.',
    ],
    developer: [
      '**1.** 🤝 Bersikap sopan dan hormati semua member.',
      '**2.** 🚫 Dilarang toxic, racism, atau diskriminasi.',
      '**3.** 📵 Dilarang spam atau flood.',
      '**4.** 🔞 Dilarang konten NSFW/18+.',
      '**5.** 💻 Gunakan code block saat share code.',
      '**6.** ❓ Jelaskan masalahmu dengan detail saat bertanya.',
      '**7.** 🚫 Dilarang share script berbayar secara gratis (crack).',
      '**8.** 📢 Dilarang self-promote tanpa izin.',
      '**9.** 🔒 Jaga privasi, dilarang doxxing.',
      '**10.** 💰 Scam/penipuan = permanent ban.',
      '**11.** 👮 Hormati keputusan staff.',
      '**12.** 📋 Gunakan channel sesuai topiknya.',
    ],
    general: [
      '**1.** 🤝 Bersikap sopan dan ramah ke semua member.',
      '**2.** 🚫 Dilarang toxic, bully, atau diskriminasi.',
      '**3.** 📵 Dilarang spam, flood, atau excessive caps.',
      '**4.** 🔞 Dilarang konten NSFW/18+.',
      '**5.** 📢 Dilarang self-promote/iklan tanpa izin.',
      '**6.** 🔒 Jaga privasi member lain.',
      '**7.** 👮 Patuhi keputusan staff/admin.',
      '**8.** 📋 Gunakan channel sesuai topiknya.',
      '**9.** 🌐 Hormati perbedaan bahasa & budaya.',
      '**10.** 😊 Have fun & enjoy the community!',
    ],
    marketplace: [
      '**1.** 🤝 Bersikap sopan dan profesional.',
      '**2.** 🚫 Dilarang scam/penipuan (permanent ban).',
      '**3.** 💰 Gunakan payment yang aman (mutual agreement).',
      '**4.** 📸 Sertakan bukti transaksi di #buyer-proof.',
      '**5.** 🚫 Dilarang crack/share produk berbayar orang lain.',
      '**6.** ⏰ Seller harus memberikan estimasi waktu pengerjaan.',
      '**7.** 📢 Dilarang spam promosi produk.',
      '**8.** 🎫 Gunakan ticket untuk order/komplain.',
      '**9.** ⚠️ Report scammer ke staff dengan bukti.',
      '**10.** 👮 Keputusan admin bersifat final dalam dispute.',
      '**11.** 📋 Gunakan channel sesuai fungsinya.',
      '**12.** ✅ Seller baru harus verifikasi ke admin.',
    ],
  };

  return templates[template] || templates.general;
}
