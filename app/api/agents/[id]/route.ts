export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { ApiResponse } from "@/lib/types";

function log(event: string, data: Record<string, unknown>) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), event, ...data }));
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const { id } = params;

  try {
    const agent = await prisma.agent.findUnique({ where: { id } });
    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found" } satisfies ApiResponse<never>,
        { status: 404 }
      );
    }

    // Remove coalition links first, then agent
    await prisma.coalitionAgent.deleteMany({ where: { agentId: id } });
    await prisma.agent.delete({ where: { id } });

    log("agent.deleted", { agentId: id });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    log("agent.delete.error", { agentId: id, error: String(err) });
    return NextResponse.json(
      { error: "Failed to delete agent" } satisfies ApiResponse<never>,
      { status: 500 }
    );
  }
}
