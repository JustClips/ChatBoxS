const { 
  Client, GatewayIntentBits, REST, Routes, 
  SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder 
} = require('discord.js');
const noblox = require('noblox.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// In-memory for user-account assignment (resets on restart)
const userAccountMap = {};

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  const CLIENT_ID = client.user.id;

  // Register /embed and /followall commands
  const commands = [
    new SlashCommandBuilder()
      .setName('embed')
      .setDescription('Send the account generator embed to this channel.'),
    new SlashCommandBuilder()
      .setName('followall')
      .setDescription('All accounts will follow the specified Roblox user.')
      .addStringOption(option =>
        option.setName('username')
          .setDescription('The Roblox username to follow')
          .setRequired(true)
      )
  ].map(cmd => cmd.toJSON());

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
  console.log('Slash commands registered.');
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

  // Handle /followall command
  if (interaction.isChatInputCommand() && interaction.commandName === 'followall') {
    const username = interaction.options.getString('username');
    // Parse your account credentials from env
    const accountsRaw = process.env.ROBLOX_ACCOUNTS || '';
    const accounts = accountsRaw.split('\n').map(l => l.trim()).filter(Boolean);

    await interaction.reply({ content: `Starting to follow ${username} with all accounts...`, ephemeral: true });

    // Get userId from username
    let targetUserId;
    try {
      targetUserId = await noblox.getIdFromUsername(username);
    } catch (e) {
      await interaction.followUp({ content: `❌ Could not find user: ${username}`, ephemeral: true });
      return;
    }

    let successCount = 0, failCount = 0;
    for (const account of accounts) {
      const [accUsername, accPassword] = account.split(':');
      try {
        await noblox.setCookie(''); // Unset previous session
        await noblox.login({ username: accUsername, password: accPassword });
        await noblox.follow(targetUserId);
        successCount++;
      } catch (e) {
        failCount++;
      }
    }
    await interaction.followUp({ content: `Done! ✅ ${successCount} succeeded, ❌ ${failCount} failed.`, ephemeral: true });
  }

  // Handle button for account generation
  if (interaction.isButton() && interaction.customId === 'generate_account') {
    const userId = interaction.user.id;

    // Load accounts from env (for account generation, show username:password)
    const accountsRaw = process.env.ROBLOX_ACCOUNTS || '';
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
