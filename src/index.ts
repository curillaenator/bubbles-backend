import "dotenv/config";
// import https from "https";
// import fs from "fs";
import express from "express";
import cors from "cors";
import TelegramBot, { Message } from "node-telegram-bot-api";
import { cert, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

import firebaseServiceAccount from "./firebase-service-account.json";

const WEB_APP_ORIGIN = process.env.WEB_APP_ORIGIN || "";
const TG_BOTNAME = process.env.TG_BOTNAME || "";
const BOT_TOKEN = process.env.BOT_TOKEN || "";
const FIREBASE_RTDB_URL = process.env.FIREBASE_RTDB_URL || "";

initializeApp({
  credential: cert(firebaseServiceAccount as ServiceAccount),
  databaseURL: FIREBASE_RTDB_URL,
});

const fsdb = getFirestore();
const app = express();

app.use(cors({ origin: process.env.WEB_APP_ORIGIN, methods: ["GET", "POST"] }));
// app.use(cors());
app.use(express.static("public"));
app.use(express.json());

const tgBot = new TelegramBot(BOT_TOKEN as string, { polling: true });

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
    fsdb
      .collection(`${TG_BOTNAME}chats`)
      .doc(`${msg.chat.id}`)
      .set(
        {
          msgId: msg.message_id,
          date: msg.date,
          ...msg.from,
        },
        { merge: true }
      );
  } catch (error) {
    console.error(error);
  }
});

app.get("/", (_req, res) => {
  res.status(200).send("Бот работает");
});

app.post("/bot-data", async (req, res) => {
  console.log("BOT_DATA", req.body);

  const { actionType, payload } = req.body;

  switch (actionType) {
    case "remind": {
      const { chats = [], message } = payload;

      chats.forEach((chatId: number | string) => {
        tgBot.sendMessage(chatId, message);
      });
      break;
    }
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

const PORT = process.env.PORT || 3000;

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
