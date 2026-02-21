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
    const { roomId, userId, username, color, x, y } = await req.json();
    
    // ยิงพิกัดไปที่ Channel ของห้องนั้นๆ
    await pusher.trigger(`room-${roomId}`, 'cursor-move', {
      userId,
      username,
      color,
      x,
      y,
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cursor pusher error:", error);
    return NextResponse.json({ error: 'Failed to broadcast cursor' }, { status: 500 });
  }
}