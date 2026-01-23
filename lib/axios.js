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

// Queue to hold requests while refreshing
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
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

        // If error is 401 and we haven't tried refreshing yet
        if (error.response?.status === 401 && !originalRequest._retry && typeof window !== 'undefined') {

            // Check if we are already on the login page to avoid loops
            if (window.location.pathname.includes('/auth/login')) {
                return Promise.reject(error);
            }

            if (isRefreshing) {
                // If already refreshing, queue this request
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers['Authorization'] = 'Bearer ' + token;
                    return api(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = localStorage.getItem('refreshToken');

            if (!refreshToken) {
                // No refresh token, logout
                processQueue(new Error('No refresh token available'), null);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('permissions');
                window.location.href = '/auth/login';
                return Promise.reject(error);
            }

            // Attempt Refresh
            try {
                // We use axios.create() to avoid interceptors loop for the refresh call itself
                // or just call the fetch directly, but using a clean axios instance is safer
                const response = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
                    refreshToken
                });

                const { accessToken, refreshToken: newRefreshToken } = response.data;

                // Update Storage
                localStorage.setItem('token', accessToken);
                if (newRefreshToken) {
                    localStorage.setItem('refreshToken', newRefreshToken);
                }

                // Update default header
                api.defaults.headers.common['Authorization'] = 'Bearer ' + accessToken;

                // Process queued requests
                processQueue(null, accessToken);
                isRefreshing = false;

                // Retry original request (with new token)
                originalRequest.headers['Authorization'] = 'Bearer ' + accessToken;
                return api(originalRequest);

            } catch (err) {
                // Refresh failed (expired refresh token, etc)
                processQueue(err, null);
                isRefreshing = false;

                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                localStorage.removeItem('permissions');
                window.location.href = '/auth/login?expired=true';

                return Promise.reject(err);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
