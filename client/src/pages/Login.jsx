import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { inputClass } from '../components/Modal';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await login(password);
      navigate('/', { replace: true });
    } catch (e2) {
      setErr(e2.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-full flex items-center justify-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-xl bg-accent mx-auto flex items-center justify-center text-bg font-extrabold text-xl">B</div>
          <h1 className="text-xl font-bold">Home Balance</h1>
          <p className="text-sm text-muted">Ingresa la contraseña para continuar</p>
        </div>
        <input
          autoFocus
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          className={inputClass}
          required
        />
        {err && <p className="text-sm text-red-400">{err}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full bg-accent text-bg font-semibold rounded-lg py-2 disabled:opacity-50"
        >
          {busy ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
