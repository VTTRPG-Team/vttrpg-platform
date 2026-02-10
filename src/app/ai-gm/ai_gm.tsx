import { useState, useEffect, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
const API_KEY = "AIzaSyD8LSZbkVBxsAz3YjJDmUczZB97UAw3oak"; 

type Message = {
  sender: string;
  text: string;
  type: 'USER' | 'AI' | 'SYSTEM';
  channel: 'PARTY' | 'AI'; // ตัวแยกห้อง
};

export const ai_gm = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentAiText, setCurrentAiText] = useState("");
  const hasInitialized = useRef(false);
  const fullTextRef = useRef("");

  const sendPartyMessage = (text: string) => {
    setMessages(prev => [...prev, { 
      sender: 'Player', 
      text: text, 
      type: 'USER',
      channel: 'PARTY' // ระบุว่าอยู่ห้อง Party
    }]);
  };

  const askGemini = async (promptText: string, isAutoStart = false) => {
    if (!isAutoStart) {
      setMessages(prev => [...prev, { 
        sender: 'Player', 
        text: promptText, 
        type: 'USER',
        channel: 'AI' // ระบุว่าอยู่ห้อง AI
      }]);
    }

    setLoading(true);
    setCurrentAiText(""); // Reset typing effect

    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(promptText);
      const response = await result.response;
      const text = response.text();

      fullTextRef.current = text;
      let i = 0;
      const typingInterval = setInterval(() => {
        setCurrentAiText(text.substring(0, i));
        i++;
        if (i > text.length) {
          clearInterval(typingInterval);
          // พิมพ์เสร็จแล้ว ให้บันทึกลง messages จริง และเคลียร์ตัวแปรชั่วคราว
          setMessages(prev => [...prev, { 
            sender: 'AI GM', 
            text: text, 
            type: 'AI',
            channel: 'AI' // ระบุว่าอยู่ห้อง AI
          }]);
          setCurrentAiText(""); 
          setLoading(false);
        }
      }, 10);

    } catch (err: any) {
      setMessages(prev => [...prev, { sender: 'System', text: err.message, type: 'SYSTEM', channel: 'AI' }]);
      setLoading(false);
    }
  };

  // Auto Start Logic
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    const initialPrompt = "Act as a Dungeon Master for a fantasy RPG. Briefly introduce yourself to the player and ask them what their character's name is.There will be total of 4 players so ask them all about their name and preferred role in the party (e.g., warrior, mage, healer, rogue). Keep the introduction concise and engaging to set the tone for the adventure ahead. Also after this whether what input will be judge by dice roll or not, explain it to the players. wheter what input is remember you are DM and dont answer normally act as DM only. Ask information about them 1 by 1 and wait for their response before moving to the next player. wait for all player to done introducing themselves before starting the adventure.";
    askGemini(initialPrompt, true);
  }, []);

  return {
    messages,
    loading,
    currentAiText, // ส่งข้อความที่กำลังพิมพ์ออกไปแสดงผล
    askGemini,
    sendPartyMessage
  };
};