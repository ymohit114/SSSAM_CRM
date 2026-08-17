/**
 * SSSAM Academy Fee Reminder Service
 * Calculates 7-day upcoming due dates and formats automated morning, evening, and punch-in reminder messages.
 */

export function checkStudentFeeDueStatus(student) {
  if (!student) return { hasReminder: false };

  const remainingFee = Number(student.remainingFee || (student.feeInfo ? student.feeInfo.remainingFee : 0));
  if (remainingFee <= 0) {
    return { hasReminder: false, remainingFee: 0 };
  }

  const dueDateStr = student.dueDate || (student.feeInfo ? student.feeInfo.dueDate : '');
  if (!dueDateStr) {
    return { hasReminder: false, remainingFee };
  }

  const now = new Date();
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const dueParts = dueDateStr.split('-').map(Number);
  if (dueParts.length !== 3) return { hasReminder: false };

  const dueDate = new Date(dueParts[0], dueParts[1] - 1, dueParts[2]);
  const diffTime = dueDate.getTime() - todayDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // If due date is within 7 days or overdue (diffDays <= 7)
  if (diffDays <= 7) {
    const isOverdue = diffDays < 0;
    const daysLabel = isOverdue
      ? `${Math.abs(diffDays)} Days Overdue`
      : diffDays === 0
      ? 'Due Today'
      : `${diffDays} Day${diffDays > 1 ? 's' : ''} Left`;

    return {
      hasReminder: true,
      isOverdue,
      daysUntilDue: diffDays,
      daysLabel,
      dueDate: dueDateStr,
      remainingFee,
      studentName: student.name,
      studentId: student.id,
      rollNo: student.rollNo,
      // Formatted reminder messages
      morningMessage: isOverdue
        ? `🚨 Urgent Overdue Fee Notice: Your fee payment of ₹${remainingFee.toLocaleString('en-IN')} is ${Math.abs(diffDays)} days overdue. A late fine of ₹150 applies for every 2 overdue days.`
        : `🔔 SSSAM Fee Reminder: Your upcoming installment of ₹${remainingFee.toLocaleString('en-IN')} is due on ${dueDateStr} (${daysLabel}). Please pay on time to avoid late fine.`,
      eveningMessage: isOverdue
        ? `🔔 Evening Alert: You have an overdue fee balance of ₹${remainingFee.toLocaleString('en-IN')}. Please contact academy administration.`
        : `🔔 Evening Reminder: Fee Due Date approaching on ${dueDateStr} (${daysLabel}). Remaining: ₹${remainingFee.toLocaleString('en-IN')}.`,
      punchInMessage: isOverdue
        ? `⚠️ Important: Your fee payment is overdue by ${Math.abs(diffDays)} days (₹${remainingFee.toLocaleString('en-IN')}). Late fine applies.`
        : `📌 Important Fee Notice: Your fee of ₹${remainingFee.toLocaleString('en-IN')} is due on ${dueDateStr} (${daysLabel}). Please pay on or before due date.`
    };
  }

  return { hasReminder: false, remainingFee, dueDate: dueDateStr };
}
