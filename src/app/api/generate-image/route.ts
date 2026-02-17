import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  let currentRoomId: string | null = null;

  try {
    const { prompt, roomId } = await req.json();
    currentRoomId = roomId;

    if (!prompt || !roomId) {
      return NextResponse.json({ error: 'Missing prompt or roomId' }, { status: 400 });
    }

    // 1. ทำความสะอาด Prompt 
    const cleanPrompt = prompt
      .replace(/[*_~`#()]/g, '')
      .replace(/[\n\r]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 200);

    const finalPrompt = `masterpiece, high quality, fantasy tabletop rpg art style, epic lighting, ${cleanPrompt}`;
    console.log(`🎨 Generating via Hugging Face Router: ${finalPrompt}`);

    const hfToken = process.env.HUGGINGFACE_API_KEY;
    if (!hfToken) {
      throw new Error("Missing HUGGINGFACE_API_KEY in .env.local");
    }

    // 🚀 THE FIX: เปลี่ยนมาใช้ URL ระบบ Router ใหม่ของ Hugging Face
    const imageRes = await fetch(
      "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${hfToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
            inputs: finalPrompt,
            parameters: { negative_prompt: "text, watermark, ugly, blurry, low resolution" }
        }),
      }
    );

    // 3. เช็คสถานะ API
    if (!imageRes.ok) {
        const errText = await imageRes.text();
        console.error("❌ Hugging Face Error:", errText);
        throw new Error(`Hugging Face API Failed: ${imageRes.statusText}`);
    }

    // 4. แปลงรูปเป็น Buffer
    const arrayBuffer = await imageRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length < 5000) {
        throw new Error(`Image size too small (${buffer.length} bytes). This might be a loading error.`);
    }

    console.log(`📦 Got valid image size: ${buffer.length} bytes`);

    // 5. อัปโหลดขึ้น Supabase Storage
    const fileName = `${roomId}/${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from('game-assets')
      .upload(fileName, buffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (uploadError) throw uploadError;

    // 6. ขอ URL แบบ Public
    const { data: { publicUrl } } = supabase.storage
      .from('game-assets')
      .getPublicUrl(fileName);
    
    // 7. อัปเดต Database
    const { error: dbError } = await supabase
      .from('rooms')
      .update({ 
        board_image_url: publicUrl,
        is_image_generating: false 
      })
      .eq('id', roomId);

    if (dbError) throw dbError;

    console.log("✅ Database updated successfully via Hugging Face!");
    return NextResponse.json({ url: publicUrl });

  } catch (error: any) {
    console.error('🔥 Generate Image Error:', error.message);
    
    if (currentRoomId) {
      await supabase
         .from('rooms')
         .update({ is_image_generating: false })
         .eq('id', currentRoomId);
    }
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}