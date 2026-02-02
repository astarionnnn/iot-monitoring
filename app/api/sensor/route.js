import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      temperature,
      humidity,
      soil_moisture,
      rain_status
    } = body;

    // simpan ke Firestore
    await addDoc(collection(db, "sensor_data"), {
      temperature,
      humidity,
      soil_moisture,
      rain_status,
      created_at: serverTimestamp(),
    });

    return NextResponse.json(
      { message: "Data sensor berhasil disimpan" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
