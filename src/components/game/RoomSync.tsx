'use client'
import { useEffect } from 'react'
import PusherClient from 'pusher-js'
import { useGameStore } from '@/store/useGameStore'

export default function RoomSync({ roomId, currentUserId }: { roomId: string, currentUserId: string }) {
  const { updatePlayerStat, triggerStatChange, triggerDiceRollEvent, addDiceRoll, myUsername } = useGameStore();

  useEffect(() => {
    if (!roomId) return;
    const pusher = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, { cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER! });
    const channel = pusher.subscribe(`room-${roomId}`);

    channel.bind('gm-action', (data: any) => {
        const isMe = data.senderId === currentUserId;

        if (data.actionType === 'ENV_FX' && !isMe) window.dispatchEvent(new CustomEvent('ai-fx', { detail: { action: data.actionData } }));
        if (data.actionType === 'AUDIO_FX' && !isMe) window.dispatchEvent(new CustomEvent('ai-audio', { detail: data.audioData }));
        if (data.actionType === 'STAT_CHANGE' && !isMe) {
            const { username, statType, amount } = data.statData;
            if (statType === 'hp') {
               const damageType = amount < 0 ? 'damage' : 'heal';
               if (username === 'ALL') useGameStore.getState().triggerStatChange(myUsername, amount, damageType);
               else useGameStore.getState().triggerStatChange(username, amount, damageType);
            } else {
               if (username === 'ALL') updatePlayerStat(myUsername, statType, amount);
               else updatePlayerStat(username, statType, amount);
            }
        }
        if (data.actionType === 'FORCE_DICE' && !isMe) {
            const { diceType, targetPlayers } = data.diceData;
            triggerDiceRollEvent(diceType, targetPlayers);
        }
        
        // 🌟 FIX: เพิ่มตรงนี้! เพื่อรับข้อมูลลูกเต๋าที่เพื่อนทอย แล้วเอามาวาดในจอเรา!
        if (data.actionType === 'DICE_ROLL' && !isMe) {
            const { rollId, userId, username, diceType, result } = data.diceData;
            addDiceRoll(rollId, userId, username, diceType, result, false);
        }
    });

    return () => { pusher.unsubscribe(`room-${roomId}`); pusher.disconnect(); };
  }, [roomId, currentUserId, myUsername, updatePlayerStat, triggerStatChange, triggerDiceRollEvent, addDiceRoll]);

  return null;
}