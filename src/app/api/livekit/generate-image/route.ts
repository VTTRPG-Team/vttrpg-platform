import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { prompt, roomId } = await req.json();

    if (!prompt || !roomId) {
      return NextResponse.json({ error: 'Missing prompt or roomId' }, { status: 400 });
    }

    // 1. Clean Prompt: ตัดให้สั้นและเอาอักขระแปลกๆ ออก
    // ใช้ keywords สั้นๆ เพื่อให้ชัวร์ที่สุด
    const cleanPrompt = prompt
        .slice(0, 150) // ลดเหลือ 150 ตัวอักษร
        .replace(/[^a-zA-Z0-9 ,.-]/g, '') // เอาแค่อักษรอังกฤษ
        .trim();

    console.log(`Generating: ${cleanPrompt}`);

    // 2. สร้าง URL (แก้ตรงนี้!)
    // เปลี่ยนจาก pollinations.ai/p/ เป็น image.pollinations.ai/prompt/
    const seed = Math.floor(Math.random() * 1000000);
    const encodedPrompt = encodeURIComponent(`${cleanPrompt} fantasy art style high quality`);
    
    // ✅ ใช้ Link นี้แทน (เสถียรกว่า)
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&seed=${seed}&nologo=true&model=flux`;

    // 3. Fetch รูป
    const imageRes = await fetch(imageUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    });

    // เช็ค Content-Type
    const contentType = imageRes.headers.get('content-type');
    if (!imageRes.ok || !contentType?.startsWith('image')) {
        const errorText = await imageRes.text();
        console.error("Pollinations Error:", errorText.slice(0, 200));
        throw new Error(`AI Provider returned HTML instead of image. Content-Type: ${contentType}`);
    }

    const arrayBuffer = await imageRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`Got image size: ${buffer.length} bytes`);

    // 4. Upload to Supabase
    const fileName = `${roomId}/${Date.now()}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('game-assets')
      .upload(fileName, buffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (uploadError) throw uploadError;

    // 5. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('game-assets')
      .getPublicUrl(fileName);
    
    const { error: dbError } = await supabase
        .from('rooms')
        .update({ 
            board_image_url: publicUrl,
            is_image_generating: false  // ปิดสถานะโหลด
        })
        .eq('id', roomId);

    if (dbError) {
        console.error("DB Update Error:", dbError);
        throw dbError;
    }

    console.log("Database updated with new image!");

    return NextResponse.json({ url: publicUrl });

  } catch (error: any) {
    console.error('Generate Image Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}