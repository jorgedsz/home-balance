import { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { overviewAPI } from '../services/api';
import { fmtMoney, fmtDate } from '../components/format';

export default function Overview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    overviewAPI.get(6).then(({ data }) => setData(data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-muted">Cargando...</p>;
  if (!data) return <p className="text-muted">Sin datos.</p>;

  const currencies = Object.keys(data.balancesByCurrency);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Resumen</h1>
        <p className="text-sm text-muted">Saldo total y flujo de caja de los últimos 6 meses, separado por moneda.</p>
      </div>

      {/* Balances per currency */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {currencies.length === 0 ? (
          <div className="md:col-span-4 bg-card border border-border rounded-xl p-6 text-center text-muted">
            Aún no tienes cuentas. Crea una en la pestaña Cuentas para ver tu saldo aquí.
          </div>
        ) : currencies.map(cur => (
          <div key={cur} className="bg-card border border-border rounded-xl p-5">
            <div className="text-xs text-muted">Saldo en {cur}</div>
            <div className="text-2xl font-bold mt-1">{fmtMoney(data.balancesByCurrency[cur], cur)}</div>
            <div className="text-xs text-muted mt-1">{data.accountsCount} cuentas</div>
          </div>
        ))}
      </div>

      {/* Cash flow chart per currency */}
      {Object.keys(data.cashFlowByCurrency).length > 0 ? (
        Object.entries(data.cashFlowByCurrency).map(([cur, series]) => (
          <div key={cur} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Flujo de caja — {cur}</h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-accent/10 text-accent">Últimos 6 meses</span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222937" />
                <XAxis dataKey="label" stroke="#7d8898" fontSize={11} />
                <YAxis stroke="#7d8898" fontSize={11} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                <Tooltip
                  contentStyle={{ background: '#161a22', border: '1px solid #222937', borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => fmtMoney(v, cur)}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="ingreso" name="Ingresos" fill="#34d399" radius={[4, 4, 0, 0]} />
                <Bar dataKey="egreso" name="Egresos" fill="#fb7185" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ))
      ) : (
        <div className="bg-card border border-border rounded-xl p-6 text-center text-muted">
          Sin movimientos en los últimos 6 meses. Agrega ingresos/egresos para ver el flujo.
        </div>
      )}

      {/* Upcoming cuotas */}
      <div className="bg-card border border-border rounded-xl">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="font-semibold">Próximas cuotas</h3>
        </div>
        {data.upcomingCuotas.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted">No hay cuotas pendientes.</p>
        ) : (
          <ul className="divide-y divide-border">
            {data.upcomingCuotas.map(c => (
              <li key={c.id} className="px-5 py-3 flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium">{c.billName} <span className="text-muted text-xs">— cuota {c.cuotaNumber}</span></div>
                  <div className="text-xs text-muted">{fmtDate(c.date)}{c.accountName ? ` • ${c.accountName}` : ''}</div>
                </div>
                <div className="font-semibold text-rose-400">{fmtMoney(c.amount, c.currency)}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
