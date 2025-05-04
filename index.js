require("dotenv").config();

const firebaseAdmin = require("firebase-admin");
const firebaseServiceAccount = require("./firebase-service-account.json");

// const https = require("https");
// const fs = require("fs");
const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const cors = require("cors");

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const WEB_APP_ORIGIN = process.env.WEB_APP_ORIGIN;
const TG_BOTNAME = process.env.TG_BOTNAME;

firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(firebaseServiceAccount),
  databaseURL:
    "https://art-app-2020-default-rtdb.europe-west1.firebasedatabase.app",
});

const fsdb = firebaseAdmin.firestore();
const app = express();

// app.use(cors({ origin: WEB_APP_ORIGIN, methods: ["GET", "POST"] }));
app.use(cors());

app.use(express.static("public"));
app.use(express.json());

const tgBot = new TelegramBot(BOT_TOKEN, { polling: true });

tgBot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  tgBot.sendMessage(chatId, "Please click Start App", {
    reply_markup: {
      keyboard: [
        [
          {
            text: "Start App",
            web_app: {
              url: `${WEB_APP_ORIGIN}?botname=${TG_BOTNAME}&stamp=${chatId}`,
            },
          },
        ],
      ],
      resize_keyboard: true,
    },
  });

  try {
    const chatId = msg.chat.id;

    const payload = {
      msgId: msg.message_id,
      chat: msg.chat,
      from: msg.from,
      date: msg.date,
    };

    fsdb
      .collection(`${TG_BOTNAME}chats`)
      .doc(`${chatId}`)
      .set(payload, { merge: true })
      .then(() => payload);
  } catch (error) {
    console.error(error);
  }
});

app.get("/", (req, res) => {
  res.status(200).send("Бот работает");
});

app.post("/bot-data", async (req, res) => {
  console.log("BOT_DATA", req.body);

  const { actionType, payload } = req.body;

  switch (actionType) {
    case "remind":
      const { chats = [], message } = payload;

      chats.forEach((chatId) => tgBot.sendMessage(chatId, message));

      tgBot.sendMessage();
      break;

    default:
      break;
  }

  // try {
  //   tgBot.answerWebAppQuery(queryId, {
  //     id: queryId,
  //     type: "article",
  //     title: "Success!",
  //     input_message_content: { message_text: `${content}\n\n${clientSupport}` },
  //   });

  //   return res.status(200).json({});
  // } catch (error) {
  //   console.error("AnswerWebAppQuery error:", error);

  //   tgBot.answerWebAppQuery(queryId, {
  //     type: "article",
  //     id: queryId,
  //     title: "Error!",
  //     input_message_content: { message_text: "Something went wrong" },
  //   });

  //   return res.status(500).json({});
  // }
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
