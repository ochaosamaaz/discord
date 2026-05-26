const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('minigame')
    .setDescription('Main mini games!')
    .addSubcommand(sub =>
      sub.setName('rps')
        .setDescription('Main batu-gunting-kertas!')
        .addStringOption(opt =>
          opt.setName('choice').setDescription('Pilihanmu').setRequired(true)
            .addChoices(
              { name: '🪨 Batu', value: 'rock' },
              { name: '✂️ Gunting', value: 'scissors' },
              { name: '📄 Kertas', value: 'paper' },
            )
        )
    )
    .addSubcommand(sub =>
      sub.setName('coinflip')
        .setDescription('Lempar koin!')
    )
    .addSubcommand(sub =>
      sub.setName('dice')
        .setDescription('Lempar dadu!')
    )
    .addSubcommand(sub =>
      sub.setName('8ball')
        .setDescription('Tanya 8ball!')
        .addStringOption(opt => opt.setName('question').setDescription('Pertanyaanmu').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('guess')
        .setDescription('Tebak angka 1-100!')
        .addIntegerOption(opt =>
          opt.setName('number').setDescription('Tebakanmu (1-100)').setRequired(true).setMinValue(1).setMaxValue(100)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'rps') {
      const choices = ['rock', 'scissors', 'paper'];
      const emojis = { rock: '🪨', scissors: '✂️', paper: '📄' };
      const names = { rock: 'Batu', scissors: 'Gunting', paper: 'Kertas' };

      const userChoice = interaction.options.getString('choice');
      const botChoice = choices[Math.floor(Math.random() * 3)];

      let result;
      if (userChoice === botChoice) {
        result = '🤝 **Seri!**';
      } else if (
        (userChoice === 'rock' && botChoice === 'scissors') ||
        (userChoice === 'scissors' && botChoice === 'paper') ||
        (userChoice === 'paper' && botChoice === 'rock')
      ) {
        result = '🎉 **Kamu Menang!**';
      } else {
        result = '😔 **Kamu Kalah!**';
      }

      const embed = new EmbedBuilder()
        .setTitle('🎮 Batu Gunting Kertas')
        .setDescription(
          `${emojis[userChoice]} Kamu: **${names[userChoice]}**\n` +
          `${emojis[botChoice]} Bot: **${names[botChoice]}**\n\n` +
          result
        )
        .setColor(result.includes('Menang') ? 0x57f287 : result.includes('Kalah') ? 0xed4245 : 0xfee75c)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }

    if (sub === 'coinflip') {
      const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
      const emoji = result === 'Heads' ? '🪙' : '💫';

      const embed = new EmbedBuilder()
        .setTitle('🪙 Coin Flip')
        .setDescription(`${emoji} Hasilnya: **${result}**!`)
        .setColor(0xfee75c)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }

    if (sub === 'dice') {
      const result = Math.floor(Math.random() * 6) + 1;
      const diceEmojis = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

      const embed = new EmbedBuilder()
        .setTitle('🎲 Dice Roll')
        .setDescription(`${diceEmojis[result]} Hasilnya: **${result}**!`)
        .setColor(0x5865f2)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }

    if (sub === '8ball') {
      const question = interaction.options.getString('question');
      const answers = [
        'Ya, pasti! ✅', 'Tentu saja! 💯', 'Mungkin... 🤔',
        'Sepertinya iya 👍', 'Tidak yakin 😅', 'Jangan harap 😂',
        'Tidak! ❌', 'Belum waktunya ⏳', 'Tanya lagi nanti 🔮',
        'Sangat mungkin! 🌟', 'Aku ragu... 🤷', 'Absolutely! 🎯',
        'Tidak dalam mimpimu! 💀', 'Signs point to yes ✨', 'Outlook not so good 😬',
      ];
      const answer = answers[Math.floor(Math.random() * answers.length)];

      const embed = new EmbedBuilder()
        .setTitle('🔮 Magic 8-Ball')
        .addFields(
          { name: '❓ Pertanyaan', value: question },
          { name: '🔮 Jawaban', value: answer },
        )
        .setColor(0x9b59b6)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }

    if (sub === 'guess') {
      const userGuess = interaction.options.getInteger('number');
      const target = Math.floor(Math.random() * 100) + 1;
      const diff = Math.abs(userGuess - target);

      let result;
      if (diff === 0) {
        result = '🎉 **TEPAT! Kamu hebat!** 🏆';
      } else if (diff <= 5) {
        result = `🔥 **Sangat dekat!** Jawabannya: **${target}**`;
      } else if (diff <= 15) {
        result = `😊 **Lumayan dekat!** Jawabannya: **${target}**`;
      } else if (diff <= 30) {
        result = `🤔 **Agak jauh...** Jawabannya: **${target}**`;
      } else {
        result = `😅 **Jauh banget!** Jawabannya: **${target}**`;
      }

      const embed = new EmbedBuilder()
        .setTitle('🔢 Guess The Number')
        .setDescription(
          `Tebakanmu: **${userGuess}**\n` +
          `${result}`
        )
        .setColor(diff === 0 ? 0x57f287 : diff <= 15 ? 0xfee75c : 0xed4245)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  },
};
