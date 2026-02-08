import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";

/**
 * GET /api/control
 * Fetch latest control state from Firestore
 */
export async function GET() {
    try {
        // Get latest control document from Firestore
        const controlDoc = await db
            .collection("control")
            .doc("latest")
            .get();

        if (!controlDoc.exists) {
            // Return default values if no control data exists
            return NextResponse.json({
                fan: false,
                pump: false,
            });
        }

        const data = controlDoc.data();

        return NextResponse.json({
            fan: data?.fan ?? false,
            pump: data?.pump ?? false,
            updated_at: data?.updated_at?.toDate?.().toISOString(),
        });
    } catch (error) {
        console.error("Error fetching control data:", error);
        return NextResponse.json(
            { error: "Failed to fetch control data" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/control
 * Update control state in Firestore
 */
export async function POST(request) {
    try {
        const body = await request.json();

        // Validate input
        if (typeof body.fan !== "boolean" || typeof body.pump !== "boolean") {
            return NextResponse.json(
                { error: "fan and pump must be boolean values" },
                { status: 400 }
            );
        }

        // Save to Firestore
        await db
            .collection("control")
            .doc("latest")
            .set(
                {
                    fan: body.fan,
                    pump: body.pump,
                    updated_at: new Date(),
                },
                { merge: true }
            );

        return NextResponse.json({
            success: true,
            message: "Control state updated",
            data: {
                fan: body.fan,
                pump: body.pump,
            },
        });
    } catch (error) {
        console.error("Error updating control data:", error);
        return NextResponse.json(
            { error: "Failed to update control data" },
            { status: 500 }
        );
    }
}
