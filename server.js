import 'dotenv/config';
import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

// ====== ENV ======
const BOT_TOKEN = process.env.BOT_TOKEN;

// ====== BASIC CHECK ======
app.get('/', (req, res) => {
  res.send('TON Vault backend is running');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// ====== WEBHOOK ======
app.post('/webhook', async (req, res) => {
  try {
    const update = req.body;

    // ====== STARS PAYMENT SUCCESS ======
    if (update.message?.successful_payment) {
      const payment = update.message.successful_payment;
      const chatId = update.message.chat.id;
      const payload = payment.invoice_payload;

      console.log('✅ Stars payment success:', payload);

      await sendMessage(
        chatId,
        `✅ Платіж успішний!\nОтримано: ${payload}`
      );

      // 🔜 ТУТ ПІЗНІШЕ:
      // - видати VIP
      // - нарахувати буст
      // - записати в БД

      return res.send('ok');
    }

    // ====== TEXT COMMANDS ======
    const msg = update.message;
    if (msg?.text) {
      const chatId = msg.chat.id;
      const text = msg.text.trim();

      if (text === '/start') {
        await sendMessage(
          chatId,
          '🚀 TON Vault\n\nКоманди:\n/start\n/help\n/about\n/game'
        );
      } 
      else if (text === '/help') {
        await sendMessage(
          chatId,
          'ℹ️ Допомога\n\nЦе TON Vault Clicker'
        );
      } 
      else if (text === '/about') {
        await sendMessage(
          chatId,
          'TON Vault — Telegram WebApp + Stars'
        );
      } 
      else if (text === '/game') {
        await sendMessage(
          chatId,
          '🎮 Гра скоро буде доступна'
        );
      } 
      else {
        await sendMessage(
          chatId,
          '👀 Я бачу твоє повідомлення'
        );
      }
    }

    res.sendStatus(200);
  } catch (e) {
    console.error('Webhook error:', e);
    res.sendStatus(200);
  }
});

// ====== SEND MESSAGE ======
async function sendMessage(chatId, text) {
  if (!BOT_TOKEN) {
    console.log('❌ BOT_TOKEN missing');
    return;
  }

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text
    })
  });
}

// ====== START SERVER ======
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server started on port ${PORT}`);
});
