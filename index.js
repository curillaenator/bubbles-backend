require("dotenv").config();

const https = require("https");
const fs = require("fs");
const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const cors = require("cors");

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const WEB_APP_URL = process.env.FRONTEND_URL;

const app = express();

app.use(cors({ origin: WEB_APP_URL, methods: ["GET", "POST"] }));
app.use(express.static("public"));
app.use(express.json());

const tgBot = new TelegramBot(BOT_TOKEN, { polling: true });

tgBot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  tgBot.sendMessage(chatId, "Please click Dive to continue 👽", {
    reply_markup: {
      keyboard: [[{ text: "Dive", web_app: { url: WEB_APP_URL } }]],
      resize_keyboard: true,
    },
  });
});

app.get("/", (req, res) => {
  res.status(200).send("Бот работает");
});

app.post("/bot-data", async (req, res) => {
  const { queryId, content, clientSupport } = req.body;

  if (!queryId || !content || !clientSupport) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    tgBot.answerWebAppQuery(queryId, {
      id: queryId,
      type: "article",
      title: "Success!",
      input_message_content: { message_text: `${content}\n\n${clientSupport}` },
    });

    return res.status(200).json({});
  } catch (error) {
    console.error("AnswerWebAppQuery error:", error);

    tgBot.answerWebAppQuery(queryId, {
      type: "article",
      id: queryId,
      title: "Error!",
      input_message_content: { message_text: "Something went wrong" },
    });

    return res.status(500).json({});
  }
});

app.listen(PORT, () => {
  console.log(`Backend работает на http://localhost:${PORT}`);
});

// https
//   .createServer(
//     {
//       key: fs.readFileSync("key.pem"),
//       cert: fs.readFileSync("cert.pem"),
//     },
//     app
//   )
//   .listen(PORT, () => console.log(`server is up on port ${PORT}`));
