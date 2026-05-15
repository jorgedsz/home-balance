// Aggregates broken down by currency. We never convert between currencies —
// each currency has its own totals and chart series so nothing is mixed up.
const getOverview = async (req, res) => {
  const monthsBack = Math.min(parseInt(req.query.months, 10) || 6, 24);

  const [accounts, transactions, upcomingCuotas] = await Promise.all([
    req.prisma.account.findMany(),
    req.prisma.transaction.findMany({
      where: {
        isPaid: true,
        date: { gte: startOfMonth(monthsBack - 1) }
      }
    }),
    req.prisma.transaction.findMany({
      where: { isPaid: false, billId: { not: null } },
      orderBy: { date: 'asc' },
      take: 8,
      include: { bill: { select: { name: true } }, account: { select: { name: true } } }
    })
  ]);

  // Per-currency balance totals across all accounts.
  const balancesByCurrency = accounts.reduce((acc, a) => {
    acc[a.currency] = (acc[a.currency] || 0) + a.balance;
    return acc;
  }, {});

  // Per-currency monthly cash-flow series for the last N months.
  const monthBuckets = Array.from({ length: monthsBack }, (_, i) => {
    const d = startOfMonth(monthsBack - 1 - i);
    return { key: monthKey(d), label: monthLabel(d), date: d };
  });
  const cashFlowByCurrency = {};
  for (const tx of transactions) {
    const cur = tx.currency;
    if (!cashFlowByCurrency[cur]) {
      cashFlowByCurrency[cur] = monthBuckets.map(b => ({ ...b, ingreso: 0, egreso: 0 }));
    }
    const key = monthKey(tx.date);
    const bucket = cashFlowByCurrency[cur].find(b => b.key === key);
    if (!bucket) continue;
    if (tx.type === 'ingreso') bucket.ingreso += tx.amount;
    else bucket.egreso += tx.amount;
  }

  res.json({
    balancesByCurrency,
    accountsCount: accounts.length,
    cashFlowByCurrency,
    upcomingCuotas: upcomingCuotas.map(t => ({
      id: t.id,
      date: t.date,
      amount: t.amount,
      currency: t.currency,
      billName: t.bill?.name || null,
      accountName: t.account?.name || null,
      cuotaNumber: t.cuotaNumber
    }))
  });
};

const startOfMonth = (monthsAgo) => {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - monthsAgo, 1));
};
const monthKey = (date) => {
  const d = new Date(date);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};
const monthLabel = (date) => {
  return new Date(date).toLocaleString('es-ES', { month: 'short', year: '2-digit' });
};

module.exports = { getOverview };
