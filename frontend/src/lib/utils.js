import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useSelector } from 'react-redux';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Función para obtener el símbolo de moneda según el código
export const getCurrencySymbol = (currencyCode = 'USD') => {
  const symbols = {
    USD: '$',
    PEN: 'S/',
    EUR: '€',
    MXN: 'MX$',
    // Agrega más monedas según sea necesario
  };
  return symbols[currencyCode] || '$';
};

// Hook personalizado para obtener la moneda del usuario
export const useUserCurrency = () => {
  const currency = useSelector((state) => state.auth.user?.profile?.currency || 'USD');
  return {
    code: currency,
    symbol: getCurrencySymbol(currency)
  };
};

// Función para formatear moneda con la moneda del usuario
export function formatCurrency(amount, currencyCode = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    currencyDisplay: 'symbol'
  }).format(amount);
}

// Función de compatibilidad hacia atrás
export function formatCurrencyWithUser(amount) {
  // Esta función está aquí para compatibilidad con código existente
  // En componentes nuevos, usa useUserCurrency() + formatCurrency(amount, currencyCode)
  const { code } = useUserCurrency();
  return formatCurrency(amount, code);
}
