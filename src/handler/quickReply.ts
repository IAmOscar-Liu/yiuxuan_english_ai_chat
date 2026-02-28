import { messagingApi } from "@line/bot-sdk";
import client from "../lib/client";
import { getTopicByKey } from "../lib/topic";

export function handleTopicSelection({ replyToken }: { replyToken?: string }) {
  if (!replyToken) return Promise.resolve(null);

  const templateMessage: messagingApi.Message = {
    type: "text",
    text: "請選擇主題",
    quickReply: {
      items: [
        {
          type: "action",
          action: {
            type: "postback",
            label: getTopicByKey("family")!.label,
            data: `user_select_topic:family`,
          },
        },
        {
          type: "action",
          action: {
            type: "postback",
            label: getTopicByKey("work")!.label,
            data: `user_select_topic:work`,
          },
        },
        {
          type: "action",
          action: {
            type: "postback",
            label: getTopicByKey("study")!.label,
            data: `user_select_topic:study`,
          },
        },
        {
          type: "action",
          action: {
            type: "postback",
            label: getTopicByKey("hobby")!.label,
            data: `user_select_topic:hobby`,
          },
        },
      ],
    },
  };

  return client.replyMessage({
    replyToken,
    messages: [templateMessage],
  });
}
