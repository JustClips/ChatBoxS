const { Client, GatewayIntentBits, Partials, Events, ButtonBuilder, ButtonStyle, ActionRowBuilder, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const noblox = require('noblox.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel]
});

const TOKEN = process.env.DISCORD_TOKEN;
const ROBLOX_ACCOUNTS = process.env.ROBLOX_ACCOUNTS || ''; // Should be cookies, one per line, optionally username:cookie

/**
 * Parse accounts from env.
 * Accepts either:
 *  username:cookie
 *  or just cookie per line.
 */
function parseAccounts(raw) {
  return raw
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(l => {
      const idx = l.indexOf(':');
      if (idx > 0) {
        return { username: l.slice(0, idx), cookie: l.slice(idx + 1) };
      }
      return { username: null, cookie: l };
    });
}

const accounts = parseAccounts(ROBLOX_ACCOUNTS);

/**
 * Track which users have claimed accounts
 * { discordUserId: { username, cookie } }
 */
const claimedAccounts = {};

client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'generateaccount') {
    // Check if user already claimed
    if (claimedAccounts[interaction.user.id]) {
      await interaction.reply({ content: "You've already claimed an account.", ephemeral: true });
      return;
    }

    // Find an unclaimed account
    const usedCookies = new Set(Object.values(claimedAccounts).map(acc => acc.cookie));
    const available = accounts.find(acc => !usedCookies.has(acc.cookie));
    if (!available) {
      await interaction.reply({ content: "No accounts left to claim!", ephemeral: true });
      return;
    }
    claimedAccounts[interaction.user.id] = available;

    let msg = `Here is your Roblox account cookie:\n\`${available.cookie}\``;
    if (available.username) msg = `Here is your Roblox account:\n**Username:** \`${available.username}\`\n**Cookie:** \`${available.cookie}\``;

    await interaction.reply({ content: msg, ephemeral: true });
  }

  if (interaction.commandName === 'followall') {
    // Simple admin check (replace with your admin logic if you want)
    if (!interaction.member.permissions.has('Administrator')) {
      await interaction.reply({ content: "You do not have permission to use this command.", ephemeral: true });
      return;
    }

    const robloxUsername = interaction.options.getString('username');
    await interaction.reply({ content: `Trying to follow **${robloxUsername}** with all accounts...`, ephemeral: true });

    // Get target userId
    let targetUserId;
    try {
      targetUserId = await noblox.getIdFromUsername(robloxUsername);
    } catch (e) {
      await interaction.editReply({ content: `User \`${robloxUsername}\` not found.` });
      return;
    }

    let success = 0, fail = 0, errors = [];
    for (const acc of accounts) {
      try {
        await noblox.setCookie(acc.cookie);
        await noblox.follow(targetUserId);
        success++;
      } catch (e) {
        fail++;
        errors.push(acc.username || acc.cookie.slice(0, 10) + '...' + `: ${e.message}`);
      }
    }
    let result = `Done!\n✅ ${success} succeeded, ❌ ${fail} failed.`;
    if (fail > 0) result += `\nErrors:\n${errors.slice(0, 5).join('\n')}${fail > 5 ? '\n...and more.' : ''}`;
    await interaction.followUp({ content: result, ephemeral: true });
  }
});

// Register commands on startup
async function registerCommands() {
  const commands = [
    new SlashCommandBuilder()
      .setName('generateaccount')
      .setDescription('Claim an unused Roblox account (gives cookie)'),
    new SlashCommandBuilder()
      .setName('followall')
      .setDescription('Follow a Roblox user with all accounts')
      .addStringOption(opt => opt.setName('username').setDescription('Roblox username to follow').setRequired(true))
  ].map(cmd => cmd.toJSON());

  const rest = new REST({ version: '10' }).setToken(TOKEN);
  try {
    console.log('Started refreshing application (/) commands.');
    await rest.put(Routes.applicationCommands((await client.application.fetch()).id), { body: commands });
    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
}

client.login(TOKEN).then(registerCommands);
