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
    const { roomId, message, senderId } = await req.json();
    
    // กระจายข้อความแชทไปที่ห้องนั้นๆ
    await pusher.trigger(`room-${roomId}`, 'party-chat-event', { message, senderId });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Pusher chat error:", error);
    return NextResponse.json({ error: 'Failed to trigger pusher' }, { status: 500 });
  }
}