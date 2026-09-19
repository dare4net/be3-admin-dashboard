import api from '../axios';

/**
 * Service for interacting with Analytics API
 */
const AnalyticsService = {
    /**
     * Fetch aggregated statistics for entities (products/categories)
     * @param {Object} params - Query parameters (startDate, endDate, limit, offset, orderBy)
     */
    async fetchStats(params = {}) {
        try {
            const response = await api.get('/analytics/stats', { params });
            return response.data;
        } catch (error) {
            console.error('[AnalyticsService] fetchStats failed:', error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Fetch daily stats summary for dashboard charts
     */
    async fetchDashboardSummary(params = {}) {
        try {
            const response = await api.get('/analytics/dashboard', { params });
            return response.data;
        } catch (error) {
            console.error('[AnalyticsService] fetchDashboardSummary failed:', error.response?.data || error.message);
            throw error;
        }
    }
};

export default AnalyticsService;
