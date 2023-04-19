const assert = require('assert').strict
require('log-timestamp');
const TelegramBot = require('node-telegram-bot-api');
const CronJob = require("cron").CronJob;

const token = process.env.TOKEN;
const groupChatId = process.env.CHAT_ID;

assert.ok(token, 'TOKEN env variable is required');
assert.ok(groupChatId, 'CHAT_ID env variable is required');

var lastDatePlayed;

const bot = new TelegramBot(token, {polling: true});
console.log('Connected telegram bot polling')

bot.on('callback_query', cq => {
  if (cq.data === 'snooze') {
    lastDatePlayed = getDate();
    console.log(`Snooze button clicked, last date played reset to ${lastDatePlayed}`);

    var editMessageOptions = { chat_id: groupChatId, message_id: cq.message.message_id, inline_message_id: cq.id };
    bot.editMessageReplyMarkup({ inline_keyboard: [] }, editMessageOptions);
    bot.editMessageText('Reminders snoozed for today.', editMessageOptions)
  }
});

bot.onText(/Wordle \d{3}/, (msg) => {
  if (msg.chat.id != groupChatId) {
    console.log(`Received matching message on unexpected chat [ChatId: ${msg.chat.id}]`);
    return;
  }

  lastDatePlayed = getDate();
  console.log(`Wordle score received, last date played reset to ${lastDatePlayed}`);
  bot.sendMessage(groupChatId, 'Well done! Reminders will resume tomorrow.', { reply_to_message_id: msg.id });
});

// “At minute 0 past hour 0 and every hour from 12 through 23.”
new CronJob(
	'0 0,12-23 * * *',
	() => processReminder(),
	null,
	true,
	'Europe/London',
  null,
  true
);

async function processReminder() {
  if (lastDatePlayed !== getDate()) {
    bot.sendMessage(groupChatId, 'Reminder! Confirm your Wordle score for today.', { reply_markup: { inline_keyboard: [[ { text: 'Snooze For Today', callback_data: 'snooze' } ]] } });
    console.log('Reminder sent');
  }
};

function getDate() {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/London' }));
  return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
}