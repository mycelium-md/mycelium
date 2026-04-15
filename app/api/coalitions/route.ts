import { NextRequest, NextResponse } from "next/server";
import { listCoalitions } from "@/lib/coalition-manager";
import type { ApiResponse, CoalitionRecord } from "@/lib/types";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10)));

  try {
    const { coalitions, total } = await listCoalitions(page, limit);

    return NextResponse.json({
      data: {
        coalitions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    } satisfies ApiResponse<{ coalitions: CoalitionRecord[]; pagination: unknown }>);
  } catch (err) {
    console.log(JSON.stringify({ event: "coalitions.list.error", error: String(err) }));
    return NextResponse.json(
      { error: "Failed to fetch coalitions" } satisfies ApiResponse<never>,
      { status: 500 }
    );
  }
}
