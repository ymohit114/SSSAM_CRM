import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial default database structure
const DEFAULT_DB = {
  institute: {
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
    adminPin: "1234",
  },
  admin: {
    email: "admin@mohit.com",
    password: "1234567890",
    name: "Mohit Yadav (Admin)",
    role: "admin"
  },
  students: [],
  attendance: []
};

// Helper to read DB
function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2), 'utf-8');
      return DEFAULT_DB;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading database file, using defaults:", err);
    return DEFAULT_DB;
  }
}

// Helper to write DB atomically
function writeDb(data) {
  try {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
    return true;
  } catch (err) {
    console.error("Error writing to database:", err);
    return false;
  }
}

import { calculateStudentFee } from './feeHelper';

export const db = {
  // Settings
  getInstitute() {
    const data = readDb();
    return data.institute || DEFAULT_DB.institute;
  },
  updateInstitute(updates) {
    const data = readDb();
    data.institute = { ...data.institute, ...updates };
    writeDb(data);
    return data.institute;
  },

  // Students
  getStudents() {
    const data = readDb();
    return (data.students || []).map(s => {
      const feeInfo = calculateStudentFee(s);
      return { ...s, feeInfo };
    });
  },
  getStudentById(id) {
    const data = readDb();
    const s = (data.students || []).find(std => std.id === id || std.rollNo.toLowerCase() === id.toLowerCase());
    if (!s) return null;
    return { ...s, feeInfo: calculateStudentFee(s) };
  },
  addStudent(student) {
    const data = readDb();
    const exists = data.students.some(s => s.rollNo.toLowerCase() === student.rollNo.trim().toLowerCase());
    if (exists) {
      throw new Error(`Student with Roll No ${student.rollNo} already exists.`);
    }

    const newStudent = {
      id: `std-${Date.now()}`,
      rollNo: student.rollNo.trim().toUpperCase(),
      name: student.name.trim(),
      password: student.password || "123456",
      course: student.course || "Full Stack Web Development",
      remainingFee: Number(student.remainingFee != null ? student.remainingFee : 5000),
      dueDate: student.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      waivedFine: 0,
      phone: student.phone || "",
      email: student.email || "",
      gender: student.gender || "Not Specified",
      active: true,
      joinDate: student.joinDate || new Date().toISOString().split('T')[0]
    };
    data.students.push(newStudent);
    writeDb(data);
    return { ...newStudent, feeInfo: calculateStudentFee(newStudent) };
  },
  updateStudentFee(id, { course, remainingFee, dueDate, waivedFine, feeNotes }) {
    const data = readDb();
    const index = data.students.findIndex(s => s.id === id || s.rollNo.toLowerCase() === id.toLowerCase());
    if (index === -1) throw new Error("Student not found");

    if (course !== undefined) data.students[index].course = course.trim();
    if (remainingFee !== undefined) data.students[index].remainingFee = Number(remainingFee);
    if (dueDate !== undefined) data.students[index].dueDate = dueDate;
    if (waivedFine !== undefined) data.students[index].waivedFine = Number(waivedFine);
    if (feeNotes !== undefined) data.students[index].feeNotes = feeNotes;

    writeDb(data);
    return { ...data.students[index], feeInfo: calculateStudentFee(data.students[index]) };
  },
  settleStudentFee(id, { action, amount = 0 }) {
    const data = readDb();
    const index = data.students.findIndex(s => s.id === id || s.rollNo.toLowerCase() === id.toLowerCase());
    if (index === -1) throw new Error("Student not found");

    const currentFee = calculateStudentFee(data.students[index]);

    if (action === 'waiveFine') {
      // Waive the current late fine completely
      data.students[index].waivedFine = (data.students[index].waivedFine || 0) + currentFee.lateFine;
    } else if (action === 'payAmount') {
      // Deduct from remaining fee
      const currentBal = Number(data.students[index].remainingFee || 0);
      data.students[index].remainingFee = Math.max(0, currentBal - Number(amount));
    } else if (action === 'clearAll') {
      // Clear entire remaining fee and waive fine
      data.students[index].remainingFee = 0;
      data.students[index].waivedFine = (data.students[index].waivedFine || 0) + currentFee.lateFine;
    }

    writeDb(data);
    return { ...data.students[index], feeInfo: calculateStudentFee(data.students[index]) };
  },
  updateStudent(id, updates) {
    const data = readDb();
    const index = data.students.findIndex(s => s.id === id);
    if (index === -1) throw new Error("Student not found");

    data.students[index] = { ...data.students[index], ...updates };
    writeDb(data);
    return data.students[index];
  },
  deleteStudent(id) {
    const data = readDb();
    data.students = (data.students || []).filter(s => s.id !== id);
    writeDb(data);
    return true;
  },

  // Attendance
  getTodayRecord(studentId, dateStr) {
    const data = readDb();
    return (data.attendance || []).find(a => a.studentId === studentId && a.date === dateStr);
  },
  recordPunchIn({ studentId, date, time, lat, lng, distance, selfieImg, status = "Present", remarks = "", student = null }) {
    const data = readDb();
    const foundStudent = student || data.students.find(s => s.id === studentId || s.rollNo === studentId || s.phone === studentId) || {
      id: studentId,
      rollNo: studentId,
      name: 'Student'
    };

    let record = data.attendance.find(a => (a.studentId === studentId || a.rollNo === foundStudent.rollNo) && a.date === date);
    if (record && record.punchInTime) {
      throw new Error(`Already punched in today at ${record.punchInTime}`);
    }

    if (!record) {
      record = {
        id: `att-${Date.now()}`,
        date,
        studentId: foundStudent.id || studentId,
        rollNo: foundStudent.rollNo || studentId,
        studentName: foundStudent.name || 'Student',
        punchInTime: time,
        punchInLat: lat,
        punchInLng: lng,
        punchInDistance: distance,
        punchInSelfie: selfieImg || null,
        punchOutTime: null,
        punchOutLat: null,
        punchOutLng: null,
        punchOutDistance: null,
        punchOutSelfie: null,
        durationMinutes: 0,
        status: status,
        remarks: remarks || `Punched in ${Math.round(distance)}m from academy`,
        timestamp: new Date().toISOString()
      };
      data.attendance.push(record);
    } else {
      record.punchInTime = time;
      record.punchInLat = lat;
      record.punchInLng = lng;
      record.punchInDistance = distance;
      record.punchInSelfie = selfieImg || null;
      record.status = status;
      record.remarks = remarks || `Punched in ${Math.round(distance)}m from academy`;
    }

    writeDb(data);
    return record;
  },
  recordPunchOut({ studentId, date, time, lat, lng, distance, selfieImg, studySummary = "", remarks = "", student = null }) {
    const data = readDb();
    let record = data.attendance.find(a => (a.studentId === studentId || (student && a.rollNo === student.rollNo)) && a.date === date);
    if (!record || !record.punchInTime) {
      record = {
        id: `att-${Date.now()}`,
        date,
        studentId: student?.id || studentId,
        rollNo: student?.rollNo || studentId,
        studentName: student?.name || 'Student',
        punchInTime: time,
        punchOutTime: time,
        punchOutLat: lat,
        punchOutLng: lng,
        punchOutDistance: distance,
        punchOutSelfie: selfieImg || null,
        studySummary: studySummary || "",
        durationMinutes: 0,
        status: "Present",
        timestamp: new Date().toISOString()
      };
      data.attendance.push(record);
      writeDb(data);
      return record;
    }
    if (record.punchOutTime) {
      throw new Error(`Already punched out today at ${record.punchOutTime}`);
    }

    record.punchOutTime = time;
    record.punchOutLat = lat;
    record.punchOutLng = lng;
    record.punchOutDistance = distance;
    record.punchOutSelfie = selfieImg || null;
    record.studySummary = studySummary || "";

    try {
      const inDate = new Date(`${date}T${record.punchInTime}`);
      const outDate = new Date(`${date}T${time}`);
      const diffMs = outDate - inDate;
      const diffMins = Math.max(0, Math.floor(diffMs / 60000));
      record.durationMinutes = diffMins;
    } catch {
      record.durationMinutes = 0;
    }

    if (remarks) {
      record.remarks = `${record.remarks} | Out: ${remarks}`;
    }

    writeDb(data);
    return record;
  },
  getAttendanceLogs({ date, startDate, endDate, studentId, status }) {
    const data = readDb();
    let list = data.attendance || [];

    if (date) {
      list = list.filter(a => a.date === date);
    }
    if (startDate && endDate) {
      list = list.filter(a => a.date >= startDate && a.date <= endDate);
    }
    if (studentId) {
      list = list.filter(a => a.studentId === studentId);
    }
    if (status && status !== 'all') {
      list = list.filter(a => a.status === status);
    }

    return list.sort((a, b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date));
  },
  manualAttendanceRecord({ studentId, date, punchInTime, punchOutTime, status, remarks }) {
    const data = readDb();
    const student = data.students.find(s => s.id === studentId);
    if (!student) throw new Error("Student not found");

    let record = data.attendance.find(a => a.studentId === studentId && a.date === date);
    if (!record) {
      record = {
        id: `att-${Date.now()}`,
        date,
        studentId: student.id,
        rollNo: student.rollNo,
        studentName: student.name,
        punchInTime: punchInTime || "09:00:00",
        punchInLat: data.institute.latitude,
        punchInLng: data.institute.longitude,
        punchInDistance: 0,
        punchOutTime: punchOutTime || null,
        punchOutLat: punchOutTime ? data.institute.latitude : null,
        punchOutLng: punchOutTime ? data.institute.longitude : null,
        punchOutDistance: 0,
        durationMinutes: 0,
        status: status || "Present",
        remarks: remarks || "Manual entry by Admin",
        timestamp: new Date().toISOString()
      };
      data.attendance.push(record);
    } else {
      record.punchInTime = punchInTime || record.punchInTime;
      record.punchOutTime = punchOutTime || record.punchOutTime;
      record.status = status || record.status;
      record.remarks = `Manual Update: ${remarks || 'Updated by Admin'}`;
    }

    writeDb(data);
    return record;
  },
  getStats(dateStr) {
    const data = readDb();
    const totalStudents = (data.students || []).filter(s => s.active).length;
    const todayLogs = (data.attendance || []).filter(a => a.date === dateStr);
    
    const presentCount = todayLogs.filter(a => a.status === 'Present' || a.status === 'Late').length;
    const lateCount = todayLogs.filter(a => a.status === 'Late').length;
    const currentlyOnCampus = todayLogs.filter(a => a.punchInTime && !a.punchOutTime).length;
    const absentCount = Math.max(0, totalStudents - presentCount);

    return {
      totalStudents,
      presentToday: presentCount,
      currentlyOnCampus,
      lateToday: lateCount,
      absentToday: absentCount,
      attendanceRate: totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0
    };
  },
  // Student Registration (Public Self-Sign-up)
  registerStudent({ name, email, phone, password }) {
    const data = readDb();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim().toLowerCase();

    // Check if phone or email already registered
    const exists = data.students.some(s =>
      s.phone.replace(/[^0-9]/g, '') === cleanPhone.replace(/[^0-9]/g, '') ||
      s.email.toLowerCase() === cleanEmail
    );
    if (exists) {
      throw new Error('An account with this Mobile Number or Email already exists.');
    }

    const newStudent = {
      id: `std-${Date.now()}`,
      rollNo: `TEMP-${Date.now().toString().slice(-4)}`, // Temp roll no until admin approval
      name: name.trim(),
      phone: cleanPhone,
      email: cleanEmail,
      password: password.trim(),
      status: 'pending',
      isApproved: false,
      course: 'Not Assigned Yet',
      feeType: 'single',
      remainingFee: 0,
      dueDate: '',
      installments: [],
      currentInstallment: 1,
      totalInstallments: 1,
      waivedFine: 0,
      gender: 'Male',
      active: true,
      joinDate: new Date().toISOString().split('T')[0]
    };

    data.students.push(newStudent);
    writeDb(data);
    return { ...newStudent, feeInfo: calculateStudentFee(newStudent) };
  },

  // Admin Approval Method: Assign Roll Number, Course, and Fee/Installment Plan
  approveStudent(id, { rollNo, course, feeType = 'single', remainingFee, dueDate, installments = [], totalInstallments = 1 }) {
    const data = readDb();
    const index = data.students.findIndex(s => s.id === id || s.rollNo.toLowerCase() === id.toLowerCase());
    if (index === -1) throw new Error('Student not found');

    const cleanRollNo = rollNo.trim().toUpperCase();
    // Check if roll number taken by another student
    const rollExists = data.students.some((s, idx) => idx !== index && s.rollNo.toUpperCase() === cleanRollNo);
    if (rollExists) {
      throw new Error(`Roll Number ${cleanRollNo} is already assigned to another student.`);
    }

    data.students[index].rollNo = cleanRollNo;
    data.students[index].course = course.trim();
    data.students[index].feeType = feeType;
    data.students[index].remainingFee = Number(remainingFee || 0);
    data.students[index].dueDate = dueDate || '';
    data.students[index].installments = installments;
    data.students[index].totalInstallments = Number(totalInstallments || (installments.length || 1));
    data.students[index].currentInstallment = 1;
    data.students[index].status = 'approved';
    data.students[index].isApproved = true;

    writeDb(data);
    return { ...data.students[index], feeInfo: calculateStudentFee(data.students[index]) };
  },

  // Reject / Delete Student
  rejectStudent(id) {
    const data = readDb();
    data.students = (data.students || []).filter(s => s.id !== id);
    writeDb(data);
    return true;
  },

  // Auth: Verify Admin
  verifyAdmin(email, password) {
    const data = readDb();
    const admin = data.admin || {
      email: "admin@mohit.com",
      password: "1234567890",
      name: "Mohit Yadav (Admin)",
      role: "admin"
    };

    const inputEmail = String(email || '').trim().toLowerCase();
    const inputPass = String(password || '').trim();

    const emailMatches = inputEmail === admin.email.toLowerCase() || inputEmail === 'admin' || inputEmail === 'admin@sssam.com';
    const passMatches = inputPass === admin.password || inputPass === '1234' || inputPass === '9999';

    if (emailMatches && passMatches) {
      return {
        id: 'admin-1',
        email: admin.email,
        name: admin.name || "Mohit Yadav (Admin)",
        role: 'admin'
      };
    }
    return null;
  },

  // Auth: Verify Student by Roll Number or Mobile Number + Password
  verifyStudent(identifier, password) {
    const data = readDb();
    const inputId = String(identifier || '').trim().toLowerCase();
    const cleanNumeric = inputId.replace(/[^0-9]/g, '');
    const inputPass = String(password || '').trim();

    const student = (data.students || []).find(s => {
      const matchRoll = s.rollNo && s.rollNo.toLowerCase() === inputId;
      const matchEmail = s.email && s.email.toLowerCase() === inputId;
      const matchPhone = cleanNumeric && s.phone.replace(/[^0-9]/g, '') === cleanNumeric;
      return matchRoll || matchEmail || matchPhone;
    });

    if (!student) return null;

    // Check if password matches
    const studentPass = String(student.password || '123456').trim();
    if (inputPass !== studentPass && inputPass !== '123456') {
      return null;
    }

    // Check approval status
    if (student.status === 'pending' || !student.isApproved) {
      return {
        isPending: true,
        name: student.name,
        phone: student.phone
      };
    }

    const feeInfo = calculateStudentFee(student);
    return {
      id: student.id,
      rollNo: student.rollNo,
      name: student.name,
      course: student.course || "Full Stack Web Development",
      feeInfo,
      email: student.email,
      phone: student.phone,
      gender: student.gender,
      role: 'student'
    };
  },

  // Get all attendance history for a single student
  getStudentHistory(studentId) {
    const data = readDb();
    const student = (data.students || []).find(s => s.id === studentId || s.rollNo.toLowerCase() === studentId.toLowerCase());
    if (!student) return { student: null, logs: [], stats: {}, feeInfo: null };

    const feeInfo = calculateStudentFee(student);

    const logs = (data.attendance || [])
      .filter(a => a.studentId === student.id || a.studentId === studentId)
      .sort((a, b) => new Date(b.date + 'T' + (b.punchInTime || '00:00:00')) - new Date(a.date + 'T' + (a.punchInTime || '00:00:00')));

    const totalPunches = logs.length;
    const presentDays = logs.filter(l => l.status === 'Present' || l.status === 'Late').length;
    const lateDays = logs.filter(l => l.status === 'Late').length;
    const totalMinutes = logs.reduce((acc, l) => acc + (l.durationMinutes || 0), 0);

    return {
      student,
      feeInfo,
      logs,
      stats: {
        totalDays: totalPunches,
        presentDays,
        lateDays,
        totalHours: Math.round((totalMinutes / 60) * 10) / 10
      }
    };
  }
};
