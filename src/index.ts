// Make sure to import environment variables at the very beginning
import "./lib/env";

import { middleware, webhook } from "@line/bot-sdk";
import cors from "cors";
import express from "express";
import path from "path";
import { corsOptions } from "./constants/corsOptions";
import morgan from "morgan";
import { sendPushMessage } from "./lib/sendPushMessage";
import { InMemoryDb } from "./lib/inMemoryDb";
import { Time } from "./constants";
import { handleTextMessage } from "./handler/textMessage";
import { handleJoin } from "./handler/join";
import { handleTopicSelection } from "./handler/quickReply";
import { getTopicByKey } from "./lib/topic";

// create LINE SDK config from env variables
const lineMiddleware = middleware({
  channelSecret: process.env.LINE_CHANNEL_SECRET!,
});

console.log(process.env.NODE_ENV);
console.log(process.env.LINE_CHANNEL_SECRET);

// create Express app
// about Express itself: https://expressjs.com/
const app = express(); // Use the cors middleware

// For demo: in-memory store.
// In production: Redis or DB table keyed by userId.
const userState = new InMemoryDb<{ topic: string }>();

// register a webhook handler with middleware
// about the middleware, please refer to doc
app.post("/api/callback", lineMiddleware, (req, res) => {
  console.log("Received events:", req.body.events);
  Promise.all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

app.use("/api", express.json());
app.use("/api", cors(corsOptions));
app.use("/api", morgan("dev"));

app.get("/api/test", (req, res) => {
  res.json({ result: "success" });
});

app.post("/api/entry", async (req, res) => {
  const { userId, topic } = req.body;
  console.table({ userId, topic });

  if (!userId || !topic) {
    return res.status(400).json({ ok: false, error: "Missing userId/topic" });
  }

  userState.set(userId, { topic }, { ttlMs: Time.oneHour * 3 });
  sendPushMessage({ userId, message: `你已進入主題: ${topic}` });

  return res.json({ ok: true });
});

// The type of `event` is `line.messagingApi.WebhookEvent` from the @line/bot-sdk package.
async function handleEvent(event: webhook.Event) {
  if (event.type === "join" || event.type === "follow")
    return handleJoin({ replyToken: event.replyToken });

  if (event.type === "message" && event.message.type === "text") {
    const userId = event.source?.userId;
    if (!userId) return Promise.resolve(null);

    if (event.message.text === "登入") {
      return handleTextMessage({
        text: "此功能尚未開發，敬請期待！",
        replyToken: event.replyToken,
      });
    } else if (event.message.text === "選擇主題") {
      return handleTopicSelection({ replyToken: event.replyToken });
    }

    const currentTopicKey = userState.get(userId)?.topic;

    if (!currentTopicKey) {
      return handleTextMessage({
        text: "您好！請先點擊下方選單「選擇主題」來選擇您感興趣的主題，才能開始聊天喔！",
        replyToken: event.replyToken,
      });
    } else {
      return handleTextMessage({
        text: `您在主題「${getTopicByKey(currentTopicKey)?.label}」中說: ${event.message.text}`,
        replyToken: event.replyToken,
      });
    }
  }

  if (event.type === "postback") {
    if (event.postback.data.startsWith("user_select_topic:")) {
      const userId = event.source?.userId;
      if (!userId) return Promise.resolve(null);
      const selectedTopicKey = event.postback.data.split(":")[1];
      userState.set(
        userId,
        { topic: selectedTopicKey },
        { ttlMs: Time.oneHour * 3 },
      );
      return handleTextMessage({
        text: `你已選擇主題: ${getTopicByKey(selectedTopicKey)?.label}`,
        replyToken: event.replyToken,
      });
    }
  }

  return Promise.resolve(null);
}

// Set static folder
// app.use(express.static(__dirname + "/../liff/"));
app.use(express.static(path.join(__dirname, "../liff")));

// Handle SPA
// app.get(/.*/, (_, res) => res.sendFile(__dirname + "/../liff/index.html"));
app.get(/.*/, (_, res) =>
  res.sendFile(path.join(__dirname, "../liff/index.html")),
);

// listen on port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});
