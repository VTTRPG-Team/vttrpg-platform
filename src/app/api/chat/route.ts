import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Key Missing" }, { status: 500 });

    const genAI = new GoogleGenerativeAI(apiKey);
    const { prompt, history = [] } = await req.json();
    
    let formattedHistory = history.map((msg: any) => ({
      role: msg.role === 'AI' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    }));

    if (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
       formattedHistory.unshift({ role: 'user', parts: [{ text: '(Game Started)' }] });
    }

    // ==========================================
    // 🌟 ระบบ Fallback: เรียงจากเก่งสุด ไป อ่อนสุด
    // ==========================================
    const fallbackModels = [
      "gemini-3-pro-preview",
      "gemini-3-flash-preview",
      "gemini-2.5-pro",
      "gemini-2.0-flash",         // (สลับตัวนี้ขึ้นมาก่อน 2.5-flash-lite เพราะ 2.0-flash มาตรฐานเสถียรกว่าครับ)
      "gemini-2.5-flash-lite",
      "gemini-2.0-flash-lite"
    ];

    let text = null;
    let usedModel = "";
    let lastError = null;

    // 🌟 วนลูปเทสทีละโมเดล ถ้าพังก็ให้ข้ามไปตัวถัดไป
    for (const modelName of fallbackModels) {
       try {
          console.log(`🤖 Trying model: ${modelName}...`);
          
          const model = genAI.getGenerativeModel({ 
            model: modelName,
            systemInstruction: `
              You are an expert Game Master for a Tabletop RPG.
              Your job is to narrate the scene, react to player actions, and manage the game flow.
              CRITICAL RULES:
              1. You will receive actions from multiple players at once in the format "PlayerName: Action". You must resolve all their actions together in a cohesive narrative.
              2. Do not play the game for the players. Only describe the environment and the outcomes of their actions.
              3. DICE ROLLS: If you need a player to roll a dice (e.g. to attack or dodge), request it by typing exactly: [ROLL_REQUEST:D20:PlayerName] or [ROLL_REQUEST:D8:ALL] on a new line. Do not resolve the action until they provide the dice result.
            `
          });

          const chat = model.startChat({ history: formattedHistory });
          const result = await chat.sendMessage(prompt);
          
          text = result.response.text();
          usedModel = modelName;
          
          console.log(`✅ Success! Answered by: ${modelName}`);
          break; // ถ้าสำเร็จให้เบรกออกจากลูปทันที ไม่ต้องเทสตัวอื่นแล้ว

       } catch (err: any) {
          console.error(`❌ Failed with ${modelName}:`, err.message);
          lastError = err;
          // ล้มแล้วลุก ลุยต่อลูปหน้า (ลองโมเดลตัวถัดไป)
       }
    }

    // ถ้าวนจนครบทุกโมเดลแล้วยังพังอยู่ (เช่น เน็ตตัด หรือ API ล่มทั้งระบบ)
    if (!text) {
       throw new Error(`All Gemini models failed. Last error: ${lastError?.message}`);
    }

    // ส่งคำตอบกลับไป พร้อมแอบแนบชื่อโมเดลที่ใช้รอดตายกลับไปด้วย
    return NextResponse.json({ text, modelUsed: usedModel });

  } catch (error: any) {
    console.error("❌ Server Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}