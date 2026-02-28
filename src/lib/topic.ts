export type Topic = { label: string };

const topics: Record<string, Topic> = {
  family: { label: "家庭" },
  work: { label: "工作" },
  study: { label: "學業" },
  hobby: { label: "興趣" },
};

export function getTopicByKey(key: string): Topic | undefined {
  return topics[key];
}
