
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  if (req.method !== "POST") {
    return new NextResponse(null, { status: 405, statusText: "Method Not Allowed" });
  }

  try {
    const body = await req.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json({ error: "Text input is required" }, { status: 400 });
    }
    if (!process.env.HF_TOKEN) {
      console.error("HF_TOKEN is not set in environment variables.");
      return NextResponse.json({ error: "Server configuration error: Missing Hugging Face Token" }, { status: 500 });
    }

    const response = await fetch(
      "https://api-inference.huggingface.co/models/nari-labs/Dia-1.6B",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: text }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Hugging Face API Error:", response.status, errorText);
      return NextResponse.json({ error: `Hugging Face API Error: ${errorText}` }, { status: response.status });
    }

    const buffer = await response.arrayBuffer();
    
    const headers = new Headers();
    headers.set("Content-Type", "audio/wav");
    headers.set("Content-Disposition", "inline; filename=voice.wav");

    return new Response(buffer, { status: 200, headers });

  } catch (err: unknown) {
    const error = err as Error;
    console.error("API Route Error:", error);
    return NextResponse.json({ error: "Something went wrong", details: error.message }, { status: 500 });
  }
}
