import { useEffect, useState } from 'react';
import { billsAPI, accountsAPI, transactionsAPI } from '../services/api';
import Modal, { Field, inputClass } from '../components/Modal';
import { fmtMoney, fmtDate, CURRENCIES, BILL_CATEGORIES } from '../components/format';

const todayStr = () => new Date().toISOString().slice(0, 10);
const EMPTY = { name: '', category: 'other', totalAmount: '', cuotas: 1, startDate: todayStr(), currency: 'COP', accountId: '', notes: '' };

export default function Facturas() {
  const [bills, setBills] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [expanded, setExpanded] = useState(null);
  const [cuotaList, setCuotaList] = useState({}); // billId -> transactions[]

  const load = async () => {
    setLoading(true);
    try {
      const [b, a] = await Promise.all([billsAPI.list(), accountsAPI.list()]);
      setBills(b.data.bills);
      setAccounts(a.data.accounts);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name.trim() || !form.totalAmount) return;
    await billsAPI.create({ ...form, totalAmount: Number(form.totalAmount), cuotas: Number(form.cuotas) });
    setCreating(false);
    setForm(EMPTY);
    load();
  };

  const remove = async (b) => {
    if (!confirm(`¿Eliminar la factura "${b.name}"? Las cuotas pagadas se conservarán como egresos sueltos.`)) return;
    await billsAPI.remove(b.id);
    load();
  };

  const toggleExpand = async (billId) => {
    if (expanded === billId) { setExpanded(null); return; }
    setExpanded(billId);
    if (!cuotaList[billId]) {
      const { data } = await transactionsAPI.list({ limit: 100 });
      const mine = data.transactions.filter(t => t.bill?.id === billId).sort((a, b) => new Date(a.date) - new Date(b.date));
      setCuotaList(prev => ({ ...prev, [billId]: mine }));
    }
  };

  const togglePaid = async (txId, billId) => {
    await transactionsAPI.togglePaid(txId);
    const { data } = await transactionsAPI.list({ limit: 100 });
    const mine = data.transactions.filter(t => t.bill?.id === billId).sort((a, b) => new Date(a.date) - new Date(b.date));
    setCuotaList(prev => ({ ...prev, [billId]: mine }));
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Facturas</h1>
          <p className="text-sm text-muted">Suscripciones, préstamos y compras a cuotas. Cada factura genera sus egresos mensuales.</p>
        </div>
        <button onClick={() => setCreating(true)} className="px-4 py-2 bg-accent text-bg font-semibold text-sm rounded-lg">+ Nueva factura</button>
      </div>

      {loading ? <p className="text-muted">Cargando...</p> : bills.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-muted">Aún no tienes facturas registradas.</div>
      ) : (
        <div className="space-y-3">
          {bills.map(b => {
            const isOpen = expanded === b.id;
            const pct = b.cuotas > 0 ? (b.paidCuotas / b.cuotas) * 100 : 0;
            return (
              <div key={b.id} className="bg-card border border-border rounded-xl overflow-hidden">
                <button onClick={() => toggleExpand(b.id)} className="w-full text-left px-5 py-4 hover:bg-cardHover">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{b.name}</span>
                        {b.category && <span className="text-[10px] px-1.5 py-0.5 rounded bg-border/60 text-muted">{BILL_CATEGORIES.find(c => c.value === b.category)?.label || b.category}</span>}
                      </div>
                      <div className="text-xs text-muted mt-0.5">
                        {fmtMoney(b.cuotaAmount, b.currency)} × {b.cuotas} • Total {fmtMoney(b.totalAmount, b.currency)}
                        {b.account && <> • {b.account.name}</>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{b.paidCuotas} / {b.cuotas} cuotas</div>
                      <div className="text-xs text-muted">{b.nextDueDate ? `Próx: ${fmtDate(b.nextDueDate)}` : 'Pagada'}</div>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 bg-border rounded-full overflow-hidden">
                    <div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t border-border px-5 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted uppercase tracking-wider">Cuotas</span>
                      <button onClick={() => remove(b)} className="text-xs text-red-400 hover:bg-red-500/10 px-2 py-1 rounded">Eliminar factura</button>
                    </div>
                    <div className="space-y-1">
                      {(cuotaList[b.id] || []).map(t => (
                        <div key={t.id} className="flex items-center justify-between px-3 py-2 rounded hover:bg-cardHover">
                          <div className="flex items-center gap-3">
                            <input type="checkbox" checked={t.isPaid} onChange={() => togglePaid(t.id, b.id)} className="accent-accent" />
                            <span className="text-sm">Cuota {t.cuotaNumber}</span>
                            <span className="text-xs text-muted">{fmtDate(t.date)}</span>
                          </div>
                          <div className={`text-sm ${t.isPaid ? 'text-muted line-through' : ''}`}>{fmtMoney(t.amount, t.currency)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {creating && (
        <Modal
          title="Nueva factura"
          onClose={() => setCreating(false)}
          footer={
            <>
              <button onClick={() => setCreating(false)} className="px-4 py-2 text-sm text-muted hover:text-text">Cancelar</button>
              <button onClick={save} className="px-4 py-2 bg-accent text-bg text-sm font-semibold rounded-lg">Crear</button>
            </>
          }
        >
          <Field label="Nombre"><input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Nevera Samsung" /></Field>
          <Field label="Categoría">
            <select className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {BILL_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Monto total"><input type="number" step="0.01" className={inputClass} value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} /></Field>
            <Field label="Moneda">
              <select className={inputClass} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cuotas (1–36)"><input type="number" min="1" max="36" className={inputClass} value={form.cuotas} onChange={(e) => setForm({ ...form, cuotas: e.target.value })} /></Field>
            <Field label="Fecha primera cuota"><input type="date" className={inputClass} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></Field>
          </div>
          <Field label="Cuenta de pago (opcional)">
            <select className={inputClass} value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })}>
              <option value="">— Ninguna —</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
            </select>
          </Field>
          <Field label="Notas"><textarea rows={2} className={inputClass} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
          {form.totalAmount && form.cuotas > 0 && (
            <p className="text-xs text-muted">Se crearán {form.cuotas} egresos mensuales de {fmtMoney(Number(form.totalAmount) / Number(form.cuotas), form.currency)} cada uno.</p>
          )}
        </Modal>
      )}
    </div>
  );
}
