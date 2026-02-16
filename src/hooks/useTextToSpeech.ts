import { useState, useEffect, useCallback } from 'react';

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // 1. โหลดรายชื่อเสียงที่ Browser มี
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    // Chrome ต้องดัก event นี้ถึงจะโหลดเสียงมาครบ
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // 2. ฟังก์ชันพูด
  const speak = useCallback((text: string, sender: string = 'User') => {
    // ถ้ากำลังพูดอยู่ ให้หยุดก่อน (เพื่อเริ่มประโยคใหม่)
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // --- ตั้งค่าเสียง (Config) ---
    // เลือกเสียงภาษาอังกฤษ (Google US English หรือ Microsoft David/Zira)
    // คุณสามารถเปลี่ยน 'en-US' เป็น 'th-TH' ได้ถ้าอยากให้อ่านไทย (แต่เสียงจะดูไม่ค่อย RPG)
    const preferredVoice = voices.find(
      (v) => v.name.includes('Google US English') || v.name.includes('Microsoft David') || v.lang === 'en-US'
    );

    if (preferredVoice) utterance.voice = preferredVoice;

    // --- ปรับแต่งเสียงตามคนพูด (Character Logic) ---
    if (sender === 'AI' || sender === 'SYSTEM' || sender === 'DM') {
      utterance.pitch = 0.8; // เสียงทุ้มลงหน่อย ให้ดูขลัง
      utterance.rate = 0.9;  // พูดช้าลงนิดนึง
    } else {
      utterance.pitch = 1.0; // เสียงปกติ
      utterance.rate = 1.0;
    }

    utterance.volume = 1.0;

    // Event เมื่อพูดจบ
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    // สั่งพูด
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [voices]);

  // 3. ฟังก์ชันหยุดพูด
  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking };
};