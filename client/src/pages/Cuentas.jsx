import { useEffect, useState } from 'react';
import { accountsAPI } from '../services/api';
import Modal, { Field, inputClass } from '../components/Modal';
import { fmtMoney, CURRENCIES, ACCOUNT_TYPES } from '../components/format';

const EMPTY = { name: '', type: 'checking', currency: 'COP', balance: '', notes: '' };

export default function Cuentas() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | 'new' | account object
  const [form, setForm] = useState(EMPTY);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await accountsAPI.list();
      setAccounts(data.accounts);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(EMPTY); setEditing('new'); };
  const openEdit = (a) => { setForm({ name: a.name, type: a.type, currency: a.currency, balance: a.balance, notes: a.notes || '' }); setEditing(a); };
  const close = () => { setEditing(null); setForm(EMPTY); };

  const save = async () => {
    if (!form.name.trim()) return;
    if (editing === 'new') await accountsAPI.create(form);
    else await accountsAPI.update(editing.id, form);
    close();
    load();
  };

  const remove = async (a) => {
    if (!confirm(`¿Eliminar la cuenta "${a.name}"?`)) return;
    await accountsAPI.remove(a.id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Cuentas</h1>
          <p className="text-sm text-muted">Lleva el saldo de tus cuentas, tarjetas y efectivo.</p>
        </div>
        <button onClick={openNew} className="px-4 py-2 bg-accent text-bg font-semibold text-sm rounded-lg">+ Nueva cuenta</button>
      </div>

      {loading ? (
        <p className="text-muted">Cargando...</p>
      ) : accounts.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-muted">
          Aún no tienes cuentas. Crea la primera para empezar.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map(a => (
            <div key={a.id} className="bg-card border border-border rounded-xl p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{a.name}</div>
                  <div className="text-xs text-muted">{ACCOUNT_TYPES.find(t => t.value === a.type)?.label || a.type}</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-accent/10 text-accent">{a.currency}</span>
              </div>
              <div className="text-2xl font-bold">{fmtMoney(a.balance, a.currency)}</div>
              {a.notes && <p className="text-xs text-muted line-clamp-2">{a.notes}</p>}
              <div className="flex gap-2 pt-1">
                <button onClick={() => openEdit(a)} className="text-xs px-3 py-1 rounded border border-border hover:bg-cardHover">Editar</button>
                <button onClick={() => remove(a)} className="text-xs px-3 py-1 rounded text-red-400 hover:bg-red-500/10">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <Modal
          title={editing === 'new' ? 'Nueva cuenta' : 'Editar cuenta'}
          onClose={close}
          footer={
            <>
              <button onClick={close} className="px-4 py-2 text-sm text-muted hover:text-text">Cancelar</button>
              <button onClick={save} className="px-4 py-2 bg-accent text-bg text-sm font-semibold rounded-lg">Guardar</button>
            </>
          }
        >
          <Field label="Nombre"><input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Tipo">
            <select className={inputClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {ACCOUNT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Moneda">
              <select className={inputClass} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Saldo actual"><input type="number" step="0.01" className={inputClass} value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} /></Field>
          </div>
          <Field label="Notas"><textarea rows={2} className={inputClass} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
        </Modal>
      )}
    </div>
  );
}
