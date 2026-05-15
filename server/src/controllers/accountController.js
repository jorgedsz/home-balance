const listAccounts = async (req, res) => {
  const accounts = await req.prisma.account.findMany({
    orderBy: { createdAt: 'asc' }
  });
  res.json({ accounts });
};

const createAccount = async (req, res) => {
  const { name, type, currency, balance, notes } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name required' });
  if (!currency) return res.status(400).json({ error: 'currency required' });
  const account = await req.prisma.account.create({
    data: {
      name: name.trim(),
      type: type || 'checking',
      currency: currency.toUpperCase(),
      balance: Number(balance) || 0,
      notes: notes || null
    }
  });
  res.status(201).json({ account });
};

const updateAccount = async (req, res) => {
  const { id } = req.params;
  const { name, type, currency, balance, notes } = req.body || {};
  const existing = await req.prisma.account.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const account = await req.prisma.account.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(type !== undefined ? { type } : {}),
      ...(currency !== undefined ? { currency: currency.toUpperCase() } : {}),
      ...(balance !== undefined ? { balance: Number(balance) } : {}),
      ...(notes !== undefined ? { notes: notes || null } : {})
    }
  });
  res.json({ account });
};

const deleteAccount = async (req, res) => {
  const { id } = req.params;
  await req.prisma.account.delete({ where: { id } });
  res.json({ ok: true });
};

module.exports = { listAccounts, createAccount, updateAccount, deleteAccount };
