export interface RecentChat {
  id: number;
  name: string;
  type: "private" | "group";
  lastMessage: {
    content: string;
    createdAt: Date;
    senderNickname: string;
  } | null;
}
