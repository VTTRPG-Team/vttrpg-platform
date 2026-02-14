import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Key Missing" }, { status: 500 });

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 🌟 กลับมาใช้ตัวท็อปตามที่คุณโอมต้องการ!
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview", 
      systemInstruction: `
        You are an expert Game Master for a Tabletop RPG.
        Your job is to narrate the scene, react to player actions, and manage the game flow.
        CRITICAL RULES:
        1. You will receive actions from multiple players at once in the format "PlayerName: Action". You must resolve all their actions together in a cohesive narrative.
        2. Do not play the game for the players. Only describe the environment and the outcomes of their actions.
        3. DICE ROLLS: If a player attempts something risky or uncertain, request a dice roll by typing exactly: [ROLL_REQUEST:D20] or [ROLL_REQUEST:D8] or [ROLL_REQUEST:D6] on a new line.
      `
    });

    const { prompt, history = [] } = await req.json();
    
    let formattedHistory = history.map((msg: any) => ({
      role: msg.role === 'AI' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    }));

    // 🌟 THE FIX: กฎเหล็ก Gemini ประวัติอันแรกห้ามเป็น 'model'
    if (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
       formattedHistory.unshift({ role: 'user', parts: [{ text: '(Game Started)' }] });
    }

    const chat = model.startChat({ history: formattedHistory });
    const result = await chat.sendMessage(prompt);
    const text = result.response.text();

    return NextResponse.json({ text });

  } catch (error: any) {
    console.error("❌ Server Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}