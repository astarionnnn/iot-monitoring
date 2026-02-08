import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

/**
 * GET /api/control
 * Fetch control state from Firestore
 */
export async function GET() {
    try {
        console.log("[GET /api/control] Request received");

        const controlRef = doc(db, "control", "latest");
        const controlSnap = await getDoc(controlRef);

        if (!controlSnap.exists()) {
            console.log("[GET /api/control] No document found, creating default");

            // Create default control state
            await setDoc(controlRef, {
                fan: false,
                pump: false,
                created_at: serverTimestamp(),
            });

            return NextResponse.json({
                fan: false,
                pump: false,
            });
        }

        const data = controlSnap.data();
        console.log("[GET /api/control] Data:", data);

        return NextResponse.json({
            fan: data.fan ?? false,
            pump: data.pump ?? false,
        });

    } catch (error) {
        console.error("[GET /api/control] Error:", error);
        console.error("[GET /api/control] Stack:", error.stack);

        return NextResponse.json(
            {
                error: "Failed to fetch control data",
                message: error.message,
            },
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
        console.log("[POST /api/control] Request received");

        const body = await request.json();
        console.log("[POST /api/control] Body:", body);

        // Validate input
        if (typeof body.fan !== "boolean" || typeof body.pump !== "boolean") {
            return NextResponse.json(
                { error: "fan and pump must be boolean values" },
                { status: 400 }
            );
        }

        const controlRef = doc(db, "control", "latest");
        await setDoc(
            controlRef,
            {
                fan: body.fan,
                pump: body.pump,
                updated_at: serverTimestamp(),
            },
            { merge: true }
        );

        console.log("[POST /api/control] Control updated successfully");

        return NextResponse.json({
            success: true,
            message: "Control state updated",
            data: {
                fan: body.fan,
                pump: body.pump,
            },
        });

    } catch (error) {
        console.error("[POST /api/control] Error:", error);
        console.error("[POST /api/control] Stack:", error.stack);

        return NextResponse.json(
            {
                error: "Failed to update control data",
                message: error.message,
            },
            { status: 500 }
        );
    }
}
