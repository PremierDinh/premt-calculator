import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Language } from '../core/settings';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

const MODEL = 'gemini-2.0-flash';

function buildSystemPrompt(language: Language): string {
  if (language === 'vi') {
    return `Bạn là trợ lý toán học cho premt calculator — mô phỏng máy tính khoa học ClassWiz trên trình duyệt.
Trả lời bằng tiếng Việt. Giúp người dùng: cách dùng 13 ứng dụng, khái niệm toán, giải thích từng bước.
Khi gợi ý biểu thức nhập vào máy tính, dùng cú pháp: sin(, cos(, sqrt(, ^2, phân số dạng a/b.
Luôn nhắc kiểm tra kết quả số trên máy tính mô phỏng. Trả lời ngắn gọn trừ khi được yêu cầu chi tiết.`;
  }
  return `You are a math tutor for premt calculator — a ClassWiz-style scientific calculator simulator in the browser.
Reply in English. Help with: using the 13 apps, math concepts, step-by-step explanations.
When suggesting calculator input, use syntax like sin(, cos(, sqrt(, ^2, fractions as a/b.
Always remind users to verify numeric answers on the simulator. Keep answers concise unless asked for detail.`;
}

export function hasGeminiApiKey(): boolean {
  return Boolean(import.meta.env.VITE_GEMINI_API_KEY?.trim());
}

export async function sendGeminiMessage(
  messages: ChatMessage[],
  language: Language,
): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('MISSING_API_KEY');
  }

  const last = messages[messages.length - 1];
  if (!last || last.role !== 'user') {
    throw new Error('INVALID_MESSAGE');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: buildSystemPrompt(language),
  });

  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === 'user' ? 'user' as const : 'model' as const,
    parts: [{ text: m.text }],
  }));

  const chat = model.startChat({ history });
  const result = await chat.sendMessage(last.text);
  const text = result.response.text()?.trim();
  if (!text) throw new Error('EMPTY_RESPONSE');
  return text;
}
