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
    // 🌟 รับ senderId เพิ่มเข้ามา
    const { roomId, action, senderId } = await req.json();
    
    // 🌟 ส่ง senderId ไปพร้อมกับ action
    await pusher.trigger(`room-${roomId}`, 'vote-event', { action, senderId });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Pusher error:", error);
    return NextResponse.json({ error: 'Failed to trigger pusher' }, { status: 500 });
  }
}