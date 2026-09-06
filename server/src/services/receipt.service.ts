import { getGroqClient } from "@/config/groq";
import { env } from "@/config/env";
import { ApiError } from "@/utils/ApiError";
import { createWorker } from "tesseract.js";

export interface ReceiptDraft {
  title: string;
  amount: number;
  date?: string;
  paymentMethod?: "cash" | "upi" | "credit_card" | "debit_card" | "bank_transfer";
  notes?: string;
}

const RECEIPT_PROMPT = `Extract the receipt text below into JSON only. Do not use markdown or code fences.
Return exactly these keys: title, amount, date, paymentMethod, notes.
title: the merchant or a short purchase description.
amount: the final total as a number, not a string.
date: ISO date YYYY-MM-DD when visible, otherwise null.
paymentMethod: one of cash, upi, credit_card, debit_card, bank_transfer, or null.
notes: useful receipt details such as receipt number, otherwise null.
If the image is not a receipt or the total is unreadable, return {"error":"Unable to read receipt"}.`;

export const scanReceipt = async (buffer: Buffer, _mimeType: string): Promise<ReceiptDraft> => {
  const worker = await createWorker("eng");
  let receiptText = "";
  try {
    const result = await worker.recognize(buffer);
    receiptText = result.data.text.trim();
  } finally {
    await worker.terminate();
  }

  if (!receiptText) {
    throw new ApiError(422, "Unable to read this receipt. Try a clearer image.");
  }

  const groq = getGroqClient();
  const completion = await groq.chat.completions.create({
    model: env.groqModel,
    messages: [
      {
        role: "user",
        content: `${RECEIPT_PROMPT}\n\nReceipt text:\n${receiptText.slice(0, 12000)}`,
      },
    ],
    temperature: 0,
    max_tokens: 300,
  });

  const raw = completion.choices[0]?.message?.content?.trim() || "";
  let parsed: any;
  try {
    parsed = JSON.parse(raw.replace(/^```json\s*|\s*```$/g, ""));
  } catch {
    throw new ApiError(422, "Unable to read this receipt. Try a clearer image.");
  }
  if (parsed.error || typeof parsed.amount !== "number" || parsed.amount <= 0 || !parsed.title) {
    throw new ApiError(422, "Unable to read a valid total from this receipt.");
  }

  return {
    title: String(parsed.title).slice(0, 120),
    amount: parsed.amount,
    date: parsed.date || undefined,
    paymentMethod: parsed.paymentMethod || undefined,
    notes: parsed.notes ? String(parsed.notes).slice(0, 500) : undefined,
  };
};