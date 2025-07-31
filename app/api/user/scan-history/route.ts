import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 })
    }

    console.log("Fetching scan history for user:", userId)
    const scanHistory = await DatabaseService.getUserScanHistory(userId)
    console.log("Retrieved scan history:", scanHistory)

    return NextResponse.json({ scanHistory })
  } catch (error) {
    console.error("Error fetching scan history:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { scanId, userId } = await request.json()

    if (!scanId || !userId) {
      return NextResponse.json({ error: "Missing required fields: scanId, userId" }, { status: 400 })
    }

    console.log("Deleting scan:", scanId, "for user:", userId)
    await DatabaseService.deleteScanFromHistory(scanId, userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting scan from history:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
