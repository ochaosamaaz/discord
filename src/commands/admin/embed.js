const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Buat custom embed message')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(opt => opt.setName('title').setDescription('Judul embed').setRequired(true))
    .addStringOption(opt => opt.setName('description').setDescription('Deskripsi embed').setRequired(true))
    .addStringOption(opt => opt.setName('color').setDescription('Warna hex (contoh: #5865f2)'))
    .addStringOption(opt => opt.setName('thumbnail').setDescription('URL thumbnail'))
    .addStringOption(opt => opt.setName('image').setDescription('URL image'))
    .addStringOption(opt => opt.setName('footer').setDescription('Text footer'))
    .addChannelOption(opt => opt.setName('channel').setDescription('Channel tujuan').addChannelTypes(ChannelType.GuildText))
    .addStringOption(opt => opt.setName('field1_name').setDescription('Field 1 - Name'))
    .addStringOption(opt => opt.setName('field1_value').setDescription('Field 1 - Value'))
    .addStringOption(opt => opt.setName('field2_name').setDescription('Field 2 - Name'))
    .addStringOption(opt => opt.setName('field2_value').setDescription('Field 2 - Value')),

  async execute(interaction) {
    const title = interaction.options.getString('title');
    const description = interaction.options.getString('description').replace(/\\n/g, '\n');
    const color = interaction.options.getString('color') || '#5865f2';
    const thumbnail = interaction.options.getString('thumbnail');
    const image = interaction.options.getString('image');
    const footer = interaction.options.getString('footer') || interaction.guild.name;
    const channel = interaction.options.getChannel('channel') || interaction.channel;

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(parseInt(color.replace('#', ''), 16) || 0x5865f2)
      .setFooter({ text: footer })
      .setTimestamp();

    if (thumbnail) embed.setThumbnail(thumbnail);
    if (image) embed.setImage(image);

    // Add fields
    const f1Name = interaction.options.getString('field1_name');
    const f1Value = interaction.options.getString('field1_value');
    if (f1Name && f1Value) embed.addFields({ name: f1Name, value: f1Value.replace(/\\n/g, '\n'), inline: true });

    const f2Name = interaction.options.getString('field2_name');
    const f2Value = interaction.options.getString('field2_value');
    if (f2Name && f2Value) embed.addFields({ name: f2Name, value: f2Value.replace(/\\n/g, '\n'), inline: true });

    await channel.send({ embeds: [embed] });
    await interaction.reply({ content: `✅ Embed dikirim ke ${channel}!`, ephemeral: true });
  },
};
