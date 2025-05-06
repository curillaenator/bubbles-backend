import "dotenv/config";
// import https from "https";
// import fs from "fs";
import express from "express";
import cors from "cors";
import TelegramBot from "node-telegram-bot-api";
import { cert, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

import firebaseServiceAccount from "./firebase-service-account.json";

import type { BotDataReqBody, SendAllChatsPayload } from "./interfaces";

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
  const { actionType } = req.body as BotDataReqBody;

  switch (actionType) {
    case "send-to-all": {
      const { chats = [], message } = (
        req.body as BotDataReqBody<SendAllChatsPayload>
      ).payload;

      chats.forEach(({ id }) => {
        console.log("MESSAGE SENT", id);
        tgBot.sendMessage(id, message);
      });

      res.status(200).send("ok");
      break;
    }
    default:
      break;
  }
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
