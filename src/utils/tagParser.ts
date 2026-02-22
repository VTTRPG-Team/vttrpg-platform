export interface ParsedTags {
  cleanStory: string;
  bg: string | null;
  hpChange: number;
  choices: string[];
}

export const parseAIText = (rawText: string): ParsedTags => {
  let bg: string | null = null;
  let hpChange: number = 0;
  let choices: string[] = [];

  // ดักจับรูปแบบ [BG:xxx], [HP:-x], [CHOICE:x,y,z]
  const tagRegex = /\[(BG|HP|CHOICE):(.*?)\]/gi;
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
    }
  }

  // ลบ Tag ออกจากข้อความ AI เพื่อให้เหลือแค่เนื้อเรื่อง (ลบช่องว่างส่วนเกินด้วย)
  const cleanStory = rawText.replace(tagRegex, '').replace(/\s{2,}/g, ' ').trim();

  return { cleanStory, bg, hpChange, choices };
};