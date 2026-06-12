import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data/store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const conversation = dataStore.getConversation(id);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }
  const messages = dataStore.getMessages(id);
  const asset = conversation.asset_id
    ? dataStore.getAsset(conversation.asset_id)
    : null;
  return NextResponse.json({ conversation, messages, asset });
}
