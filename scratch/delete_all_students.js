const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const uri = 'mongodb://mohit_app:mohit_app@ac-ft2q9tn-shard-00-00.iye3brk.mongodb.net:27017,ac-ft2q9tn-shard-00-01.iye3brk.mongodb.net:27017,ac-ft2q9tn-shard-00-02.iye3brk.mongodb.net:27017/sssam_academy?ssl=true&replicaSet=atlas-14av5y-shard-0&authSource=admin&appName=Cluster0';

async function main() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const studentsColl = db.collection('students');
  const attendanceColl = db.collection('attendances');

  const studentCount = await studentsColl.countDocuments();
  const attendanceCount = await attendanceColl.countDocuments();

  console.log(`Found in MongoDB Atlas: ${studentCount} students, ${attendanceCount} attendance records.`);

  // 1. Delete all students and attendances from MongoDB Atlas
  const deletedStudents = await studentsColl.deleteMany({});
  const deletedAttendance = await attendanceColl.deleteMany({});

  console.log(`Deleted from MongoDB Atlas: ${deletedStudents.deletedCount} students, ${deletedAttendance.deletedCount} attendance records.`);

  // 2. Clear local data/database.json
  const dbJsonPath = path.join(__dirname, '..', 'data', 'database.json');
  if (fs.existsSync(dbJsonPath)) {
    const raw = fs.readFileSync(dbJsonPath, 'utf8');
    const data = JSON.parse(raw);
    
    const localStudentsCount = (data.students || []).length;
    const localAttendanceCount = (data.attendance || []).length;

    data.students = [];
    data.attendance = [];

    fs.writeFileSync(dbJsonPath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Cleared local database.json: Removed ${localStudentsCount} students, ${localAttendanceCount} attendance logs.`);
  }

  console.log('All student and attendance data successfully deleted!');
  process.exit(0);
}

main().catch(err => {
  console.error('Error during deletion:', err);
  process.exit(1);
});
