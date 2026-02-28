import { messagingApi } from "@line/bot-sdk";

export const richMenuAArea: messagingApi.RichMenuArea[] = [
  {
    bounds: { x: 0, y: 0, width: 1250, height: 843 },
    action: { type: "message", text: "選擇主題" },
  },
  {
    bounds: { x: 1251, y: 0, width: 1250, height: 843 },
    action: { type: "message", text: "登入" },
  },
];
