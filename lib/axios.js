import axios from 'axios';

// Create Axios instance
const api = axios.create({
    baseURL: 'http://localhost:3000', // Backend URL
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - Add JWT token and Tenant ID
api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }

            // Add Tenant ID from stored user or temporary storage (for login)
            const userStr = localStorage.getItem('user');
            const tempTenantId = localStorage.getItem('temp_tenant_id'); // For login flow

            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    if (user.tenant_id) {
                        config.headers['X-Tenant-ID'] = user.tenant_id;
                    }
                } catch (e) {
                    // Ignore parse error
                }
            } else if (tempTenantId) {
                config.headers['X-Tenant-ID'] = tempTenantId;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - Handle 401 (redirect to login)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && typeof window !== 'undefined') {
            // Only redirect if not already on login page (prevent loop)
            if (!window.location.pathname.includes('/auth/login')) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/auth/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
