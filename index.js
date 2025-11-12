// ✅ 1️⃣ Importuri
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');
const express = require('express');

// ✅ 2️⃣ Server Express pentru keep-alive
const app = express();
const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => res.send("Bot is alive ✅"));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// ✅ 3️⃣ Client Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const TOKEN = process.env.DISCORD_BOT_TOKEN;

// ✅ 4️⃣ Funcții utile
function formatNumber(num) { return num?.toLocaleString() || "0"; }
function formatDuration(ms) {
  let sec = Math.floor(ms / 1000);
  let min = Math.floor(sec / 60);
  let hr = Math.floor(min / 60);
  sec %= 60; min %= 60;
  return `${hr}h ${min}m ${sec}s`;
}

// ✅ 5️⃣ Config Monitorizare Site
let lastUpTime = null;
let lastStatus = null;
const STATUS_CHANNEL_ID = "1437881455534674001";
const MAIN_SITE_URL = "https://www.logged.tg/auth/corrupteds";
const MAIN_SITE_NAME = "MAIN SITE STATUS";

// ✅ 6️⃣ Monitorizare automată la 30 secunde
setInterval(async () => {
  try {
    const start = Date.now();
    let res, ping;

    try {
      const response = await fetch(MAIN_SITE_URL, { timeout: 8000 });
      res = { ok: response.ok, status: response.status };
      ping = Date.now() - start;
    } catch {
      res = { ok: false, status: 0 };
      ping = null;
    }

    const currentStatus = res.ok ? "UP" : "DOWN";
    if (res.ok && !lastUpTime) lastUpTime = Date.now();
    if (!res.ok) lastUpTime = null;

    if (currentStatus !== lastStatus) {
      const channel = await client.channels.fetch(STATUS_CHANNEL_ID).catch(() => null);
      if (channel) {
        const statusText = res.ok
          ? " MAIN SITE IS UP!"
          : " ⚠️ MAIN SITE IS DOWN!";

        const embed = new EmbedBuilder()
          .setColor(0x000000)
          .setThumbnail("https://cdn.discordapp.com/emojis/1438164171127652413.gif")
          .setDescription(
            `-- <a:emoji_6:1438247084959465534> **EXECLAVES BOT** <a:emoji_6:1438247084959465534> --\n\n` +
            `<:emoji_4:1438182484096450623>  STATUS: ${currentStatus}\n` +
            `<a:emoji_3:1438164977797304410> RESPONSE CODE: ${res.status}\n` +
            `<a:emoji_3:1438164977797304410> RESPONSE TIME: ${ping ? ping + "ms" : "N/A"}`
          )
          .setImage("https://i.imgur.com/keaieLU.gif")
          .setFooter({ text: "EXECLAVES Site Monitor" });

        await channel.send({ content: statusText, embeds: [embed] });
      }
      lastStatus = currentStatus;
    }
  } catch (err) {
    console.error("Error checking site:", err);
  }
}, 30000);

// ✅ 7️⃣ Comenzi
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const args = message.content.split(" ").slice(1);
  const targetUser = message.mentions.users.first() || message.author;
  const targetId = targetUser.id;

  // ⚙️ !stats
  if (message.content.startsWith("!stats")) {
    try {
      const res = await fetch(`https://api.injuries.lu/v1/public/user?userId=${targetId}`);
      const data = await res.json();
      if (!data.success || !data.Normal) return message.reply("❌ No stats found for this user.");

      const normal = data.Normal;
      const profile = data.Profile || {};
      const userName = profile.userName || targetUser.username;

      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .setDescription(
          `-- <a:emoji_6:1438247084959465534>**EXECLAVES STATS**<a:emoji_6:1438247084959465534> --\n\n` +
          `<a:emoji_3:1438164977797304410> **User:** ${userName}\n\n` +
          `<a:emoji_3:1438164977797304410> **TOTAL STATS:**\n` +
       <a:emoji_3:1438164977797304410> **TOTAL STATS:**\n` +
       `Hits: ${formatNumber(normal.Totals?.Accounts)}\n` +
       `Summary: ${formatNumber(normal.Totals?.Summary)}\n` +
       `RAP: ${formatNumber(normal.Totals?.Rap)}\n` +
       `Clicks: ${formatNumber(normal.Totals?.Clicks)}\n\n` +
          `<a:emoji_3:1438164977797304410> **BIGGEST HIT:**\n` +
          `Robux: ${formatNumber(normal.Highest?.Balance)}\n` +
          `Summary: ${formatNumber(normal.Highest?.Summary)}\n` +
          `RAP: ${formatNumber(normal.Highest?.Rap)}\n\n` +
          `──────\n\n` +
          `<a:emoji_3:1438164977797304410> **TOTAL HIT STATS:**\n` +
          `Summary: ${formatNumber(normal.Totals?.Summary)}\n` +
          `RAP: ${formatNumber(normal.Totals?.Rap)}\n` +
          `Robux: ${formatNumber(normal.Totals?.Balance)}`
        )
        .setImage("https://i.imgur.com/keaieLU.gif")
        .setFooter({ text: "EXECLAVES Stats Bot" });

      await message.channel.send({ embeds: [embed] });
    } catch (err) {
      console.error("Error fetching stats:", err);
      message.reply("❌ Error fetching stats.");
    }
  }

  // ⚙️ !daily
  if (message.content.startsWith("!daily")) {
    try {
      const res = await fetch(`https://api.injuries.lu/v2/daily?type=0x2&cs=3&ref=nexus&userId=${targetId}`);
      const data = await res.json();
      if (!data.success) return message.reply("❌ No daily stats available.");

      const daily = data.Daily || data.Normal;
      const profile = data.Profile || {};
      const userName = profile.userName || targetUser.username;

      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .setDescription(
          `-- <a:emoji_6:1438247084959465534> **EXECLAVES**<a:emoji_6:1438247084959465534>  --\n\n` +
          `<a:emoji_3:1438164977797304410> **User:** ${userName}\n\n` +
          `<a:5228_Seta:1438177992168968343> **DAILY STATS:**\n` +
          `Hits: ${formatNumber(daily.Totals?.Accounts)}\n` +
          `Summary: ${formatNumber(daily.Totals?.Summary)}\n` +
          `RAP: ${formatNumber(daily.Totals?.Rap)}\n\n` +
          `──────\n\n` +
          `<a:emoji_3:1438164977797304410> **BIGGEST HIT:**\n` +
          `Robux: ${formatNumber(daily.Highest?.Balance)}\n` +
          `Summary: ${formatNumber(daily.Highest?.Summary)}\n` +
          `RAP: ${formatNumber(daily.Highest?.Rap)}\n\n` +
          `──────\n\n` +
          `<a:emoji_3:1438164977797304410> **TOTAL HIT STATS:**\n` +
          `Summary: ${formatNumber(daily.Totals?.Summary)}\n` +
          `RAP: ${formatNumber(daily.Totals?.Rap)}\n` +
          `Robux: ${formatNumber(daily.Totals?.Balance)}`
        )
        .setImage("https://i.imgur.com/keaieLU.gif")
        .setFooter({ text: "EXECLAVES Daily Stats" });

      await message.channel.send({ embeds: [embed] });
    } catch (err) {
      console.error("Error fetching daily stats:", err);
      message.reply("❌ Error fetching daily stats.");
    }
  }

  // ⚙️ !check
  if (message.content.startsWith("!check")) {
    try {
      const start = Date.now();
      let res, ping;

      try {
        const response = await fetch(MAIN_SITE_URL, { timeout: 8000 });
        res = { ok: response.ok, status: response.status };
        ping = Date.now() - start;
      } catch {
        res = { ok: false, status: 0 };
        ping = null;
      }

      const statusText = res.ok ? " ONLINE ✅" : "OFFLINE ❌";
      const uptimeText = res.ok && lastUpTime
        ? `UP for ${formatDuration(Date.now() - lastUpTime)}`
        : "❌ No uptime data";

      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setThumbnail("https://cdn.discordapp.com/emojis/1438164171127652413.gif") // ✅ corect
        .setDescription(
          `-- <a:emoji_6:1438247084959465534> **EXECLAVES** <a:emoji_6:1438247084959465534> --\n\n` +
          `<a:emoji_3:1438164977797304410> **${MAIN_SITE_NAME}**\n` +
          `<:emoji_4:1438182484096450623> STATUS: ${statusText}\n` +
          `<a:emoji_3:1438164977797304410> RESPONSE CODE: ${res.status}\n` +
          `<a:emoji_3:1438164977797304410> UPTIME: ${uptimeText}\n` +
          `<a:emoji_3:1438164977797304410> RESPONSE TIME: ${ping ? ping + "ms" : "N/A"}`
        )
        .setImage("https://i.imgur.com/keaieLU.gif")
        .setFooter({ text: "EXECLAVES Site Monitor" });

      await message.channel.send({ embeds: [embed] });
    } catch (err) {
      console.error("!check error:", err);
      message.reply("⚠️ The site appears to be DOWN or unreachable.");
    }
  }
});

// ✅ 8️⃣ Login
if (!TOKEN) {
  console.error("❌ DISCORD_BOT_TOKEN missing!");
  process.exit(1);
}
client.login(TOKEN);
