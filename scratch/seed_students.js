const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const uri = 'mongodb://mohit_app:mohit_app@ac-ft2q9tn-shard-00-00.iye3brk.mongodb.net:27017,ac-ft2q9tn-shard-00-01.iye3brk.mongodb.net:27017,ac-ft2q9tn-shard-00-02.iye3brk.mongodb.net:27017/sssam_academy?ssl=true&replicaSet=atlas-14av5y-shard-0&authSource=admin&appName=Cluster0';

const studentsList = [
  {
    rollNo: 'SSSAM-101',
    name: 'Mohit Yadav',
    phone: '9876543210',
    email: 'mohit@gmail.com',
    password: 'password123',
    course: 'Data Science & AI',
    feeType: 'installment',
    totalCourseFee: 25000,
    paidAmount: 15000,
    remainingFee: 10000,
    dueDate: '2026-09-05',
    currentInstallment: 1,
    totalInstallments: 2,
    gender: 'Male',
    status: 'approved',
    isApproved: true,
    active: true,
    createdAt: new Date('2026-08-01T10:00:00Z')
  },
  {
    rollNo: 'SSSAM-102',
    name: 'Pooja Sharma',
    phone: '9811223344',
    email: 'pooja@gmail.com',
    password: 'password123',
    course: 'Full Stack Web Development',
    feeType: 'single',
    totalCourseFee: 20000,
    paidAmount: 20000,
    remainingFee: 0,
    dueDate: '2026-08-30',
    currentInstallment: 1,
    totalInstallments: 1,
    gender: 'Female',
    status: 'approved',
    isApproved: true,
    active: true,
    createdAt: new Date('2026-08-02T11:00:00Z')
  },
  {
    rollNo: 'SSSAM-103',
    name: 'Rahul Verma',
    phone: '9822334455',
    email: 'rahul@gmail.com',
    password: 'password123',
    course: 'ADCA (Advanced Computer Diploma)',
    feeType: 'installment',
    totalCourseFee: 12000,
    paidAmount: 6000,
    remainingFee: 6000,
    dueDate: '2026-08-20', // Overdue to test late fine
    currentInstallment: 1,
    totalInstallments: 2,
    gender: 'Male',
    status: 'approved',
    isApproved: true,
    active: true,
    createdAt: new Date('2026-08-03T09:30:00Z')
  },
  {
    rollNo: 'SSSAM-104',
    name: 'Satish Soni',
    phone: '9161313828',
    email: 'satishsoni0432@gmail.com',
    password: 'password123',
    course: 'Python & Data Analytics',
    feeType: 'installment',
    totalCourseFee: 15000,
    paidAmount: 10000,
    remainingFee: 5000,
    dueDate: '2026-09-10',
    currentInstallment: 1,
    totalInstallments: 2,
    gender: 'Male',
    status: 'approved',
    isApproved: true,
    active: true,
    createdAt: new Date('2026-08-04T12:00:00Z')
  },
  {
    rollNo: 'SSSAM-105',
    name: 'Neha Gupta',
    phone: '9833445566',
    email: 'neha@gmail.com',
    password: 'password123',
    course: 'Graphic Design & Video Editing',
    feeType: 'single',
    totalCourseFee: 18000,
    paidAmount: 18000,
    remainingFee: 0,
    dueDate: '2026-08-15',
    currentInstallment: 1,
    totalInstallments: 1,
    gender: 'Female',
    status: 'approved',
    isApproved: true,
    active: true,
    createdAt: new Date('2026-08-05T14:15:00Z')
  },
  {
    rollNo: 'SSSAM-106',
    name: 'Aman Kumar',
    phone: '9844556677',
    email: 'aman@gmail.com',
    password: 'password123',
    course: 'DCA (Diploma in Computer Applications)',
    feeType: 'installment',
    totalCourseFee: 8000,
    paidAmount: 4000,
    remainingFee: 4000,
    dueDate: '2026-09-15',
    currentInstallment: 1,
    totalInstallments: 2,
    gender: 'Male',
    status: 'approved',
    isApproved: true,
    active: true,
    createdAt: new Date('2026-08-06T10:45:00Z')
  },
  {
    rollNo: 'SSSAM-107',
    name: 'Kavita Kumari',
    phone: '9855667788',
    email: 'kavita@gmail.com',
    password: 'password123',
    course: 'Tally Prime & GST Accounting',
    feeType: 'installment',
    totalCourseFee: 10000,
    paidAmount: 5000,
    remainingFee: 5000,
    dueDate: '2026-09-01',
    currentInstallment: 1,
    totalInstallments: 2,
    gender: 'Female',
    status: 'approved',
    isApproved: true,
    active: true,
    createdAt: new Date('2026-08-07T11:20:00Z')
  }
];

async function main() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(uri);
  const studentsColl = mongoose.connection.db.collection('students');

  // Insert into MongoDB Atlas
  console.log(`Inserting ${studentsList.length} students into MongoDB Atlas...`);
  const docsToInsert = studentsList.map(s => ({
    ...s,
    _id: new mongoose.Types.ObjectId()
  }));

  await studentsColl.insertMany(docsToInsert);
  console.log('Successfully inserted students into MongoDB Atlas!');

  // Also update local data/database.json
  const dbJsonPath = path.join(__dirname, '..', 'data', 'database.json');
  if (fs.existsSync(dbJsonPath)) {
    const raw = fs.readFileSync(dbJsonPath, 'utf8');
    const data = JSON.parse(raw);
    data.students = docsToInsert.map(d => ({
      ...d,
      id: d._id.toString()
    }));
    fs.writeFileSync(dbJsonPath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Updated local data/database.json with ${data.students.length} students.`);
  }

  console.log('Done!');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
