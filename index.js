require("dotenv").config();

const https = require("https");
const fs = require("fs");
const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const cors = require("cors");

const port = process.env.PORT || 3000;
const botToken = process.env.BOT_TOKEN;
const frontendUrl = process.env.FRONTEND_URL;

const app = express();

app.use(cors());
app.use(express.static("public"));
app.use(express.json());

const tgBot = new TelegramBot(botToken, { polling: true });

tgBot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  tgBot.sendMessage(chatId, "Открой приложение:", {
    reply_markup: {
      keyboard: [
        [{ text: "Открыть приложение", web_app: { url: frontendUrl } }],
      ],
      resize_keyboard: true,
    },
  });
});

app.get("/health-check", (req, res) => {
  res.status(200).send("Бот работает");
});

app.post("/bot-data", async (req, res) => {
  const { queryId, content, clientSupport } = req.body;

  try {
    tgBot.answerWebAppQuery(queryId, {
      id: queryId,
      type: "article",
      title: "Success!",
      input_message_content: { message_text: `${content}\n\n${clientSupport}` },
    });

    return res.status(200).json({});
  } catch (error) {
    tgBot.answerWebAppQuery(queryId, {
      type: "article",
      id: queryId,
      title: "Error!",
      input_message_content: { message_text: "Something went wrong" },
    });

    return res.status(500).json({});
  }
});

https
  .createServer(
    {
      key: fs.readFileSync("key.pem"),
      cert: fs.readFileSync("cert.pem"),
    },
    app
  )
  .listen(port, () => console.log(`server is up on port ${port}`));
