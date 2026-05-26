const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('server-setup')
    .setDescription('Setup otomatis seluruh server (channels, categories, roles)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option.setName('template')
        .setDescription('Template server yang ingin digunakan')
        .setRequired(true)
        .addChoices(
          { name: '🟢 Basic (30 channels)', value: 'basic' },
          { name: '🟡 Premium (70 channels)', value: 'premium' },
        )
    ),

  async execute(interaction) {
    const template = interaction.options.getString('template');
    const guild = interaction.guild;

    await interaction.deferReply({ ephemeral: true });

    const statusEmbed = new EmbedBuilder()
      .setTitle('⏳ Server Setup')
      .setDescription('Memulai setup server...')
      .setColor(0xfee75c);

    await interaction.editReply({ embeds: [statusEmbed] });

    try {
      // Create Roles first
      await createRoles(guild, template);

      // Delete default channels (optional - commented out for safety)
      // await cleanChannels(guild);

      // Create categories and channels
      if (template === 'basic') {
        await setupBasicTemplate(guild);
      } else {
        await setupPremiumTemplate(guild);
      }

      const doneEmbed = new EmbedBuilder()
        .setTitle('✅ Server Setup Selesai!')
        .setDescription(
          `Server telah di-setup dengan template **${template === 'basic' ? 'Basic (30 ch)' : 'Premium (70 ch)'}**!\n\n` +
          '**Yang telah dibuat:**\n' +
          '• ✅ Roles\n' +
          '• ✅ Categories & Channels\n' +
          '• ✅ Permissions\n\n' +
          '**Langkah selanjutnya:**\n' +
          '• `/verify-setup` - Setup verifikasi\n' +
          '• `/ticket-setup` - Setup tiket\n' +
          '• `/rules-setup` - Setup rules\n' +
          '• `/welcome-setup` - Setup welcome/goodbye\n' +
          '• `/reactionrole` - Setup reaction roles'
        )
        .setColor(0x57f287)
        .setFooter({ text: 'Zen Developer • Server Setup' })
        .setTimestamp();

      await interaction.editReply({ embeds: [doneEmbed] });
    } catch (error) {
      console.error('Server setup error:', error);
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Error')
        .setDescription(`Terjadi error saat setup: ${error.message}`)
        .setColor(0xed4245);
      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },
};

async function createRoles(guild, template) {
  const baseRoles = [
    { name: '👑 Owner', color: 0xffd700, hoist: true, position: 100 },
    { name: '⚡ Admin', color: 0xe74c3c, hoist: true, position: 90 },
    { name: '🛡️ Moderator', color: 0x3498db, hoist: true, position: 80 },
    { name: '🎫 Support', color: 0x5865f2, hoist: true, position: 70 },
    { name: '✅ Verified', color: 0x57f287, hoist: false, position: 10 },
    { name: '🔔 Notifications', color: 0x99aab5, hoist: false, position: 5 },
    { name: '🎮 Gamer', color: 0x9b59b6, hoist: false, position: 4 },
    { name: '🎨 Artist', color: 0xe91e63, hoist: false, position: 3 },
    { name: '💻 Developer', color: 0x2ecc71, hoist: false, position: 2 },
  ];

  const premiumRoles = [
    { name: '💎 VIP', color: 0xe91e63, hoist: true, position: 60 },
    { name: '🌟 Booster', color: 0xf47fff, hoist: true, position: 55 },
    { name: '🏆 Top Chatter', color: 0xfee75c, hoist: true, position: 50 },
    { name: '🎵 DJ', color: 0x1db954, hoist: false, position: 40 },
    { name: '📺 Content Creator', color: 0xff0000, hoist: true, position: 45 },
    { name: '🎁 Giveaway Winner', color: 0xffa500, hoist: false, position: 30 },
  ];

  const rolesToCreate = template === 'premium' ? [...baseRoles, ...premiumRoles] : baseRoles;

  for (const roleData of rolesToCreate) {
    const existingRole = guild.roles.cache.find(r => r.name === roleData.name);
    if (!existingRole) {
      await guild.roles.create({
        name: roleData.name,
        color: roleData.color,
        hoist: roleData.hoist,
        reason: 'Server setup',
      });
      await sleep(300);
    }
  }
}

async function setupBasicTemplate(guild) {
  const everyone = guild.roles.everyone;

  // ═══════ SERVER STATS ═══════
  const statsCat = await createCategory(guild, '✧───✧ SERVER STATS ✧───✧', [
    { id: everyone.id, deny: ['Connect', 'SendMessages'] },
  ]);
  await createChannel(guild, '👥︱All Members: 0', ChannelType.GuildVoice, statsCat, [
    { id: everyone.id, deny: ['Connect'] },
  ]);
  await createChannel(guild, '🤖︱Bots: 0', ChannelType.GuildVoice, statsCat, [
    { id: everyone.id, deny: ['Connect'] },
  ]);

  // ═══════ ZEN GATE ═══════
  const gateCat = await createCategory(guild, '✧───✧ ZEN GATE ✧───✧');
  await createChannel(guild, '🏠︱welcome', ChannelType.GuildText, gateCat);
  await createChannel(guild, '📜︱rules', ChannelType.GuildText, gateCat, [
    { id: everyone.id, deny: ['SendMessages'] },
  ]);
  await createChannel(guild, '📢︱announcements', ChannelType.GuildText, gateCat, [
    { id: everyone.id, deny: ['SendMessages'] },
  ]);
  await createChannel(guild, '🌐︱server-info', ChannelType.GuildText, gateCat, [
    { id: everyone.id, deny: ['SendMessages'] },
  ]);
  await createChannel(guild, '🏅︱leveling', ChannelType.GuildText, gateCat, [
    { id: everyone.id, deny: ['SendMessages'] },
  ]);
  await createChannel(guild, '🎭︱roles', ChannelType.GuildText, gateCat, [
    { id: everyone.id, deny: ['SendMessages'] },
  ]);
  await createChannel(guild, '👋︱goodbye', ChannelType.GuildText, gateCat);

  // ═══════ ZEN COMMUNITY ═══════
  const communityCat = await createCategory(guild, '✧───✧ ZEN COMMUNITY ✧───✧');
  await createChannel(guild, '💬︱general-chat', ChannelType.GuildText, communityCat);
  await createChannel(guild, '🖼️︱media-share', ChannelType.GuildText, communityCat);
  await createChannel(guild, '🌍︱english-chat', ChannelType.GuildText, communityCat);
  await createChannel(guild, '❓︱ask-question', ChannelType.GuildText, communityCat);
  await createChannel(guild, '🤖︱bot-commands', ChannelType.GuildText, communityCat);

  // ═══════ SUPPORT AREA ═══════
  const supportCat = await createCategory(guild, '✧ SUPPORT AREA ✧───✧');
  await createChannel(guild, '❓︱faq', ChannelType.GuildText, supportCat, [
    { id: everyone.id, deny: ['SendMessages'] },
  ]);
  await createChannel(guild, '🎫︱open-ticket', ChannelType.GuildText, supportCat, [
    { id: everyone.id, deny: ['SendMessages'] },
  ]);
  await createChannel(guild, '🐛︱report-bug', ChannelType.GuildText, supportCat);

  // ═══════ VOICE CHANNELS ═══════
  const voiceCat = await createCategory(guild, '✧ VOICE CHANNELS ✧───✧');
  await createChannel(guild, '🎙️︱General Voice', ChannelType.GuildVoice, voiceCat);
  await createChannel(guild, '🎵︱Music Room', ChannelType.GuildVoice, voiceCat);
  await createChannel(guild, '➕︱Create Voice', ChannelType.GuildVoice, voiceCat);

  // ═══════ LOGS ═══════
  const logsCat = await createCategory(guild, '✧ LOGS ✧───✧', [
    { id: everyone.id, deny: ['ViewChannel'] },
  ]);
  await createChannel(guild, '📝︱mod-logs', ChannelType.GuildText, logsCat);
  await createChannel(guild, '🚪︱join-leave-logs', ChannelType.GuildText, logsCat);
  await createChannel(guild, '💬︱message-logs', ChannelType.GuildText, logsCat);
}

async function setupPremiumTemplate(guild) {
  const everyone = guild.roles.everyone;

  // ═══════ SERVER STATS ═══════
  const statsCat = await createCategory(guild, '✧───✧ SERVER STATS ✧───✧', [
    { id: everyone.id, deny: ['Connect', 'SendMessages'] },
  ]);
  await createChannel(guild, '👥︱All Members: 0', ChannelType.GuildVoice, statsCat, [
    { id: everyone.id, deny: ['Connect'] },
  ]);
  await createChannel(guild, '👤︱Members: 0', ChannelType.GuildVoice, statsCat, [
    { id: everyone.id, deny: ['Connect'] },
  ]);
  await createChannel(guild, '🤖︱Bots: 0', ChannelType.GuildVoice, statsCat, [
    { id: everyone.id, deny: ['Connect'] },
  ]);

  // ═══════ ZEN GATE ═══════
  const gateCat = await createCategory(guild, '✧───✧ ZEN GATE ✧───✧');
  await createChannel(guild, '🏠︱welcome', ChannelType.GuildText, gateCat);
  await createChannel(guild, '📜︱rules', ChannelType.GuildText, gateCat, [
    { id: everyone.id, deny: ['SendMessages'] },
  ]);
  await createChannel(guild, '📢︱announcements', ChannelType.GuildText, gateCat, [
    { id: everyone.id, deny: ['SendMessages'] },
  ]);
  await createChannel(guild, '🌐︱server-info', ChannelType.GuildText, gateCat, [
    { id: everyone.id, deny: ['SendMessages'] },
  ]);
  await createChannel(guild, '🏅︱leveling', ChannelType.GuildText, gateCat, [
    { id: everyone.id, deny: ['SendMessages'] },
  ]);
  await createChannel(guild, '🎭︱roles', ChannelType.GuildText, gateCat, [
    { id: everyone.id, deny: ['SendMessages'] },
  ]);
  await createChannel(guild, '👋︱goodbye', ChannelType.GuildText, gateCat);
  await createChannel(guild, '✅︱verify', ChannelType.GuildText, gateCat, [
    { id: everyone.id, deny: ['SendMessages'] },
  ]);

  // ═══════ ZEN COMMUNITY ═══════
  const communityCat = await createCategory(guild, '✧───✧ ZEN COMMUNITY ✧───✧');
  await createChannel(guild, '💬︱general-chat', ChannelType.GuildText, communityCat);
  await createChannel(guild, '🖼️︱media-share', ChannelType.GuildText, communityCat);
  await createChannel(guild, '🌍︱english-chat', ChannelType.GuildText, communityCat);
  await createChannel(guild, '❓︱ask-question', ChannelType.GuildText, communityCat);
  await createChannel(guild, '🤖︱bot-commands', ChannelType.GuildText, communityCat);
  await createChannel(guild, '🎉︱giveaways', ChannelType.GuildText, communityCat, [
    { id: everyone.id, deny: ['SendMessages'] },
  ]);
  await createChannel(guild, '🎮︱mini-games', ChannelType.GuildText, communityCat);
  await createChannel(guild, '📷︱selfie', ChannelType.GuildText, communityCat);
  await createChannel(guild, '🎂︱birthday', ChannelType.GuildText, communityCat);

  // ═══════ ROBLOX SCRIPTING ═══════
  const robloxCat = await createCategory(guild, '✧───✧ ROBLOX SCRIPTING ✧───✧');
  await createChannel(guild, '📚︱script-discussion', ChannelType.GuildText, robloxCat);
  await createChannel(guild, '⚡︱luau-scripting', ChannelType.GuildText, robloxCat);
  await createChannel(guild, '🐛︱bug-fixing', ChannelType.GuildText, robloxCat);
  await createChannel(guild, '🎮︱game-system', ChannelType.GuildText, robloxCat);
  await createChannel(guild, '🏗️︱roblox-studio', ChannelType.GuildText, robloxCat);
  await createChannel(guild, '🎨︱ui-design', ChannelType.GuildText, robloxCat);
  await createChannel(guild, '⚙️︱script-optimization', ChannelType.GuildText, robloxCat);

  // ═══════ ZEN MARKET ═══════
  const marketCat = await createCategory(guild, '✧───✧ ZEN MARKET ✧───✧');
  await createChannel(guild, '🛒︱order-script', ChannelType.GuildText, marketCat, [
    { id: everyone.id, deny: ['SendMessages'] },
  ]);
  await createChannel(guild, '📋︱script-list', ChannelType.GuildText, marketCat, [
    { id: everyone.id, deny: ['SendMessages'] },
  ]);
  await createChannel(guild, '💎︱premium-script', ChannelType.GuildText, marketCat, [
    { id: everyone.id, deny: ['SendMessages'] },
  ]);
  await createChannel(guild, '🧾︱buyer-proof', ChannelType.GuildText, marketCat);
  await createChannel(guild, '📦︱update-script', ChannelType.GuildText, marketCat, [
    { id: everyone.id, deny: ['SendMessages'] },
  ]);

  // ═══════ SUPPORT AREA ═══════
  const supportCat = await createCategory(guild, '✧ SUPPORT AREA ✧───✧');
  await createChannel(guild, '❓︱faq', ChannelType.GuildText, supportCat, [
    { id: everyone.id, deny: ['SendMessages'] },
  ]);
  await createChannel(guild, '🎫︱open-ticket', ChannelType.GuildText, supportCat, [
    { id: everyone.id, deny: ['SendMessages'] },
  ]);
  await createChannel(guild, '🐛︱report-bug', ChannelType.GuildText, supportCat);

  // ═══════ NOTIFICATIONS ═══════
  const notifCat = await createCategory(guild, '✧ NOTIFICATIONS ✧───✧');
  await createChannel(guild, '📺︱youtube', ChannelType.GuildText, notifCat, [
    { id: everyone.id, deny: ['SendMessages'] },
  ]);
  await createChannel(guild, '🎵︱tiktok', ChannelType.GuildText, notifCat, [
    { id: everyone.id, deny: ['SendMessages'] },
  ]);
  await createChannel(guild, '🐦︱twitter', ChannelType.GuildText, notifCat, [
    { id: everyone.id, deny: ['SendMessages'] },
  ]);

  // ═══════ VOICE CHANNELS ═══════
  const voiceCat = await createCategory(guild, '✧ VOICE CHANNELS ✧───✧');
  await createChannel(guild, '❓︱cara-penggunaan', ChannelType.GuildText, voiceCat, [
    { id: everyone.id, deny: ['SendMessages'] },
  ]);
  await createChannel(guild, '🎙️︱General Voice 1', ChannelType.GuildVoice, voiceCat);
  await createChannel(guild, '🎙️︱General Voice 2', ChannelType.GuildVoice, voiceCat);
  await createChannel(guild, '🎵︱Music Room 1', ChannelType.GuildVoice, voiceCat);
  await createChannel(guild, '🎵︱Music Room 2', ChannelType.GuildVoice, voiceCat);
  await createChannel(guild, '🎵︱Music Room 3', ChannelType.GuildVoice, voiceCat);
  await createChannel(guild, '🎬︱Streaming', ChannelType.GuildVoice, voiceCat);
  await createChannel(guild, '➕︱Create Voice', ChannelType.GuildVoice, voiceCat);

  // ═══════ VIP ZONE ═══════
  const vipCat = await createCategory(guild, '✧ VIP ZONE ✧───✧', [
    { id: everyone.id, deny: ['ViewChannel'] },
  ]);
  await createChannel(guild, '💎︱vip-chat', ChannelType.GuildText, vipCat);
  await createChannel(guild, '🎁︱vip-perks', ChannelType.GuildText, vipCat);
  await createChannel(guild, '🎙️︱VIP Voice', ChannelType.GuildVoice, vipCat);

  // ═══════ STAFF AREA ═══════
  const staffCat = await createCategory(guild, '✧ STAFF AREA ✧───✧', [
    { id: everyone.id, deny: ['ViewChannel'] },
  ]);
  await createChannel(guild, '📋︱staff-chat', ChannelType.GuildText, staffCat);
  await createChannel(guild, '📝︱staff-commands', ChannelType.GuildText, staffCat);
  await createChannel(guild, '🗳️︱staff-voting', ChannelType.GuildText, staffCat);
  await createChannel(guild, '🎙️︱Staff Voice', ChannelType.GuildVoice, staffCat);

  // ═══════ LOGS ═══════
  const logsCat = await createCategory(guild, '✧ LOGS ✧───✧', [
    { id: everyone.id, deny: ['ViewChannel'] },
  ]);
  await createChannel(guild, '📝︱mod-logs', ChannelType.GuildText, logsCat);
  await createChannel(guild, '🚪︱join-leave-logs', ChannelType.GuildText, logsCat);
  await createChannel(guild, '💬︱message-logs', ChannelType.GuildText, logsCat);
  await createChannel(guild, '🎫︱ticket-logs', ChannelType.GuildText, logsCat);
  await createChannel(guild, '⚠️︱warn-logs', ChannelType.GuildText, logsCat);
}

async function createCategory(guild, name, permissionOverwrites = []) {
  const category = await guild.channels.create({
    name,
    type: ChannelType.GuildCategory,
    permissionOverwrites: permissionOverwrites.map(p => ({
      id: p.id,
      deny: p.deny ? p.deny.map(d => PermissionFlagsBits[d]) : [],
      allow: p.allow ? p.allow.map(a => PermissionFlagsBits[a]) : [],
    })),
  });
  await sleep(400);
  return category;
}

async function createChannel(guild, name, type, parent, permissionOverwrites = []) {
  const channel = await guild.channels.create({
    name,
    type,
    parent: parent.id,
    permissionOverwrites: permissionOverwrites.map(p => ({
      id: p.id,
      deny: p.deny ? p.deny.map(d => PermissionFlagsBits[d]) : [],
      allow: p.allow ? p.allow.map(a => PermissionFlagsBits[a]) : [],
    })),
  });
  await sleep(300);
  return channel;
}

const { PermissionFlagsBits: PermFlags } = require('discord.js');
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
