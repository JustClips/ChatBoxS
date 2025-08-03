const { Client, GatewayIntentBits, Partials, Events, REST, Routes, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel]
});

const TOKEN = process.env.DISCORD_TOKEN;
const ACCOUNTS = process.env.ACCOUNTS || ''; // username:password per line
const COOLDOWN_HOURS = 12;
const COOLDOWN_MS = COOLDOWN_HOURS * 60 * 60 * 1000;

// Parse accounts
function parseAccounts(raw) {
  return raw
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(l => {
      const idx = l.indexOf(':');
      if (idx > 0) {
        return { username: l.slice(0, idx), password: l.slice(idx + 1) };
      }
      return null;
    })
    .filter(Boolean);
}

const accounts = parseAccounts(ACCOUNTS);

// Track claimed accounts
const claimedAccounts = {};

// Helper to check cooldown
function getRemainingCooldown(userId) {
  const info = claimedAccounts[userId];
  if (!info) return 0;
  const elapsed = Date.now() - info.time;
  if (elapsed >= COOLDOWN_MS) return 0;
  return COOLDOWN_MS - elapsed;
}

client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on(Events.InteractionCreate, async interaction => {
  // Handle /generateaccount command
  if (interaction.isChatInputCommand() && interaction.commandName === 'generateaccount') {
    const existing = claimedAccounts[interaction.user.id];
    if (existing) {
      // User already has an account - show info instantly
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('You Already Have an Account!')
            .addFields(
              { name: 'Username', value: `\`${existing.username}\`` },
              { name: 'Password', value: `\`${existing.password}\`` }
            )
            .setColor(0x00ff00)
        ],
        ephemeral: true
      });
      return;
    }

    // Check cooldown (not strictly needed now, but keeps the code future-proof)
    const remaining = getRemainingCooldown(interaction.user.id);
    if (remaining > 0) {
      const hours = Math.floor(remaining / (60 * 60 * 1000));
      const mins = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('Cooldown')
            .setDescription(`You must wait **${hours}h ${mins}m** before generating another account.`)
            .setColor(0xff0000)
        ],
        ephemeral: true
      });
      return;
    }

    // Show button to actually generate
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('generate_account_btn')
        .setLabel('Generate Account')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle('Account Generator')
          .setDescription('Click the button below to generate your account.')
          .setColor(0x00b0f4)
      ],
      components: [row],
      ephemeral: true
    });
  }

  // Handle button interaction
  if (interaction.isButton() && interaction.customId === 'generate_account_btn') {
    // If user already has an account, show it instantly
    const existing = claimedAccounts[interaction.user.id];
    if (existing) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('You Already Have an Account!')
            .addFields(
              { name: 'Username', value: `\`${existing.username}\`` },
              { name: 'Password', value: `\`${existing.password}\`` }
            )
            .setColor(0x00ff00)
        ],
        ephemeral: true
      });
      return;
    }

    // Find an unclaimed account
    const usedUsernames = new Set(Object.values(claimedAccounts).map(acc => acc.username));
    const available = accounts.find(acc => !usedUsernames.has(acc.username));
    if (!available) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('Out of Accounts')
            .setDescription('No accounts left to claim! Please try again later.')
            .setColor(0xff0000)
        ],
        ephemeral: true
      });
      return;
    }

    // Show 'Generating...' embed and wait 5 seconds
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle('Generating Account...')
          .setDescription('Please wait while we generate your account.')
          .setColor(0xffcc00)
      ],
      ephemeral: true
    });

    setTimeout(async () => {
      claimedAccounts[interaction.user.id] = {
        username: available.username,
        password: available.password,
        time: Date.now()
      };
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle('Your Account')
            .addFields(
              { name: 'Username', value: `\`${available.username}\`` },
              { name: 'Password', value: `\`${available.password}\`` }
            )
            .setColor(0x00ff00)
        ],
        components: []
      });
    }, 5000);
  }
});

// Register commands on startup
async function registerCommands() {
  const commands = [
    new SlashCommandBuilder()
      .setName('generateaccount')
      .setDescription('Claim an unused account (username:password)')
  ].map(cmd => cmd.toJSON());

  const rest = new REST({ version: '10' }).setToken(TOKEN);
  try {
    console.log('Started refreshing application (/) commands.');
    const app = await client.application.fetch();
    await rest.put(Routes.applicationCommands(app.id), { body: commands });
    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
}

client.login(TOKEN).then(registerCommands);
