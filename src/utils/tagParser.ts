export interface ParsedTags {
  cleanStory: string;
  bg: string | null;
  hpChange: number;
  choices: string[];
  // 🌟 1. เพิ่ม Type สำหรับเก็บคำสั่งทอยเต๋า
  diceRequest: { type: string; target: string } | null; 
}

export const parseAIText = (rawText: string): ParsedTags => {
  let bg: string | null = null;
  let hpChange: number = 0;
  let choices: string[] = [];
  let diceRequest: { type: string; target: string } | null = null; // 🌟 2. ตัวแปรเก็บค่าเริ่มต้น

  // 🌟 3. เพิ่ม ROLL_REQUEST เข้าไปใน Regex เพื่อให้มันดักจับได้
  // ดักจับรูปแบบ [BG:xxx], [HP:-x], [CHOICE:x,y,z], [ROLL_REQUEST:D20:Name]
  const tagRegex = /\[(BG|HP|CHOICE|ROLL_REQUEST):(.*?)\]/gi; 
  let match;

  while ((match = tagRegex.exec(rawText)) !== null) {
    const tag = match[1].toUpperCase();
    const value = match[2].trim();

    if (tag === 'BG') {
      bg = value;
    } else if (tag === 'HP') {
      hpChange = parseInt(value, 10) || 0;
    } else if (tag === 'CHOICE') {
      choices = value.split(',').map(c => c.trim());
    } else if (tag === 'ROLL_REQUEST') {
      // 🌟 4. ตัดคำ value ที่ได้มา (เช่น "D20:คุณโอม") ให้แยกออกเป็น 2 ส่วน
      const parts = value.split(':');
      if (parts.length >= 2) {
         diceRequest = {
           type: parts[0].trim().toUpperCase(), // จะได้ 'D20', 'D6'
           target: parts[1].trim()              // จะได้ชื่อผู้เล่น หรือ 'ALL'
         };
      }
    }
  }

  // ลบ Tag ออกจากข้อความ AI เพื่อให้เหลือแค่เนื้อเรื่อง (ลบช่องว่างส่วนเกินด้วย)
  const cleanStory = rawText.replace(tagRegex, '').replace(/\s{2,}/g, ' ').trim();

  // 🌟 5. อย่าลืม Return ค่า diceRequest กลับไปด้วย
  return { cleanStory, bg, hpChange, choices, diceRequest };
};