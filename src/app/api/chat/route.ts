// src/app/api/chat/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY; // ดึง Key จาก env
    
    // เช็คว่าเจอ Key ไหม
    if (!apiKey) {
      console.error("❌ Server: API Key missing"); // ดู log นี้ใน Terminal
      return NextResponse.json({ error: "Key Missing" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const { prompt } = await req.json();
    
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ text });

  } catch (error: any) {
    console.error("❌ Server Error:", error); // ดู log นี้ใน Terminal
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}