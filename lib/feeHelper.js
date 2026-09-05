/**
 * Helper to calculate Late Fine and Total Remaining Fee
 * Supports both One-Time & Installment Plans
 * Rule: Late fine applies ONLY if remainingFee > 0 and past dueDate (₹150 for every 2 days overdue).
 * If remainingFee <= 0, lateFine is STRICTLY 0 and status is All Dues Cleared.
 */
export function calculateStudentFee(student) {
  const feeType = student?.feeType || 'single';
  const remainingFee = Number(student?.remainingFee || 0);
  const course = student?.course || 'Not Assigned Yet';
  const dueDate = student?.dueDate || '';
  const waivedFine = Number(student?.waivedFine || 0);
  const installments = Array.isArray(student?.installments) ? student.installments : [];
  const currentInstallment = Number(student?.currentInstallment || 1);
  const totalInstallments = Number(student?.totalInstallments || (installments.length || 1));

  // IF REMAINING FEE IS 0 OR LESS, NO FINE CAN EVER BE APPLIED
  if (remainingFee <= 0) {
    return {
      course,
      feeType,
      remainingFee: 0,
      baseRemainingFee: 0,
      dueDate: dueDate || 'N/A',
      daysOverdue: 0,
      lateFine: 0,
      rawFine: 0,
      waivedFine: 0,
      finePeriods: 0,
      totalRemainingPayable: 0,
      installments,
      currentInstallment,
      totalInstallments,
      status: 'Paid',
      statusLabel: 'All Dues Cleared 🎉'
    };
  }

  let daysOverdue = 0;
  let finePeriods = 0;
  let rawFine = 0;

  if (dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);

    const diffMs = today - due;
    if (diffMs > 0) {
      daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      // Every 2 days overdue = ₹150 fine (strictly applies only when remainingFee > 0)
      finePeriods = Math.floor(daysOverdue / 2);
      rawFine = finePeriods * 150;
    }
  }

  const lateFine = Math.max(0, rawFine - waivedFine);
  const totalRemainingPayable = remainingFee + lateFine;

  let status = 'Pending';
  let statusLabel = 'Payment Pending';

  if (daysOverdue > 0 && lateFine > 0) {
    status = 'Overdue';
    statusLabel = `${daysOverdue} Days Overdue (+₹${lateFine} Late Fine)`;
  } else if (daysOverdue > 0) {
    status = 'Overdue';
    statusLabel = `${daysOverdue} Days Overdue`;
  }

  return {
    course,
    feeType,
    remainingFee: totalRemainingPayable,
    baseRemainingFee: remainingFee,
    dueDate,
    daysOverdue,
    lateFine,
    rawFine,
    waivedFine,
    finePeriods,
    totalRemainingPayable,
    installments,
    currentInstallment,
    totalInstallments,
    status,
    statusLabel
  };
}
