const mongoose = require('mongoose');
const fs = require('fs');

async function fixLateStatus() {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const uriMatch = envContent.match(/MONGODB_URI=(.*)/);
  const uri = uriMatch ? uriMatch[1].trim() : null;

  if (uri) {
    await mongoose.connect(uri);
    const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', new mongoose.Schema({}, { strict: false }));
    const res = await Attendance.updateMany({ status: 'Late' }, { $set: { status: 'Present' } });
    console.log('MongoDB Atlas updated Late records to Present:', res.modifiedCount);
    await mongoose.disconnect();
  }

  const path = './data/attendance.json';
  if (fs.existsSync(path)) {
    const data = JSON.parse(fs.readFileSync(path, 'utf8'));
    let modified = 0;
    data.attendance = (data.attendance || []).map(a => {
      if (a.status === 'Late') {
        a.status = 'Present';
        modified++;
      }
      return a;
    });
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
    console.log('Local JSON updated Late records to Present:', modified);
  }
}

fixLateStatus().then(() => console.log('Done!')).catch(console.error);
