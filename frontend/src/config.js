/**
 * Centralna konfiguracja frontendu.
 *
 * Zmienne środowiskowe Vite muszą mieć prefix VITE_ i być ustawione w pliku
 * frontend/.env lub frontend/.env.local (nie commitować .env.local!).
 *
 * Przykład frontend/.env.local:
 *   VITE_API_URL=http://192.168.1.100:5000/api
 *   VITE_COMPANY_NAME=Moja Firma
 */

const config = {
  /** Bazowy URL API backendu */
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',

  /** Nazwa firmy wyświetlana w interfejsie */
  companyName: import.meta.env.VITE_COMPANY_NAME || 'Auto Detailing',
};

export default config;
