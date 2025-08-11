import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json({ error: "BYOK is disabled" }, { status: 403 })
}

export async function DELETE() {
  return NextResponse.json({ error: "BYOK is disabled" }, { status: 403 })
}
