import mongoose from 'mongoose';
import { db } from '@/lib/db';
import Attendance from '@/models/Attendance';
import { connectToDatabase } from '@/lib/mongodb';
import { getIndianDateTime } from '@/lib/indianTime';

/**
 * Runs the Auto Punch-Out check for all students who are still punched in past 9:00 PM (21:00 IST)
 * or on past unclosed days.
 */
export async function executeAutoPunchOut({ force = false } = {}) {
  const ist = getIndianDateTime();
  const currentHour = parseInt(ist.timeStr.split(':')[0], 10);
  const currentMinute = parseInt(ist.timeStr.split(':')[1], 10);
  const isPast9PM = force || currentHour >= 21;

  const autoPunchOutTime = '21:00:00';
  const autoRemarks = 'Auto Punched Out by System at 9:00 PM';
  const autoStudyNote = 'Class session concluded (Auto-closed at 9:00 PM)';

  const updatedRecords = [];

  // 1. Connect to MongoDB Atlas
  try {
    await connectToDatabase();
    const institute = db.getInstitute();

    // Query 1: Today's records where punchInTime exists and punchOutTime is null/empty (if >= 9 PM or forced)
    // Query 2: Past days' records where punchOutTime was never closed
    const filter = isPast9PM
      ? {
          punchInTime: { $exists: true, $ne: null, $ne: '' },
          $or: [
            { punchOutTime: null },
            { punchOutTime: '' },
            { punchOutTime: { $exists: false } }
          ]
        }
      : {
          date: { $lt: ist.dateStr },
          punchInTime: { $exists: true, $ne: null, $ne: '' },
          $or: [
            { punchOutTime: null },
            { punchOutTime: '' },
            { punchOutTime: { $exists: false } }
          ]
        };

    const openRecords = await Attendance.find(filter);

    for (const doc of openRecords) {
      const punchInTimeStr = doc.punchInTime || '09:00:00';
      const [inH, inM] = punchInTimeStr.split(':').map(Number);
      const [outH, outM] = autoPunchOutTime.split(':').map(Number);
      const durationMinutes = Math.max(0, (outH * 60 + outM) - (inH * 60 + inM));

      doc.punchOutTime = autoPunchOutTime;
      doc.punchOutLat = doc.punchInLat || institute.latitude;
      doc.punchOutLng = doc.punchInLng || institute.longitude;
      doc.punchOutDistance = 0;
      doc.durationMinutes = durationMinutes;
      doc.remarks = doc.remarks ? `${doc.remarks} | ${autoRemarks}` : autoRemarks;
      if (!doc.studySummary || doc.studySummary.trim().length === 0) {
        doc.studySummary = autoStudyNote;
      }
      doc.status = 'Present';

      await doc.save();

      updatedRecords.push({
        id: doc._id.toString(),
        studentId: doc.studentId,
        rollNo: doc.rollNo,
        studentName: doc.studentName,
        date: doc.date,
        punchInTime: doc.punchInTime,
        punchOutTime: autoPunchOutTime,
        durationMinutes
      });
    }
  } catch (mongoErr) {
    console.warn('MongoDB auto punch out check note:', mongoErr.message);
  }

  // 2. Also sync with local database.json
  try {
    const data = db.readDb ? db.readDb() : null;
    if (data && Array.isArray(data.attendance)) {
      let modifiedLocal = false;
      for (const record of data.attendance) {
        const isTodayUnclosed = isPast9PM && record.date === ist.dateStr && record.punchInTime && !record.punchOutTime;
        const isPastUnclosed = record.date < ist.dateStr && record.punchInTime && !record.punchOutTime;

        if (isTodayUnclosed || isPastUnclosed) {
          const punchInTimeStr = record.punchInTime || '09:00:00';
          const [inH, inM] = punchInTimeStr.split(':').map(Number);
          const [outH, outM] = autoPunchOutTime.split(':').map(Number);
          const durationMinutes = Math.max(0, (outH * 60 + outM) - (inH * 60 + inM));

          record.punchOutTime = autoPunchOutTime;
          record.durationMinutes = durationMinutes;
          record.remarks = record.remarks ? `${record.remarks} | ${autoRemarks}` : autoRemarks;
          if (!record.studySummary) record.studySummary = autoStudyNote;
          modifiedLocal = true;

          if (!updatedRecords.some(r => r.rollNo === record.rollNo && r.date === record.date)) {
            updatedRecords.push({
              studentId: record.studentId,
              rollNo: record.rollNo,
              studentName: record.studentName,
              date: record.date,
              punchInTime: record.punchInTime,
              punchOutTime: autoPunchOutTime,
              durationMinutes
            });
          }
        }
      }

      if (modifiedLocal && db.writeDb) {
        db.writeDb(data);
      }
    }
  } catch (localErr) {
    console.warn('Local db auto punch out check note:', localErr.message);
  }

  return {
    success: true,
    currentTimeIST: ist.timeStr,
    isPast9PM,
    autoPunchOutCount: updatedRecords.length,
    updatedRecords
  };
}
