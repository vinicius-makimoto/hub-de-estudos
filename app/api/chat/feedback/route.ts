import { createPublicClient } from "@/lib/supabase/public";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { interactionId?: string; rating?: number };
    if (!body.interactionId || (body.rating !== 1 && body.rating !== -1)) return NextResponse.json({ error: "Feedback inválido." }, { status: 400 });
    const supabase = createPublicClient();
    const { error } = await supabase.rpc("submit_chat_feedback", { interaction_id: body.interactionId, feedback_rating: body.rating });
    if (error) return NextResponse.json({ error: "Não foi possível registrar o feedback." }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Não foi possível registrar o feedback." }, { status: 500 });
  }
}
