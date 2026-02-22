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
    const body = await req.json();
    const { roomId } = body;
    
    // 🌟 กระจายข้อมูล "ทั้งหมด" (body) ไปที่ห้องนั้นๆ
    // พวก actionType, diceData, rollRequest จะได้ไปครบ
    await pusher.trigger(`room-${roomId}`, 'party-chat-event', body);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Pusher chat error:", error);
    return NextResponse.json({ error: 'Failed to trigger pusher' }, { status: 500 });
  }
}