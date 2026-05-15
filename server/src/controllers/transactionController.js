const listTransactions = async (req, res) => {
  const { type, accountId, from, to, limit } = req.query;
  const where = {};
  if (type && (type === 'ingreso' || type === 'egreso')) where.type = type;
  if (accountId) where.accountId = accountId;
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to);
  }
  const transactions = await req.prisma.transaction.findMany({
    where,
    orderBy: { date: 'desc' },
    take: limit ? Math.min(parseInt(limit, 10) || 100, 500) : 500,
    include: {
      account: { select: { id: true, name: true } },
      bill: { select: { id: true, name: true } }
    }
  });
  res.json({ transactions });
};

const createTransaction = async (req, res) => {
  const { type, amount, currency, date, category, description, accountId } = req.body || {};
  if (type !== 'ingreso' && type !== 'egreso') return res.status(400).json({ error: 'type must be ingreso or egreso' });
  const amt = Number(amount);
  if (!amt || amt <= 0) return res.status(400).json({ error: 'amount must be > 0' });
  if (!currency) return res.status(400).json({ error: 'currency required' });
  if (!date) return res.status(400).json({ error: 'date required' });
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return res.status(400).json({ error: 'invalid date' });

  const transaction = await req.prisma.transaction.create({
    data: {
      type,
      amount: amt,
      currency: currency.toUpperCase(),
      date: d,
      category: category || null,
      description: description || null,
      accountId: accountId || null,
      isPaid: true
    }
  });
  res.status(201).json({ transaction });
};

const updateTransaction = async (req, res) => {
  const { id } = req.params;
  const { amount, date, category, description, accountId, isPaid } = req.body || {};
  const existing = await req.prisma.transaction.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const data = {};
  if (amount !== undefined) data.amount = Number(amount);
  if (date !== undefined) data.date = new Date(date);
  if (category !== undefined) data.category = category || null;
  if (description !== undefined) data.description = description || null;
  if (accountId !== undefined) data.accountId = accountId || null;
  if (isPaid !== undefined) data.isPaid = Boolean(isPaid);
  const transaction = await req.prisma.transaction.update({ where: { id }, data });
  res.json({ transaction });
};

const deleteTransaction = async (req, res) => {
  const { id } = req.params;
  await req.prisma.transaction.delete({ where: { id } });
  res.json({ ok: true });
};

// Quick toggle used by the Facturas page on each cuota row.
const togglePaid = async (req, res) => {
  const { id } = req.params;
  const existing = await req.prisma.transaction.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const transaction = await req.prisma.transaction.update({
    where: { id },
    data: { isPaid: !existing.isPaid }
  });
  res.json({ transaction });
};

module.exports = { listTransactions, createTransaction, updateTransaction, deleteTransaction, togglePaid };
