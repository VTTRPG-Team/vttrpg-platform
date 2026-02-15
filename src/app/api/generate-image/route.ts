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

    // 🌟 THE FIX: ลบดอกจัน สัญลักษณ์ Markdown และยุบช่องว่าง ป้องกัน URL พัง
    const cleanPrompt = prompt
        .replace(/[*_~`#]/g, '') // ลบสัญลักษณ์ Markdown ทิ้งให้หมด
        .replace(/[\n\r]/g, ' ') 
        .replace(/\s+/g, ' ') 
        .slice(0, 150) // จำกัดแค่ 150 ตัวอักษร ปลอดภัยแน่นอน
        .trim();

    console.log(`Generating: ${cleanPrompt}`);

    const seed = Math.floor(Math.random() * 1000000);
    const encodedPrompt = encodeURIComponent(`${cleanPrompt}, fantasy tabletop rpg art style, epic, highly detailed`);
    
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&seed=${seed}&nologo=true&model=flux`;

    const imageRes = await fetch(imageUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)'
        }
    });

    const contentType = imageRes.headers.get('content-type');
    if (!imageRes.ok || !contentType?.startsWith('image')) {
        const errorText = await imageRes.text();
        console.error("Pollinations Error:", errorText.slice(0, 200));
        throw new Error(`AI Provider returned HTML instead of image. Content-Type: ${contentType}`);
    }

    const arrayBuffer = await imageRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`Got image size: ${buffer.length} bytes`);

    const fileName = `${roomId}/${Date.now()}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('game-assets')
      .upload(fileName, buffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('game-assets')
      .getPublicUrl(fileName);
    
    const { error: dbError } = await supabase
        .from('rooms')
        .update({ 
            board_image_url: publicUrl,
            is_image_generating: false 
        })
        .eq('id', roomId);

    if (dbError) throw dbError;

    console.log("Database updated with new image!");
    return NextResponse.json({ url: publicUrl });

  } catch (error: any) {
    console.error('Generate Image Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}