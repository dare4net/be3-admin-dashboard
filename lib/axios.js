import axios from 'axios';

// Create Axios instance
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL, // Backend URL
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

// Singleton refresh state — outside interceptor to persist across concurrent requests
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Response interceptor - Handle 401 (Refresh Token)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry &&
            typeof window !== 'undefined' &&
            !window.location.pathname.includes('/auth/login')) {

            // If already refreshing, queue this request
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers['Authorization'] = 'Bearer ' + token;
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = localStorage.getItem('refreshToken');

            if (!refreshToken) {
                processQueue(new Error('No refresh token available'), null);
                isRefreshing = false;
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('permissions');
                window.location.href = '/auth/login';
                return Promise.reject(error);
            }

            try {
                // Use a clean axios instance to avoid interceptor loops
                const tenantId = localStorage.getItem('user')
                    ? (() => { try { return JSON.parse(localStorage.getItem('user')).tenant_id; } catch { return null; } })()
                    : null;

                const response = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
                    refreshToken
                }, {
                    headers: {
                        ...(tenantId ? { 'X-Tenant-ID': tenantId } : {})
                    }
                });

                const { accessToken, refreshToken: newRefreshToken } = response.data;

                localStorage.setItem('token', accessToken);
                if (newRefreshToken) {
                    localStorage.setItem('refreshToken', newRefreshToken);
                }

                api.defaults.headers.common['Authorization'] = 'Bearer ' + accessToken;

                processQueue(null, accessToken);

                originalRequest.headers['Authorization'] = 'Bearer ' + accessToken;
                return api(originalRequest);

            } catch (err) {
                console.error('[Axios] Token Refresh Failed:', err.response?.data || err.message);

                processQueue(err, null);

                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                localStorage.removeItem('permissions');
                window.location.href = '/auth/login?expired=true';

                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
