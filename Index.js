const express = require('express');
const cron = require('node-cron');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Replace with your Telegram bot token
const BOT_TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN';
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Store user subscriptions (in-memory for simplicity)
const subscribers = new Set();

// Command to subscribe to reminders
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  subscribers.add(chatId);
  bot.sendMessage(chatId, 'You have subscribed to Ramadan reminders! 🌙');
});

// Command to unsubscribe from reminders
bot.onText(/\/stop/, (msg) => {
  const chatId = msg.chat.id;
  subscribers.delete(chatId);
  bot.sendMessage(chatId, 'You have unsubscribed from Ramadan reminders. 😢');
});

// Fetch Suhoor and Iftar times
async function getPrayerTimes(city) {
  try {
    const response = await axios.get(
      `https://api.aladhan.com/v1/timingsByCity?city=${city}&country=SA&method=2`
    );
    const timings = response.data.data.timings;
    return {
      suhoor: timings.Fajr,
      iftar: timings.Maghrib,
    };
  } catch (error) {
    console.error('Error fetching prayer times:', error);
    return null;
  }
}

// Send daily reminders
cron.schedule('0 5 * * *', async () => {
  const prayerTimes = await getPrayerTimes('Mecca'); // Replace with user's city
  if (!prayerTimes) return;

  for (const chatId of subscribers) {
    bot.sendMessage(
      chatId,
      `🌙 *Suhoor Reminder* 🌙\n\n` +
        `Today's Suhoor ends at *${prayerTimes.suhoor}*.\n` +
        `Prepare for a blessed day of fasting!`,
      { parse_mode: 'Markdown' }
    );
  }
});

cron.schedule('0 18 * * *', async () => {
  const prayerTimes = await getPrayerTimes('Mecca'); // Replace with user's city
  if (!prayerTimes) return;

  for (const chatId of subscribers) {
    bot.sendMessage(
      chatId,
      `🌙 *Iftar Reminder* 🌙\n\n` +
        `Today's Iftar is at *${prayerTimes.iftar}*.\n` +
        `May your fast be accepted!`,
      { parse_mode: 'Markdown' }
    );
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});