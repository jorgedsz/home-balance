import { useEffect, useState } from 'react';
import { transactionsAPI, accountsAPI } from '../services/api';
import Modal, { Field, inputClass } from '../components/Modal';
import { fmtMoney, fmtDate, CURRENCIES, TX_CATEGORIES } from '../components/format';

const todayStr = () => new Date().toISOString().slice(0, 10);
const EMPTY = { type: 'egreso', amount: '', currency: 'COP', date: todayStr(), category: 'other', description: '', accountId: '' };

export default function Transacciones() {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' | 'ingreso' | 'egreso'
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const load = async () => {
    setLoading(true);
    try {
      const params = filter === 'all' ? {} : { type: filter };
      const [t, a] = await Promise.all([transactionsAPI.list(params), accountsAPI.list()]);
      setTransactions(t.data.transactions);
      setAccounts(a.data.accounts);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [filter]);

  const save = async () => {
    if (!form.amount || !form.date) return;
    await transactionsAPI.create({ ...form, amount: Number(form.amount) });
    setCreating(false);
    setForm(EMPTY);
    load();
  };

  const remove = async (t) => {
    if (t.billId) {
      alert('Esta transacción pertenece a una factura. Bórrala desde la pestaña Facturas o desmárcala como pagada.');
      return;
    }
    if (!confirm('¿Eliminar esta transacción?')) return;
    await transactionsAPI.remove(t.id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">Ingresos / Egresos</h1>
          <p className="text-sm text-muted">Historial completo de movimientos.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-card border border-border rounded-lg p-0.5 text-sm">
            {['all', 'ingreso', 'egreso'].map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-md ${filter === f ? 'bg-accent text-bg' : 'text-muted hover:text-text'}`}>
                {f === 'all' ? 'Todas' : f === 'ingreso' ? 'Ingresos' : 'Egresos'}
              </button>
            ))}
          </div>
          <button onClick={() => setCreating(true)} className="px-4 py-2 bg-accent text-bg font-semibold text-sm rounded-lg">+ Nueva</button>
        </div>
      </div>

      {loading ? <p className="text-muted">Cargando...</p> : transactions.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-muted">Sin movimientos aún.</div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cardHover text-muted text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-2">Fecha</th>
                <th className="text-left px-4 py-2">Descripción</th>
                <th className="text-left px-4 py-2">Cuenta</th>
                <th className="text-right px-4 py-2">Monto</th>
                <th className="text-center px-4 py-2">Estado</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id} className="border-t border-border hover:bg-cardHover/50">
                  <td className="px-4 py-2 text-muted whitespace-nowrap">{fmtDate(t.date)}</td>
                  <td className="px-4 py-2">
                    <div>{t.description || (t.bill ? t.bill.name : '(sin descripción)')}</div>
                    {t.category && <div className="text-xs text-muted">{TX_CATEGORIES.find(c => c.value === t.category)?.label || t.category}</div>}
                  </td>
                  <td className="px-4 py-2 text-muted">{t.account?.name || '-'}</td>
                  <td className={`px-4 py-2 text-right font-semibold ${t.type === 'ingreso' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {t.type === 'ingreso' ? '+' : '-'}{fmtMoney(t.amount, t.currency)}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span className={`text-[10px] px-2 py-0.5 rounded ${t.isPaid ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      {t.isPaid ? 'Pagada' : 'Pendiente'}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-right">
                    <button onClick={() => remove(t)} className="text-xs text-red-400 hover:bg-red-500/10 px-2 py-1 rounded">Borrar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && (
        <Modal
          title="Nuevo movimiento"
          onClose={() => setCreating(false)}
          footer={
            <>
              <button onClick={() => setCreating(false)} className="px-4 py-2 text-sm text-muted hover:text-text">Cancelar</button>
              <button onClick={save} className="px-4 py-2 bg-accent text-bg text-sm font-semibold rounded-lg">Guardar</button>
            </>
          }
        >
          <Field label="Tipo">
            <div className="flex gap-2">
              {['ingreso', 'egreso'].map(typ => (
                <button key={typ} type="button" onClick={() => setForm({ ...form, type: typ })} className={`flex-1 py-2 rounded-lg text-sm font-semibold border ${form.type === typ ? (typ === 'ingreso' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/15 border-rose-500/30 text-rose-400') : 'border-border text-muted'}`}>
                  {typ === 'ingreso' ? 'Ingreso' : 'Egreso'}
                </button>
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Monto"><input type="number" step="0.01" className={inputClass} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field>
            <Field label="Moneda">
              <select className={inputClass} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Fecha"><input type="date" className={inputClass} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          <Field label="Categoría">
            <select className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {TX_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </Field>
          <Field label="Cuenta">
            <select className={inputClass} value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })}>
              <option value="">— Ninguna —</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
            </select>
          </Field>
          <Field label="Descripción"><input className={inputClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        </Modal>
      )}
    </div>
  );
}
