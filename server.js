import express from "express";

const app = express();
app.use(express.json());

// Візьми токен бота в BotFather -> /token
const BOT_TOKEN = process.env.BOT_TOKEN;

// Перевірка що сервер живий
app.get("/", (req, res) => {
  res.status(200).send("TON Mriya server is running ✅");
});

// Telegram webhook endpoint
app.post("/webhook", async (req, res) => {
  try {
    const update = req.body;

    // Якщо це повідомлення
    const msg = update.message;
    if (msg?.text) {
      const chatId = msg.chat.id;
      const text = msg.text.trim();

      if (text === "/start") {
        await sendMessage(chatId, "TON Mriya — це шлях. Напиши /help ✅");
      } else if (text === "/help") {
        await sendMessage(
          chatId,
          "Команди:\n/start — Почати\n/about — Про TON Mriya\n/game — Запустити TON Vault\n/roadmap — План розвитку"
        );
      } else if (text === "/about") {
        await sendMessage(chatId, "TON Mriya — шлях, а не швидкі гроші. Дисципліна. Витримка. Рух уперед.");
      } else if (text === "/roadmap") {
        await sendMessage(chatId, "Roadmap:\n1) Бот працює ✅\n2) Меню + кнопки\n3) WebApp TON Vault\n4) Stars / монетизація");
      } else if (text === "/game") {
        await sendMessage(chatId, "Скоро буде кнопка на TON Vault WebApp 🚀");
      } else {
        await sendMessage(chatId, "Я бачу ✅ Напиши /help");
      }
    }

    res.sendStatus(200);
  } catch (e) {
    console.error("Webhook error:", e);
    res.sendStatus(200);
  }
});

async function sendMessage(chatId, text) {
  if (!BOT_TOKEN) {
    console.log("❌ Missing BOT_TOKEN env");
    return;
  }

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text })
  });
}

// Render/Heroku люблять PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server started on port", PORT));
