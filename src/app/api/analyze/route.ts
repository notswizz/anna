import { NextResponse } from "next/server";
import OpenAI from "openai";
import { analyzeFood } from "@/lib/ai/analyze";

export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { text?: string; image?: string };
    if (!body.text?.trim() && !body.image) {
      return NextResponse.json(
        { error: "Provide text or an image to analyze." },
        { status: 400 }
      );
    }
    const result = await analyzeFood({ text: body.text, image: body.image });
    return NextResponse.json(result);
  } catch (err) {
    console.error("analyze failed:", err);
    if (err instanceof OpenAI.APIError) {
      const friendly =
        err.code === "insufficient_quota"
          ? "Your OpenAI account is out of credits. Add billing at platform.openai.com, then try again."
          : err.status === 401
            ? "OpenAI rejected the API key. Check OPENAI_API_KEY in .env.local."
            : `OpenAI error: ${err.message}`;
      return NextResponse.json({ error: friendly }, { status: 502 });
    }
    const message = err instanceof Error ? err.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
