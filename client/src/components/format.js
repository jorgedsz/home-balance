// Money formatter that respects the per-transaction/account currency.
// Falls back to plain locale formatting if the currency code is non-standard.
export const fmtMoney = (amount, currency) => {
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency, maximumFractionDigits: 0
    }).format(amount);
  } catch {
    return `${(amount || 0).toLocaleString('es-CO')} ${currency || ''}`.trim();
  }
};

export const fmtDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const CURRENCIES = ['COP', 'USD', 'EUR', 'MXN', 'ARS', 'CLP', 'PEN', 'BRL'];
export const ACCOUNT_TYPES = [
  { value: 'checking', label: 'Cuenta corriente' },
  { value: 'savings', label: 'Ahorros' },
  { value: 'credit_card', label: 'Tarjeta de crédito' },
  { value: 'cash', label: 'Efectivo' },
  { value: 'other', label: 'Otra' }
];
export const BILL_CATEGORIES = [
  { value: 'rent', label: 'Arriendo / Hipoteca' },
  { value: 'utilities', label: 'Servicios' },
  { value: 'subscriptions', label: 'Suscripciones' },
  { value: 'loan', label: 'Préstamo' },
  { value: 'insurance', label: 'Seguros' },
  { value: 'education', label: 'Educación' },
  { value: 'other', label: 'Otra' }
];
export const TX_CATEGORIES = [
  { value: 'salary', label: 'Salario' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'food', label: 'Alimentación' },
  { value: 'transport', label: 'Transporte' },
  { value: 'entertainment', label: 'Entretenimiento' },
  { value: 'health', label: 'Salud' },
  { value: 'shopping', label: 'Compras' },
  { value: 'other', label: 'Otro' }
];
