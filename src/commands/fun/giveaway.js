const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getDb } = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Manage giveaways')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
      sub.setName('start')
        .setDescription('Mulai giveaway baru')
        .addStringOption(opt => opt.setName('prize').setDescription('Hadiah giveaway').setRequired(true))
        .addStringOption(opt => opt.setName('duration').setDescription('Durasi (contoh: 1h, 30m, 1d, 7d)').setRequired(true))
        .addIntegerOption(opt => opt.setName('winners').setDescription('Jumlah pemenang').setMinValue(1).setMaxValue(20))
        .addStringOption(opt => opt.setName('description').setDescription('Deskripsi tambahan'))
    )
    .addSubcommand(sub =>
      sub.setName('end')
        .setDescription('Akhiri giveaway lebih awal')
        .addStringOption(opt => opt.setName('message_id').setDescription('Message ID giveaway').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('reroll')
        .setDescription('Reroll pemenang giveaway')
        .addStringOption(opt => opt.setName('message_id').setDescription('Message ID giveaway').setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const db = getDb();

    if (sub === 'start') {
      const prize = interaction.options.getString('prize');
      const durationStr = interaction.options.getString('duration');
      const winnersCount = interaction.options.getInteger('winners') || 1;
      const description = interaction.options.getString('description') || '';

      // Parse duration
      const duration = parseDuration(durationStr);
      if (!duration) {
        return interaction.reply({ content: '❌ Format durasi tidak valid! Contoh: 1h, 30m, 1d, 7d', ephemeral: true });
      }

      const endTime = Date.now() + duration;
      const endTimestamp = Math.floor(endTime / 1000);

      const embed = new EmbedBuilder()
        .setTitle('🎉 GIVEAWAY 🎉')
        .setDescription(
          `**${prize}**\n\n` +
          (description ? `${description}\n\n` : '') +
          `⏰ Berakhir: <t:${endTimestamp}:R> (<t:${endTimestamp}:F>)\n` +
          `🏆 Pemenang: **${winnersCount}** orang\n` +
          `🎫 Entries: **0**\n\n` +
          `Klik tombol 🎉 di bawah untuk berpartisipasi!`
        )
        .setColor(0xfee75c)
        .setFooter({ text: `Hosted by ${interaction.user.username} • Zen Developer` })
        .setTimestamp(new Date(endTime));

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('giveaway_enter')
          .setLabel('🎉 Participate')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('giveaway_entries')
          .setLabel('0 entries')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
      );

      const msg = await interaction.channel.send({ embeds: [embed], components: [row] });

      // Save to database
      db.prepare(`INSERT INTO giveaways (message_id, channel_id, guild_id, prize, winners_count, end_time, host_id, entries) 
        VALUES (?, ?, ?, ?, ?, ?, ?, '[]')`)
        .run(msg.id, interaction.channel.id, interaction.guild.id, prize, winnersCount, endTime, interaction.user.id);

      await interaction.reply({ content: `✅ Giveaway dimulai! Prize: **${prize}**`, ephemeral: true });

      // Set timeout to end giveaway
      setTimeout(async () => {
        await endGiveaway(interaction.client, msg.id, interaction.guild.id, interaction.channel.id);
      }, duration);
    }

    if (sub === 'end') {
      const messageId = interaction.options.getString('message_id');
      await endGiveaway(interaction.client, messageId, interaction.guild.id, interaction.channel.id);
      await interaction.reply({ content: '✅ Giveaway diakhiri!', ephemeral: true });
    }

    if (sub === 'reroll') {
      const messageId = interaction.options.getString('message_id');
      const giveaway = db.prepare('SELECT * FROM giveaways WHERE message_id = ? AND guild_id = ?').get(messageId, interaction.guild.id);

      if (!giveaway) {
        return interaction.reply({ content: '❌ Giveaway tidak ditemukan!', ephemeral: true });
      }

      const entries = JSON.parse(giveaway.entries || '[]');
      if (entries.length === 0) {
        return interaction.reply({ content: '❌ Tidak ada peserta!', ephemeral: true });
      }

      const winners = pickWinners(entries, giveaway.winners_count);
      const winnerMentions = winners.map(w => `<@${w}>`).join(', ');

      await interaction.reply(`🎉 **Reroll!** Pemenang baru: ${winnerMentions}`);
    }
  },
};

async function endGiveaway(client, messageId, guildId, channelId) {
  const db = getDb();
  const giveaway = db.prepare('SELECT * FROM giveaways WHERE message_id = ? AND guild_id = ?').get(messageId, guildId);
  if (!giveaway || giveaway.ended) return;

  const guild = client.guilds.cache.get(guildId);
  if (!guild) return;

  const channel = guild.channels.cache.get(channelId);
  if (!channel) return;

  let msg;
  try {
    msg = await channel.messages.fetch(messageId);
  } catch { return; }

  const entries = JSON.parse(giveaway.entries || '[]');

  let resultText;
  if (entries.length === 0) {
    resultText = 'Tidak ada peserta 😢';
  } else {
    const winners = pickWinners(entries, giveaway.winners_count);
    const winnerMentions = winners.map(w => `<@${w}>`).join(', ');
    resultText = `🏆 Pemenang: ${winnerMentions}`;
    channel.send(`🎉 Selamat ${winnerMentions}! Kamu menang **${giveaway.prize}**!`);
  }

  const embed = new EmbedBuilder()
    .setTitle('🎉 GIVEAWAY ENDED 🎉')
    .setDescription(
      `**${giveaway.prize}**\n\n` +
      `${resultText}\n\n` +
      `🎫 Total Entries: **${entries.length}**`
    )
    .setColor(0x99aab5)
    .setFooter({ text: `Ended • Zen Developer` })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('giveaway_ended')
      .setLabel('🎉 Ended')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
  );

  await msg.edit({ embeds: [embed], components: [row] });

  db.prepare('UPDATE giveaways SET ended = 1 WHERE message_id = ? AND guild_id = ?').run(messageId, guildId);
}

function pickWinners(entries, count) {
  const shuffled = [...entries].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, entries.length));
}

function parseDuration(str) {
  const match = str.match(/^(\d+)(m|h|d|w)$/);
  if (!match) return null;

  const num = parseInt(match[1]);
  const unit = match[2];

  const multipliers = { m: 60000, h: 3600000, d: 86400000, w: 604800000 };
  return num * multipliers[unit];
}

module.exports.endGiveaway = endGiveaway;
