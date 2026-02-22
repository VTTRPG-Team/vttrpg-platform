'use client'
import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/useGameStore';

export default function DamageNumbers({ username }: { username: string }) {
  const { floatingTexts, removeFloatingText } = useGameStore();
  const texts = floatingTexts.filter(t => t.username === username);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[100] flex items-center justify-center">
      {/* 🌟 ปรับอนิเมชั่นให้เร็วและกระชับขึ้นแบบเกม MOBA (0.8s) */}
      <style jsx>{`
        @keyframes popOut {
          0% { transform: translateY(10px) scale(0.5); opacity: 0; }
          20% { transform: translateY(-20px) scale(1.4); opacity: 1; }
          80% { transform: translateY(-30px) scale(1); opacity: 1; }
          100% { transform: translateY(-40px) scale(0.8); opacity: 0; }
        }
        .animate-pop-out { animation: popOut 0.8s ease-out forwards; }
      `}</style>

      {texts.map((t) => (
        <FloatingItem key={t.id} text={t} onComplete={() => removeFloatingText(t.id)} />
      ))}
    </div>
  );
}

function FloatingItem({ text, onComplete }: { text: any, onComplete: () => void }) {
  // 🌟 ใช้ useRef เก็บฟังก์ชันไว้ เพื่อที่เวลา Component โดนเรียกซ้ำเวลากดย้ำๆ มันจะได้ไม่มารีเซ็ตเวลาใหม่
  const onCompleteRef = useRef(onComplete);
  
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    // จบอนิเมชั่นที่ 0.8 วินาที แล้วลบออกจากจอ
    const timer = setTimeout(() => {
      onCompleteRef.current();
    }, 800);
    
    return () => clearTimeout(timer);
  }, []); // <--- Dependency เป็น [] ว่างๆ แปลว่าจะนับเวลาแค่ครั้งเดียวตอนเกิดตัวเลขขึ้นมาเท่านั้น!

  const isHeal = text.type === 'heal';
  
  return (
    <div className={`absolute animate-pop-out font-black text-4xl drop-shadow-[0_4px_4px_rgba(0,0,0,1)] 
      ${isHeal ? 'text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.8)]' : 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]'}
    `}>
      {isHeal ? '+' : '-'}{text.amount}
    </div>
  );
}