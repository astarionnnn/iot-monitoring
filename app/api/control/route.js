import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

/**
 * GET /api/control
 * Fetch control state from Firestore - SINKRON DENGAN DASHBOARD
 */
export async function GET(request) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    try {
        console.log("[GET /api/control] Request received");

        // UBAH: Gunakan collection "devices" dengan document "controls" 
        // sesuai dengan DevicesPage.jsx
        const controlRef = doc(db, "devices", "controls");
        const controlSnap = await getDoc(controlRef);

        if (!controlSnap.exists()) {
            console.log("[GET /api/control] No document found, creating default");

            await setDoc(controlRef, {
                fan: false,
                pump: false,
                light: false,
                created_at: serverTimestamp(),
            });

            return NextResponse.json(
                {
                    fan: false,
                    pump: false,
                    light: false,
                },
                { headers }
            );
        }

        const data = controlSnap.data();
        console.log("[GET /api/control] Data from devices/controls:", data);

        return NextResponse.json(
            {
                fan: data.fan ?? false,
                pump: data.pump ?? false,
                light: data.light ?? false,
            },
            { headers }
        );

    } catch (error) {
        console.error("[GET /api/control] Error:", error);

        return NextResponse.json(
            {
                error: "Failed to fetch control data",
                message: error.message,
            },
            { status: 500, headers }
        );
    }
}

/**
 * POST /api/control
 * Update control state in Firestore - SINKRON DENGAN DASHBOARD
 */
export async function POST(request) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    try {
        console.log("[POST /api/control] Request received");

        const body = await request.json();
        console.log("[POST /api/control] Body:", body);

        // UBAH: Gunakan collection "devices" dengan document "controls"
        const controlRef = doc(db, "devices", "controls");
        
        // Prepare update data
        const updateData = {
            updated_at: serverTimestamp(),
        };
        
        if (body.fan !== undefined) updateData.fan = body.fan;
        if (body.pump !== undefined) updateData.pump = body.pump;
        if (body.light !== undefined) updateData.light = body.light;

        await setDoc(controlRef, updateData, { merge: true });

        console.log("[POST /api/control] Control updated to devices/controls");

        // Baca data terbaru untuk response
        const updatedSnap = await getDoc(controlRef);
        const currentData = updatedSnap.data();

        return NextResponse.json(
            {
                success: true,
                message: "Control state updated",
                data: {
                    fan: currentData.fan ?? false,
                    pump: currentData.pump ?? false,
                    light: currentData.light ?? false,
                },
            },
            { headers }
        );

    } catch (error) {
        console.error("[POST /api/control] Error:", error);

        return NextResponse.json(
            {
                error: "Failed to update control data",
                message: error.message,
            },
            { status: 500, headers }
        );
    }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS(request) {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
