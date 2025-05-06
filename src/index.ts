import "dotenv/config";
// import https from "https";
// import fs from "fs";
import express from "express";
import cors from "cors";
import TelegramBot, { ChatId } from "node-telegram-bot-api";
import { cert, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

import { getOrderMessage, getReplyMessage } from "./utils";

import firebaseServiceAccount from "./firebase-service-account.json";

import type {
  TgChatMeta,
  BotDataReqBody,
  SendAllChatsPayload,
  ApplicationPayload,
} from "./interfaces";

const WEB_APP_ORIGIN = process.env.WEB_APP_ORIGIN || "";
const TG_BOTNAME = process.env.TG_BOTNAME || "";
const BOT_TOKEN = process.env.BOT_TOKEN || "";
const FIREBASE_RTDB_URL = process.env.FIREBASE_RTDB_URL || "";

initializeApp({
  credential: cert(firebaseServiceAccount as ServiceAccount),
  databaseURL: FIREBASE_RTDB_URL,
});

const tgBot = new TelegramBot(BOT_TOKEN as string, { polling: true });
const fsdb = getFirestore();
const app = express();

app.use(cors({ origin: process.env.WEB_APP_ORIGIN, methods: ["GET", "POST"] }));
app.use(express.static("public"));
app.use(express.json());

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
  try {
    const { actionType } = req.body as BotDataReqBody;

    switch (actionType) {
      case "send-to-all": {
        const { chats = [], message } = (
          req.body as BotDataReqBody<SendAllChatsPayload>
        ).payload;

        chats.forEach(({ id }) => tgBot.sendMessage(id, message));

        console.log("MESSAGES SENT");

        res.status(200).json({ status: "ok" });
        break;
      }

      case "send-application": {
        const { uid, chatId, botname, application } = (
          req.body as BotDataReqBody<ApplicationPayload>
        ).payload;

        const promises = [
          fsdb
            .collection(`${botname}chats`)
            .doc(chatId)
            .get()
            .then((snap) => (snap.exists ? (snap.data() as TgChatMeta) : null)),

          fsdb
            .collection("users")
            .doc(uid)
            .get()
            .then((snap) =>
              snap.exists
                ? (snap.data() as { chatId: ChatId; telegram: string })
                : null
            ),
        ];

        const [chatMeta, botOwner] = (await Promise.all(promises)) as [
          TgChatMeta | null,
          { chatId: ChatId; telegram: string } | null
        ];

        if (!chatMeta || !botOwner) {
          return res
            .status(500)
            .json({ status: "fail", message: "cannot place application" });
        }

        await tgBot.sendMessage(
          botOwner.chatId,
          getOrderMessage(chatMeta, application)
        );

        await tgBot.sendMessage(
          chatMeta.id,
          getReplyMessage(botOwner.telegram)
        );

        return res.status(200).json({ status: "ok" });
      }

      default: {
        return res
          .status(400)
          .json({ message: `failed actionType ${actionType}` });
      }
    }
  } catch (error) {
    console.error("Internal error:", error);
    return res.status(500).json({ message: "Internal server error" });
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
