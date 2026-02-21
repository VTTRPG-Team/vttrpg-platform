'use client';
import { useEffect, useState, useRef } from 'react';
import PusherClient from 'pusher-js';
import { MousePointer2 } from 'lucide-react';

// สีประจำตัวของผู้เล่นแต่ละคน (สุ่มจาก userId หรือส่งมาจาก Store ก็ได้)
const cursorColors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

export default function CursorOverlay({ roomId, currentUserId, myUsername }: any) {
  const [cursors, setCursors] = useState<{ [key: string]: any }>({});
  const lastUpdateRef = useRef<number>(0);
  const myColor = useRef(cursorColors[Math.floor(Math.random() * cursorColors.length)]).current;

  useEffect(() => {
    if (!roomId) return;

    // 🌟 1. ดักฟังเมาส์เพื่อนจาก Pusher
    const pusher = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, { cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER! });
    const channel = pusher.subscribe(`room-${roomId}`);

    channel.bind('cursor-move', (data: any) => {
      // ไม่ต้องโชว์เมาส์ตัวเองซ้ำ
      if (data.userId === currentUserId) return;

      setCursors((prev) => ({
        ...prev,
        [data.userId]: { ...data, lastSeen: Date.now() }
      }));
    });

    // 🌟 ล้างเมาส์เพื่อนที่ค้าง (ถ้าเพื่อนไม่ขยับเมาส์เกิน 3 วินาที ให้ซ่อนไปก่อน)
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setCursors((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((id) => {
          if (now - next[id].lastSeen > 3000) delete next[id];
        });
        return next;
      });
    }, 1000);

    return () => {
      pusher.unsubscribe(`room-${roomId}`);
      pusher.disconnect();
      clearInterval(cleanupInterval);
    };
  }, [roomId, currentUserId]);

  // 🌟 2. จับพิกัดเมาส์ตัวเองแล้วส่งไปให้เพื่อน
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      // Throttle: ส่งข้อมูลแค่ทุกๆ 100ms (10 ครั้ง/วินาที)
      if (now - lastUpdateRef.current < 100) return;
      lastUpdateRef.current = now;

      // คำนวณพิกัดเป็น %
      const xPercent = (e.clientX / window.innerWidth) * 100;
      const yPercent = (e.clientY / window.innerHeight) * 100;

      fetch('/api/pusher/cursor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          userId: currentUserId,
          username: myUsername,
          color: myColor,
          x: xPercent,
          y: yPercent,
        }),
      }).catch(() => {});
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [roomId, currentUserId, myUsername, myColor]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      {Object.values(cursors).map((cursor) => (
        <div
          key={cursor.userId}
          className="absolute flex flex-col items-start drop-shadow-lg"
          style={{
            // 🌟 ใช้ CSS Transition เพื่อให้เมาส์ดูสมูทเวลาวิ่งมารับข้อมูลใหม่
            left: `${cursor.x}%`,
            top: `${cursor.y}%`,
            transition: 'left 0.1s linear, top 0.1s linear',
          }}
        >
          {/* ไอคอนเมาส์ */}
          <MousePointer2 
             size={24} 
             fill={cursor.color} 
             color="white" 
             className="transform -rotate-12" 
          />
          {/* ป้ายชื่อเพื่อน */}
          <div 
             className="mt-1 ml-4 px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-md uppercase tracking-wider"
             style={{ backgroundColor: cursor.color }}
          >
            {cursor.username}
          </div>
        </div>
      ))}
    </div>
  );
}