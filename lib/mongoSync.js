import { connectToDatabase } from './mongodb';
import Student from '@/models/Student';
import Attendance from '@/models/Attendance';
import InstituteSettings from '@/models/InstituteSettings';
import Admin from '@/models/Admin';
import mongoose from 'mongoose';

export async function syncDatabaseToMongo() {
  try {
    await connectToDatabase();
    const db = mongoose.connection.db;

    // Drop batches collection if exists
    try {
      await db.collection('batches').drop();
    } catch {
      // ignore if already dropped
    }

    // 1. Seed Institute Settings if empty
    const settingsCount = await InstituteSettings.countDocuments();
    if (settingsCount === 0) {
      await InstituteSettings.create({
        name: "SSSAM Academy",
        tagline: "Excellence in Education & Training",
        address: "Main Campus, Knowledge Park, India",
        latitude: 28.470452,
        longitude: 77.044462,
        geofenceRadius: 50,
        requirePhoto: false,
        startTime: "09:00",
        lateThresholdMinutes: 15,
        endTime: "17:00",
        adminPin: "1234"
      });
      console.log('✅ MongoDB: Seeded Institute Settings');
    }

    // 2. Seed Admin if empty
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      await Admin.create({
        email: "admin@mohit.com",
        password: "1234567890",
        name: "Mohit Yadav (Admin)",
        role: "admin"
      });
      console.log('✅ MongoDB: Seeded Admin Account (admin@mohit.com)');
    }

    // 3. Seed Students if empty
    const studentCount = await Student.countDocuments();
    if (studentCount === 0) {
      await Student.insertMany([
        { rollNo: "SSSAM-101", name: "Aman Sharma", password: "123456", phone: "+91 98765 43210", email: "aman.sharma@example.com", gender: "Male" },
        { rollNo: "SSSAM-102", name: "Priya Patel", password: "123456", phone: "+91 98765 43211", email: "priya.patel@example.com", gender: "Female" },
        { rollNo: "SSSAM-103", name: "Rahul Verma", password: "123456", phone: "+91 98765 43212", email: "rahul.verma@example.com", gender: "Male" },
        { rollNo: "SSSAM-104", name: "Sneha Gupta", password: "123456", phone: "+91 98765 43213", email: "sneha.gupta@example.com", gender: "Female" },
        { rollNo: "SSSAM-105", name: "Rohan Singh", password: "123456", phone: "+91 98765 43214", email: "rohan.singh@example.com", gender: "Male" },
        { rollNo: "SSSAM-106", name: "Ananya Roy", password: "123456", phone: "+91 98765 43215", email: "ananya.roy@example.com", gender: "Female" }
      ]);
      console.log('✅ MongoDB: Seeded Default Students');
    }

    return { success: true, message: 'Database synced with MongoDB Atlas (Batches removed)' };
  } catch (err) {
    console.warn('⚠️ MongoDB sync note:', err.message);
    return { success: false, error: err.message };
  }
}
