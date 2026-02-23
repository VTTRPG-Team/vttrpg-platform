'use client'
import { useEffect } from 'react'
import PusherClient from 'pusher-js'
import { useGameStore } from '@/store/useGameStore'

export default function RoomSync({ roomId, currentUserId }: { roomId: string, currentUserId: string }) {
  // 🌟 THE FIX: เปลี่ยนชื่อเป็น triggerDiceRollEvent ให้ตรงกับ Store ของคุณโอม
  const { updatePlayerStat, triggerStatChange, triggerDiceRollEvent, myUsername } = useGameStore();

  useEffect(() => {
    if (!roomId) return;

    const pusher = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, { 
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER! 
    });
    
    const channel = pusher.subscribe(`room-${roomId}`);

    channel.bind('gm-action', (data: any) => {
        const isMe = data.senderId === currentUserId;

        if (data.actionType === 'ENV_FX' && !isMe) {
            window.dispatchEvent(new CustomEvent('ai-fx', { detail: { action: data.actionData } }));
        }
        
        if (data.actionType === 'AUDIO_FX' && !isMe) {
            window.dispatchEvent(new CustomEvent('ai-audio', { detail: data.audioData }));
        }

        if (data.actionType === 'STAT_CHANGE' && !isMe) {
            const { username, statType, amount } = data.statData;
            
            // 🌟 รองรับระบบเลือดแบบใหม่ (ที่มีตัวเลขลอย DamageNumbers)
            if (statType === 'hp') {
               const damageType = amount < 0 ? 'damage' : 'heal';
               if (username === 'ALL') {
                   // โดนทุกคน
                   useGameStore.getState().triggerStatChange(myUsername, amount, damageType);
               } else {
                   // โดนคนเดียว
                   useGameStore.getState().triggerStatChange(username, amount, damageType);
               }
            } else {
               // ถ้าเป็น Mana อัปเดตแบบเดิมไปก่อน เพราะตัวเลขลอยรองรับแค่เลือด
               if (username === 'ALL') {
                   updatePlayerStat(myUsername, statType, amount);
               } else {
                   updatePlayerStat(username, statType, amount);
               }
            }
        }

        if (data.actionType === 'FORCE_DICE' && !isMe) {
            const { diceType, targetPlayers } = data.diceData;
            // 🌟 THE FIX: เรียกชื่อฟังก์ชันใหม่ให้ตรงกับ Store
            triggerDiceRollEvent(diceType, targetPlayers);
        }
    });

    return () => {
        pusher.unsubscribe(`room-${roomId}`);
        pusher.disconnect();
    };
  }, [roomId, currentUserId, myUsername, updatePlayerStat, triggerStatChange, triggerDiceRollEvent]);

  return null;
}