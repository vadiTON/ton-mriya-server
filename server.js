import "dotenv/config";
import express from "express";

const app = express();
app.use(express.json());

// ENV
const BOT_TOKEN = process.env.BOT_TOKEN;         // <-- ставиш в Render/Replit Secrets
const PUBLIC_URL = process.env.PUBLIC_URL;       // напр: https://ton-mriya-server.onrender.com
const PROVIDER_TOKEN = process.env.PROVIDER_TOKEN; // для Stars можна залишити порожнім або ""

// Render/Heroku port
const PORT = process.env.PORT || 3000;

if (!BOT_TOKEN) {
  console.log("❌ BOT_TOKEN is missing. Add BOT_TOKEN env.");
}

// --------------------
// Health endpoints
// --------------------
app.get("/", (req, res) => res.status(200).send("TON Mriya server is running ✅"));
app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));

// --------------------
// Telegram Webhook
// --------------------
app.post("/webhook", async (req, res) => {
  try {
    const update = req.body;

    // ✅ 1) Stars: підтвердження pre_checkout_query (ОБОВʼЯЗКОВО)
    if (update.pre_checkout_query) {
      const q = update.pre_checkout_query;

      await apiCall("answerPreCheckoutQuery", {
        pre_checkout_query_id: q.id,
        ok: true,
      });

      return res.send("ok");
    }

    // ✅ 2) Stars: успішний платіж
    if (update.message?.successful_payment) {
      const chatId = update.message.chat.id;
      const payment = update.message.successful_payment;

      const payload = payment.invoice_payload; // напр: "vip_30_days"
      const total = payment.total_amount;      // в "найменших одиницях" Stars
      const currency = payment.currency;       // "XTR"

      console.log("✅ Successful payment:", { payload, total, currency });

      // Тут потім додаси: видати VIP / записати в БД
      await sendMessage(chatId, `✅ Платіж успішний!\nТариф: ${payload}\nСума: ${total} ${currency}`);

      return res.send("ok");
    }

    // ✅ 3) Текстові повідомлення
    const msg = update.message;

    if (msg?.text) {
      const chatId = msg.chat.id;
      const text = msg.text.trim();

      if (text === "/start") {
        await sendMessage(
          chatId,
          "TON Mriya 🚀\n\nКоманди:\n/help — допомога\n/buy_vip — купити VIP (Stars тест)"
        );
      } else if (text === "/help") {
        await sendMessage(
          chatId,
          "Команди:\n/start — Почати\n/buy_vip — інвойс Stars\n/webhookset — підказка по вебхуку"
        );
      } else if (text === "/webhookset") {
        await sendMessage(
          chatId,
          `Твій webhook URL має бути:\n${PUBLIC_URL ? PUBLIC_URL : "https://<твій-домен>"}\/webhook`
        );
      } else if (text === "/buy_vip") {
        // 🔥 Тест інвойсу Stars
        // payload: те, що ти потім будеш обробляти в successful_payment
        await sendStarsInvoice(chatId, {
          title: "VIP 30 days",
          description: "VIP доступ на 30 днів",
          payload: "vip_30_days",
          amountStars: 50, // ⭐ ціна (зміниш як треба)
        });
      } else {
        await sendMessage(chatId, "Я бачу 👀 Напиши /help");
      }
    }

    return res.send("ok");
  } catch (e) {
    console.error("Webhook error:", e);
    return res.send("ok");
  }
});

// --------------------
// Telegram helpers
// --------------------
async function apiCall(method, data) {
  if (!BOT_TOKEN) return null;

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const json = await r.json().catch(() => ({}));
  if (!json.ok) console.log("❌ Telegram API error:", method, json);
  return json;
}

async function sendMessage(chatId, text) {
  return apiCall("sendMessage", { chat_id: chatId, text });
}

// Stars invoice (XTR)
async function sendStarsInvoice(chatId, { title, description, payload, amountStars }) {
  // Для Stars валюта: XTR
  // prices: масив з одним елементом (label + amount)
  return apiCall("sendInvoice", {
    chat_id: chatId,
    title,
    description,
    payload,
    provider_token: PROVIDER_TOKEN || "", // для XTR часто можна порожньо
    currency: "XTR",
    prices: [{ label: title, amount: amountStars }],
    start_parameter: "vip",
  });
}

// --------------------
// Start
// --------------------
app.listen(PORT, () => {
  console.log(`✅ Server started on port ${PORT}`);
  if (PUBLIC_URL) console.log("PUBLIC_URL:", PUBLIC_URL);
});
