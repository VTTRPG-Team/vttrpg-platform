'use client'
import { useEffect, useRef, useState } from 'react'
import { Volume1, Volume2, VolumeX, Music } from 'lucide-react'
import { useGameStore } from '@/store/useGameStore'

// 🎵 1. เปลี่ยนมาใช้ไฟล์เสียงในเครื่องเราเอง (ชัวร์ 100%)
const AUDIO_LIBRARY = {
  // ดึงไฟล์จาก public/sounds/ambient.mp3
  ambient: '/sounds/ambient.mp3', 
  
  // (พวกนี้ถ้าหาไฟล์ได้ ก็โหลดมาใส่แล้วเปลี่ยนลิงก์เป็น /sounds/... ได้เลยครับ)
  sfx: {
    sword: 'sounds/sword.mp3',
    magic: 'sounds/magic.mp3',
    explosion: 'sounds/explosion.mp3',
    monster: 'sounds/monster.mp3',
  },
  bgm: {
    rain: 'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg',
    tavern: '/sounds/ambient.mp3',
    dungeon: 'https://actions.google.com/sounds/v1/horror/ambience_creepy_drone.ogg',
  }
}

export default function AudioEngine() {
  const { masterVolume } = useGameStore(); // 🌟 ดึงค่าระดับเสียงรวม
  const [volume, setVolume] = useState(0.8); // 🌟 ปรับค่าเริ่มต้นให้ดังขึ้นเป็น 80% จะได้ยินชัดๆ
  const [isMuted, setIsMuted] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  const ambientPlayer = useRef<HTMLAudioElement | null>(null);
  const bgmPlayer = useRef<HTMLAudioElement | null>(null);
  const sfxPlayer = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && !ambientPlayer.current) {
      ambientPlayer.current = new Audio(AUDIO_LIBRARY.ambient);
      ambientPlayer.current.loop = true;

      bgmPlayer.current = new Audio();
      bgmPlayer.current.loop = true;

      sfxPlayer.current = new Audio();
    }

    const handleAudioEvent = (e: any) => {
      const { type, track } = e.detail;
      if (type === 'play_bgm' && bgmPlayer.current) {
        if (track === 'stop') {
          bgmPlayer.current.pause();
          return;
        }
        // @ts-ignore
        const url = AUDIO_LIBRARY.bgm[track];
        if (url) {
          bgmPlayer.current.src = url;
          bgmPlayer.current.play().catch(err => console.log('BGM Error:', err));
        }
      }
      if (type === 'play_sfx' && sfxPlayer.current) {
        // @ts-ignore
        const url = AUDIO_LIBRARY.sfx[track];
        if (url) {
          sfxPlayer.current.src = url;
          sfxPlayer.current.play().catch(err => console.log('SFX Error:', err));
        }
      }
    };

    window.addEventListener('ai-audio', handleAudioEvent);
    return () => window.removeEventListener('ai-audio', handleAudioEvent);
  }, []);

  // 🌟 บังคับให้เริ่มเล่นเสียง เมื่อผู้เล่นกดปุ่มบนหน้าเว็บ
  const startAmbientAudio = () => {
    if (!hasInteracted && ambientPlayer.current) {
      ambientPlayer.current.play()
        .then(() => setHasInteracted(true))
        .catch((e) => console.log('เบราว์เซอร์บล็อกเสียง:', e));
    }
  };

  useEffect(() => {
    const actualVolume = masterVolume;
    // 🌟 ทุกเสียงจะดังตามสไลด์บาร์อันเดียวที่คุณโอมจะเลื่อน
    if (ambientPlayer.current) ambientPlayer.current.volume = actualVolume; 
    if (bgmPlayer.current) bgmPlayer.current.volume = actualVolume;
    if (sfxPlayer.current) sfxPlayer.current.volume = Math.min(actualVolume * 1.5, 1); 
  }, [masterVolume]);

  return null; // 🌟 ไม่ต้องโชว์อะไรแล้ว ย้าย UI ไปที่ VideoOverlay แทน
}