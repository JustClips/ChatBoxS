const { 
  Client, GatewayIntentBits, REST, Routes, 
  SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder 
} = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// In-memory for user-account assignment (resets on restart)
const userAccountMap = {};

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  const CLIENT_ID = client.user.id;

  // Register /embed command
  const commands = [
    new SlashCommandBuilder()
      .setName('embed')
      .setDescription('Send the account generator embed to this channel.')
      .toJSON()
  ];
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
  console.log('Slash command registered.');
});

client.on('interactionCreate', async interaction => {
  // Handle /embed command
  if (interaction.isChatInputCommand() && interaction.commandName === 'embed') {
    const embed = new EmbedBuilder()
      .setTitle('Account Generator')
      .setDescription('To generate an account, click the "Generate Account" button below. You will receive your account via a private reply!')
      .setColor(0x5865F2);

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('generate_account')
          .setLabel('Generate Account')
          .setStyle(ButtonStyle.Primary)
      );

    await interaction.reply({ embeds: [embed], components: [row] });
  }

  // Handle button
  if (interaction.isButton() && interaction.customId === 'generate_account') {
    const userId = interaction.user.id;

    // Load accounts from env
    const accountsRaw = process.env.ACCOUNTS || '';
    const accounts = accountsRaw.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    const assignedAccounts = Object.values(userAccountMap);
    const availableAccounts = accounts.filter(acc => !assignedAccounts.includes(acc));

    // Already claimed?
    if (userAccountMap[userId]) {
      await interaction.reply({ 
        content: `You have already received an account: \`${userAccountMap[userId]}\``, 
        ephemeral: true 
      });
      return;
    }

    if (!availableAccounts.length) {
      await interaction.reply({ content: 'No accounts available.', ephemeral: true });
      return;
    }

    // Assign account
    const randomAccount = availableAccounts[Math.floor(Math.random() * availableAccounts.length)];
    userAccountMap[userId] = randomAccount;

    await interaction.reply({
      content: `Your generated account: \`${randomAccount}\``,
      ephemeral: true
    });
  }
});

client.login(process.env.DISCORD_TOKEN);
