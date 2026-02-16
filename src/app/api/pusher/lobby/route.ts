import { NextResponse } from 'next/server';
import Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

export async function POST(req: Request) {
  try {
    const { roomId, event, data } = await req.json();
    
    // 🌟 event จะมี 3 แบบ: 'player-sync' (คนเข้า/ออก/ready), 'lobby-chat' (คุยกัน), 'start-game' (โฮสต์กดเริ่ม)
    await pusher.trigger(`lobby-${roomId}`, event, data);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Pusher lobby error:", error);
    return NextResponse.json({ error: 'Failed to trigger pusher' }, { status: 500 });
  }
}