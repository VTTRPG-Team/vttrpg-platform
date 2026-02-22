import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Key Missing" }, { status: 500 });

    const genAI = new GoogleGenerativeAI(apiKey);
    const { prompt, history = [] } = await req.json();
    
    // แปลงรูปแบบ History ให้ตรงกับที่ Gemini ต้องการ
    let formattedHistory = history.map((msg: any) => ({
      role: msg.role === 'AI' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    }));

    // ถ้า History เริ่มด้วย model (AI พูดก่อน) ให้ดักไว้ด้วย user ก่อน
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
      "gemini-2.0-flash",         
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
         
         // 🎯 สำคัญมาก: โคลน History ใหม่ทุกรอบ ป้องกันไม่ให้ SDK ยัด prompt ขยะลงไปถ้า API พังก่อนหน้า
         const currentHistory = structuredClone(formattedHistory);
         
         const model = genAI.getGenerativeModel({ 
           model: modelName,
           systemInstruction: `
             You are an expert Game Master for a Tabletop RPG.
             Your job is to narrate the scene, react to player actions, and manage the game flow.

             CRITICAL RULES:
             1. You will receive actions from multiple players at once in the format "PlayerName: Action". You must resolve all their actions together in a cohesive narrative.
             2. Do not play the game for the players. Only describe the environment and the outcomes of their actions.
             3. DICE ROLLS: If you need a player to roll a dice (e.g. to attack or dodge), request it by typing exactly: [ROLL_REQUEST:D20:PlayerName] or [ROLL_REQUEST:D8:ALL] on a new line. Do not resolve the action until they provide the dice result.
             4. SYSTEM TAGS: You must output specific tags at the VERY END of your message to control the game UI when the following events occur (strictly use this format):
               - Health Change: If a player takes damage or heals, output [HP:number] (e.g., [HP:-5] for taking 5 damage, [HP:10] for healing 10).
               - Urgent Choice: If players face a critical moment requiring an immediate decision, you MUST output choices separated by commas inside the tag: [CHOICE:Option1,Option2,Option3] (e.g., [CHOICE:โจมตี,วิ่งหนี,เจรจา]).
               
               ⚠️ STRICT PROHIBITIONS FOR CHOICES ⚠️:
               - NEVER write choices as a numbered list (1. 2. 3.) or bullet points in your narrative text.
               - NEVER ask "What do you do?" and then list out long paragraphs of options.
               - Just narrate the situation and put the short action keywords inside the [CHOICE:...] tag at the very end.

             EXAMPLE OF CORRECT BEHAVIOR:
             "The iron bolt is failing and the door is about to burst open. The hooded figure runs toward the kitchen. [CHOICE:Barricade the door,Chase the figure,Hide]"
             
             CRITICAL REMINDER: You MUST strictly format choices inside [CHOICE:...] at the VERY END. Do NOT output a numbered list.
           `
         });

         // 🎯 ใช้ History ที่เพิ่งโคลนมา
         const chat = model.startChat({ history: currentHistory });
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