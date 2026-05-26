const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  StringSelectMenuBuilder,
} = require('discord.js');
const { getDb } = require('../utils/database');

async function sendTicketPanel(channel) {
  const embed = new EmbedBuilder()
    .setTitle('🎫 Support Ticket')
    .setDescription(
      '> Butuh bantuan? Buat tiket untuk menghubungi tim support!\n\n' +
      '📋 **Pilih kategori tiket:**\n' +
      '• 💬 **General** - Pertanyaan umum\n' +
      '• 🛒 **Order** - Masalah pesanan/pembelian\n' +
      '• 🐛 **Bug Report** - Laporkan bug\n' +
      '• 💡 **Suggestion** - Saran & masukan\n\n' +
      '⚠️ *Jangan spam membuat tiket!*'
    )
    .setColor(0x5865f2)
    .setFooter({ text: 'Zen Developer • Ticket System' })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_create_general')
      .setLabel('💬 General')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('ticket_create_order')
      .setLabel('🛒 Order')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('ticket_create_bug')
      .setLabel('🐛 Bug')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('ticket_create_suggestion')
      .setLabel('💡 Suggestion')
      .setStyle(ButtonStyle.Success),
  );

  await channel.send({ embeds: [embed], components: [row] });
}

async function handleTicketButton(interaction, args) {
  const action = args[0]; // 'create' or 'close'

  if (action === 'create') {
    const category = args[1] || 'general';
    await createTicket(interaction, category);
  }

  if (action === 'close') {
    await closeTicket(interaction);
  }
}

async function createTicket(interaction, category) {
  const guild = interaction.guild;
  const member = interaction.member;

  // Check if user already has an open ticket
  const existingTicket = guild.channels.cache.find(
    ch => ch.name === `ticket-${member.user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}` && ch.type === ChannelType.GuildText
  );

  if (existingTicket) {
    return interaction.reply({
      content: `⚠️ Kamu sudah memiliki tiket yang terbuka: ${existingTicket}`,
      ephemeral: true,
    });
  }

  // Find or create ticket category
  let ticketCategory = guild.channels.cache.find(
    ch => ch.name === '🎫 Tickets' && ch.type === ChannelType.GuildCategory
  );

  if (!ticketCategory) {
    ticketCategory = await guild.channels.create({
      name: '🎫 Tickets',
      type: ChannelType.GuildCategory,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
      ],
    });
  }

  // Find support role
  const supportRole = guild.roles.cache.find(r => r.name === '🎫 Support' || r.name === 'Support');

  // Create ticket channel
  const ticketChannel = await guild.channels.create({
    name: `ticket-${member.user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
    type: ChannelType.GuildText,
    parent: ticketCategory.id,
    permissionOverwrites: [
      {
        id: guild.id,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: member.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
      },
      ...(supportRole ? [{
        id: supportRole.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
      }] : []),
    ],
  });

  const categoryLabels = {
    general: '💬 General',
    order: '🛒 Order',
    bug: '🐛 Bug Report',
    suggestion: '💡 Suggestion',
  };

  const embed = new EmbedBuilder()
    .setTitle(`🎫 Ticket - ${categoryLabels[category] || category}`)
    .setDescription(
      `Halo ${member}! Tiket kamu telah dibuat.\n\n` +
      `📋 **Kategori:** ${categoryLabels[category] || category}\n` +
      `👤 **Dibuat oleh:** ${member}\n` +
      `📅 **Waktu:** <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
      `Silakan jelaskan masalahmu dan tim support akan segera membantu!`
    )
    .setColor(0x5865f2)
    .setFooter({ text: 'Zen Developer • Ticket System' });

  const closeRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_close')
      .setLabel('🔒 Close Ticket')
      .setStyle(ButtonStyle.Danger)
  );

  await ticketChannel.send({ content: `${member} ${supportRole ? supportRole : ''}`, embeds: [embed], components: [closeRow] });

  await interaction.reply({
    content: `✅ Tiket berhasil dibuat: ${ticketChannel}`,
    ephemeral: true,
  });
}

async function closeTicket(interaction) {
  const channel = interaction.channel;

  if (!channel.name.startsWith('ticket-')) {
    return interaction.reply({
      content: '❌ Ini bukan channel tiket!',
      ephemeral: true,
    });
  }

  const embed = new EmbedBuilder()
    .setTitle('🔒 Tiket Ditutup')
    .setDescription(
      `Tiket ditutup oleh ${interaction.member}\n` +
      `Channel akan dihapus dalam 5 detik...`
    )
    .setColor(0xed4245)
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });

  setTimeout(async () => {
    try {
      await channel.delete('Ticket closed');
    } catch (err) {
      console.error('Error deleting ticket channel:', err);
    }
  }, 5000);
}

module.exports = { sendTicketPanel, handleTicketButton };
