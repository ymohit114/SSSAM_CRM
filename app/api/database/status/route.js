import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { syncDatabaseToMongo } from '@/lib/mongoSync';

export async function GET() {
  try {
    const isConnected = mongoose.connection.readyState === 1;

    let dbDetails = {
      status: isConnected ? 'Connected 🟢' : 'Connecting / Ready 🟡',
      readyState: mongoose.connection.readyState,
      database: mongoose.connection.name || 'sssam_academy',
      host: mongoose.connection.host || 'MongoDB Atlas',
      envUriConfigured: Boolean(process.env.MONGODB_URI)
    };

    if (!isConnected) {
      try {
        await connectToDatabase();
        await syncDatabaseToMongo();
        dbDetails.status = 'Connected 🟢';
        dbDetails.readyState = 1;
        dbDetails.database = mongoose.connection.name;
        dbDetails.host = mongoose.connection.host;
      } catch (err) {
        dbDetails.status = 'Disconnected / Pending Credentials 🔴';
        dbDetails.error = err.message;
      }
    }

    return NextResponse.json({
      success: true,
      mongodb: dbDetails
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      message: err.message
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    const result = await syncDatabaseToMongo();
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
