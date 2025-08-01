const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ]
});

// In-memory map to track which user got which account (resets on bot restart)
const userAccountMap = {};

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  const CLIENT_ID = client.user.id;

  // Register /generate command
  const commands = [
    new SlashCommandBuilder()
      .setName('generate')
      .setDescription('Get a random account from the database (1 per user).')
      .toJSON()
  ];

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  await rest.put(
    Routes.applicationCommands(CLIENT_ID),
    { body: commands }
  );
  console.log('Slash command registered.');
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'generate') {
    const userId = interaction.user.id;

    // Check if user already claimed an account
    if (userAccountMap[userId]) {
      try {
        await interaction.user.send(`You have already received an account: \`${userAccountMap[userId]}\``);
        await interaction.reply({ content: 'You have already been sent an account. Check your DMs!', ephemeral: true });
      } catch {
        await interaction.reply({ content: 'Unable to send you a DM. Please check your privacy settings.', ephemeral: true });
      }
      return;
    }

    // Load accounts from environment variable
    const accountsRaw = process.env.ACCOUNTS || '';
    let accounts = accountsRaw.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    // Remove already assigned accounts
    const assignedAccounts = Object.values(userAccountMap);
    const availableAccounts = accounts.filter(acc => !assignedAccounts.includes(acc));

    if (!availableAccounts.length) {
      await interaction.reply({ content: 'No accounts available.', ephemeral: true });
      return;
    }

    // Pick a random account
    const randomAccount = availableAccounts[Math.floor(Math.random() * availableAccounts.length)];
    userAccountMap[userId] = randomAccount;

    try {
      await interaction.user.send(`Your generated account: \`${randomAccount}\``);
      await interaction.reply({ content: 'Account sent to your DMs!', ephemeral: true });
    } catch {
      await interaction.reply({ content: 'Unable to send you a DM. Please check your privacy settings.', ephemeral: true });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
