// api/index.js — ядро API-клиента
const API_URL = 'https://apostol-api.onrender.com/api';

function getToken() {
  return localStorage.getItem('token');
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError('Сетевая ошибка. Проверьте подключение.', 0);
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new ApiError('Ошибка обработки ответа сервера', res.status);
  }

  if (!res.ok) throw new ApiError(data.error || 'Ошибка запроса', res.status);
  return data;
}

export function post(path, body) {
  return request(path, { method: 'POST', body: JSON.stringify(body) });
}

export function put(path, body) {
  return request(path, { method: 'PUT', body: JSON.stringify(body) });
}
