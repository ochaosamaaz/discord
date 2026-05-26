const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // Slash Commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction, client);
      } catch (error) {
        console.error(`Error executing ${interaction.commandName}:`, error);
        const reply = { content: '❌ Terjadi error saat menjalankan command!', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(reply);
        } else {
          await interaction.reply(reply);
        }
      }
    }

    // Button Interactions
    if (interaction.isButton()) {
      const customId = interaction.customId;

      // Verification
      if (customId === 'verify_confirm') {
        const { handleVerify } = require('../systems/verification');
        await handleVerify(interaction);
        return;
      }

      // Ticket system
      if (customId.startsWith('ticket_')) {
        const args = customId.replace('ticket_', '').split('_');
        const { handleTicketButton } = require('../systems/ticket');
        await handleTicketButton(interaction, args);
        return;
      }

      // Reaction roles (button)
      if (customId.startsWith('rr_')) {
        const roleId = customId.replace('rr_', '');
        await handleReactionRole(interaction, roleId);
        return;
      }

      // Giveaway
      if (customId === 'giveaway_enter') {
        await handleGiveawayEntry(interaction);
        return;
      }

      // Music controls
      if (customId.startsWith('music_')) {
        await handleMusicButton(interaction, client);
        return;
      }
    }

    // Select Menu Interactions
    if (interaction.isStringSelectMenu()) {
      const customId = interaction.customId;

      // Reaction roles (dropdown)
      if (customId.startsWith('rr_menu_')) {
        await handleReactionRoleMenu(interaction);
        return;
      }

      // Onboarding
      if (customId.startsWith('onboarding_')) {
        await handleOnboarding(interaction);
        return;
      }
    }
  },
};

async function handleReactionRole(interaction, roleId) {
  const member = interaction.member;
  const role = interaction.guild.roles.cache.get(roleId);

  if (!role) {
    return interaction.reply({ content: '❌ Role tidak ditemukan!', ephemeral: true });
  }

  try {
    if (member.roles.cache.has(roleId)) {
      await member.roles.remove(role);
      await interaction.reply({ content: `❌ Role ${role.name} dihapus!`, ephemeral: true });
    } else {
      await member.roles.add(role);
      await interaction.reply({ content: `✅ Role ${role.name} ditambahkan!`, ephemeral: true });
    }
  } catch (err) {
    await interaction.reply({ content: '❌ Gagal mengubah role!', ephemeral: true });
  }
}

async function handleReactionRoleMenu(interaction) {
  const member = interaction.member;
  const selected = interaction.values;
  const { getDb } = require('../utils/database');
  const db = getDb();

  // Get all roles for this message
  const messageId = interaction.customId.replace('rr_menu_', '');
  const allRoles = db.prepare('SELECT * FROM reaction_roles WHERE message_id = ? AND guild_id = ?')
    .all(messageId, interaction.guild.id);

  const added = [];
  const removed = [];

  for (const roleData of allRoles) {
    const role = interaction.guild.roles.cache.get(roleData.role_id);
    if (!role) continue;

    if (selected.includes(roleData.role_id)) {
      if (!member.roles.cache.has(role.id)) {
        await member.roles.add(role).catch(() => {});
        added.push(role.name);
      }
    } else {
      if (member.roles.cache.has(role.id)) {
        await member.roles.remove(role).catch(() => {});
        removed.push(role.name);
      }
    }
  }

  let response = '';
  if (added.length > 0) response += `✅ Added: ${added.join(', ')}\n`;
  if (removed.length > 0) response += `❌ Removed: ${removed.join(', ')}`;
  if (!response) response = '📋 Tidak ada perubahan role.';

  await interaction.reply({ content: response, ephemeral: true });
}

async function handleGiveawayEntry(interaction) {
  const { getDb } = require('../utils/database');
  const db = getDb();
  const messageId = interaction.message.id;
  const userId = interaction.user.id;

  const giveaway = db.prepare('SELECT * FROM giveaways WHERE message_id = ?').get(messageId);
  if (!giveaway || giveaway.ended) {
    return interaction.reply({ content: '❌ Giveaway ini sudah berakhir!', ephemeral: true });
  }

  let entries = JSON.parse(giveaway.entries || '[]');

  if (entries.includes(userId)) {
    // Remove entry
    entries = entries.filter(id => id !== userId);
    db.prepare('UPDATE giveaways SET entries = ? WHERE message_id = ?').run(JSON.stringify(entries), messageId);
    await interaction.reply({ content: '❌ Kamu keluar dari giveaway!', ephemeral: true });
  } else {
    // Add entry
    entries.push(userId);
    db.prepare('UPDATE giveaways SET entries = ? WHERE message_id = ?').run(JSON.stringify(entries), messageId);
    await interaction.reply({ content: '✅ Kamu masuk ke giveaway! Good luck 🍀', ephemeral: true });
  }

  // Update button label
  const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('giveaway_enter')
      .setLabel('🎉 Participate')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('giveaway_entries')
      .setLabel(`${entries.length} entries`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
  );

  await interaction.message.edit({ components: [row] });
}

async function handleMusicButton(interaction, client) {
  const { getQueue } = require('../systems/music');
  const queue = getQueue(client, interaction.guild.id);
  const action = interaction.customId.replace('music_', '');

  if (!interaction.member.voice.channel) {
    return interaction.reply({ content: '❌ Join voice channel dulu!', ephemeral: true });
  }

  switch (action) {
    case 'pause':
      const { AudioPlayerStatus } = require('@discordjs/voice');
      if (queue.player.state.status === AudioPlayerStatus.Paused) {
        queue.resume();
        await interaction.reply({ content: '▶️ Resumed!', ephemeral: true });
      } else {
        queue.pause();
        await interaction.reply({ content: '⏸️ Paused!', ephemeral: true });
      }
      break;
    case 'skip':
      queue.skip();
      await interaction.reply({ content: '⏭️ Skipped!', ephemeral: true });
      break;
    case 'stop':
      const { deleteQueue } = require('../systems/music');
      deleteQueue(client, interaction.guild.id);
      await interaction.reply({ content: '⏹️ Stopped!', ephemeral: true });
      break;
    case 'loop':
      const looping = queue.toggleLoop();
      await interaction.reply({ content: looping ? '🔁 Loop On!' : '➡️ Loop Off!', ephemeral: true });
      break;
    case 'queue':
      if (!queue.current && queue.songs.length === 0) {
        return interaction.reply({ content: '📋 Queue kosong!', ephemeral: true });
      }
      let desc = queue.current ? `🎵 **Now:** ${queue.current.title}\n\n` : '';
      queue.songs.slice(0, 5).forEach((s, i) => {
        desc += `\`${i + 1}.\` ${s.title}\n`;
      });
      await interaction.reply({ content: desc, ephemeral: true });
      break;
  }
}

async function handleOnboarding(interaction) {
  const { getDb } = require('../utils/database');
  const db = getDb();
  const customId = interaction.customId;
  const guildId = interaction.guild.id;

  // Parse question index from customId: onboarding_q0_guildId
  const match = customId.match(/onboarding_q(\d+)_/);
  if (!match) return;

  const questionIndex = parseInt(match[1]);
  const questions = db.prepare('SELECT * FROM onboarding_questions WHERE guild_id = ?').all(guildId);
  const question = questions[questionIndex];

  if (!question) return;

  const selectedValue = interaction.values[0];
  // Parse selected option index: onboard_0_2
  const optMatch = selectedValue.match(/onboard_(\d+)_(\d+)/);
  if (!optMatch) return;

  const optionIndex = parseInt(optMatch[2]);

  // Assign role if configured
  if (question.roles) {
    const roleIds = question.roles.split('|');
    const roleId = roleIds[optionIndex];
    if (roleId && roleId.trim()) {
      const role = interaction.guild.roles.cache.get(roleId.trim());
      if (role) {
        await interaction.member.roles.add(role).catch(() => {});
      }
    }
  }

  const options = question.options.split('|');
  const selectedOption = options[optionIndex] || 'Unknown';

  await interaction.reply({
    content: `✅ Jawaban diterima: **${selectedOption}**`,
    ephemeral: true,
  });
}
