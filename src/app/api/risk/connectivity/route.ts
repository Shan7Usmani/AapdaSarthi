export const dynamic = "force-dynamic";

export async function GET() {
  return new Response(
    JSON.stringify({
      online: true,
      timestamp: Date.now(),
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}