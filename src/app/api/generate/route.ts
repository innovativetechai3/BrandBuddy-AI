import { generateContentPack, AIError } from "@/lib/ai";
import { checkRateLimit } from "@/lib/rateLimit";
import { generateRequestSchema } from "@/lib/schema";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = generateRequestSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return Response.json({ error: first?.message ?? "Invalid input." }, { status: 400 });
  }

  const visitor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = checkRateLimit(visitor);
  if (!limit.ok) {
    return Response.json(
      { error: "You have reached today's free generation limit. Please come back tomorrow." },
      { status: 429 },
    );
  }

  try {
    const pack = await generateContentPack(parsed.data);
    return Response.json({ pack, remaining: limit.remaining });
  } catch (err) {
    if (err instanceof AIError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
