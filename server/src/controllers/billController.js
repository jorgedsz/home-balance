// Add a whole number of months to a date, clamping the day to the last day of
// the target month (so Jan 31 + 1 month = Feb 28/29 instead of overflowing).
const addMonths = (date, months) => {
  const d = new Date(date);
  const targetMonth = d.getUTCMonth() + months;
  const result = new Date(Date.UTC(d.getUTCFullYear(), targetMonth, 1));
  const lastDayOfTargetMonth = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(d.getUTCDate(), lastDayOfTargetMonth));
  return result;
};

const listBills = async (req, res) => {
  const bills = await req.prisma.bill.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      account: { select: { id: true, name: true } },
      transactions: { select: { id: true, isPaid: true, cuotaNumber: true, date: true, amount: true } }
    }
  });
  const enriched = bills.map(b => {
    const paid = b.transactions.filter(t => t.isPaid).length;
    const nextUnpaid = b.transactions
      .filter(t => !t.isPaid)
      .sort((a, c) => new Date(a.date) - new Date(c.date))[0];
    return {
      ...b,
      paidCuotas: paid,
      remainingCuotas: b.cuotas - paid,
      cuotaAmount: b.totalAmount / b.cuotas,
      nextDueDate: nextUnpaid?.date || null
    };
  });
  res.json({ bills: enriched });
};

const createBill = async (req, res) => {
  const { name, category, totalAmount, cuotas, startDate, currency, notes, accountId } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name required' });
  if (!totalAmount || Number(totalAmount) <= 0) return res.status(400).json({ error: 'totalAmount must be > 0' });
  const n = parseInt(cuotas, 10);
  if (!Number.isInteger(n) || n < 1 || n > 36) return res.status(400).json({ error: 'cuotas must be 1..36' });
  if (!startDate) return res.status(400).json({ error: 'startDate required' });
  if (!currency) return res.status(400).json({ error: 'currency required' });

  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return res.status(400).json({ error: 'invalid startDate' });

  const cuotaAmount = Number(totalAmount) / n;
  const cur = currency.toUpperCase();

  // Wrap in a transaction so the bill + N scheduled cuotas commit atomically.
  const bill = await req.prisma.$transaction(async tx => {
    const created = await tx.bill.create({
      data: {
        name: name.trim(),
        category: category || null,
        totalAmount: Number(totalAmount),
        cuotas: n,
        startDate: start,
        currency: cur,
        notes: notes || null,
        accountId: accountId || null
      }
    });
    const rows = Array.from({ length: n }, (_, i) => ({
      type: 'egreso',
      amount: cuotaAmount,
      currency: cur,
      date: addMonths(start, i),
      category: category || null,
      description: `${created.name} — cuota ${i + 1}/${n}`,
      accountId: accountId || null,
      billId: created.id,
      cuotaNumber: i + 1,
      isPaid: false
    }));
    await tx.transaction.createMany({ data: rows });
    return created;
  });

  res.status(201).json({ bill });
};

const updateBill = async (req, res) => {
  const { id } = req.params;
  const { name, category, notes, accountId } = req.body || {};
  const existing = await req.prisma.bill.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: 'Not found' });
  // Editing totalAmount/cuotas/startDate is intentionally not supported — those
  // would require regenerating the scheduled cuotas, which would lose paid history.
  // Delete + recreate the bill if you need to change them.
  const bill = await req.prisma.bill.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(category !== undefined ? { category: category || null } : {}),
      ...(notes !== undefined ? { notes: notes || null } : {}),
      ...(accountId !== undefined ? { accountId: accountId || null } : {})
    }
  });
  res.json({ bill });
};

const deleteBill = async (req, res) => {
  const { id } = req.params;
  // Detach cuotas instead of deleting them, so paid ones remain in the ledger.
  await req.prisma.transaction.updateMany({
    where: { billId: id },
    data: { billId: null }
  });
  await req.prisma.bill.delete({ where: { id } });
  res.json({ ok: true });
};

module.exports = { listBills, createBill, updateBill, deleteBill };
