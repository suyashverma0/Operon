import { getGeminiClient, cleanJsonResponse } from './gemini';
import { logger } from '../utils/logger';

export interface ExtractedBillItem {
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ExtractedBill {
  storeName?: string;
  date?: string;
  items: ExtractedBillItem[];
  subtotal?: number;
  tax?: number;
  totalAmount: number;
  confidence: number;
}

export async function extractBillFromText(billText: string): Promise<ExtractedBill | null> {
  const prompt = `You are a Kirana Store OCR and Bill Parser.
Extract items, quantities, prices, and total amount from this bill text into JSON:
Bill text:
"""
${billText}
"""

Format:
{
  "storeName": string,
  "date": string,
  "items": [{"itemName": string, "quantity": number, "unitPrice": number, "totalPrice": number}],
  "totalAmount": number,
  "confidence": number
}
Return ONLY valid JSON.`;

  try {
    const raw = await getGeminiClient().generate({
      systemPrompt: 'You are an OCR and bill parser for Indian retail stores. Output only valid JSON.',
      userPrompt: prompt,
    });
    return JSON.parse(cleanJsonResponse(raw));
  } catch (err) {
    logger.error('Bill extraction failed:', err);
    return null;
  }
}
