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
    const data = await req.json();
    // 🌟 ยิงเข้าห้องด้วย Event ชื่อ 'gm-action'
    await pusher.trigger(`room-${data.roomId}`, 'gm-action', data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("GM Event Pusher Error:", error);
    return NextResponse.json({ error: 'Failed to broadcast' }, { status: 500 });
  }
}