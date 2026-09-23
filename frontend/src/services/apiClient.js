const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiClient {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  getHeaders() {
    const token = localStorage.getItem('votoreal_token');
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    // Congelación a 0 Bytes en Segundo Plano:
    // Si la pantalla está bloqueada, minimizada o en otra app, se detiene el tráfico al 100%.
    // Solo se permite la llamada de logout si es necesaria.
    if (typeof document !== 'undefined' && document.hidden && !endpoint.includes('/auth/')) {
      console.warn(`[Seguridad Banco - 0 Bytes] Petición bloqueada en segundo plano: ${endpoint}`);
      throw new Error('Tráfico congelado en segundo plano (ahorro de datos y seguridad)');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...(options.headers || {})
      }
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const res = await fetch(url, config);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `Error HTTP ${res.status}`);
      }
      return data;
    } catch (err) {
      console.error(`[API Error] ${options.method || 'GET'} ${url}:`, err.message);
      throw err;
    }
  }

  get(endpoint, params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, v);
      }
    });
    const qs = query.toString();
    return this.request(`${endpoint}${qs ? `?${qs}` : ''}`, { method: 'GET' });
  }

  post(endpoint, body = {}) {
    return this.request(endpoint, { method: 'POST', body });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
