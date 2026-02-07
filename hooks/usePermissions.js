/**
 * usePermissions Hook
 * Custom hook for permission checking in components
 */

import { useAuth } from '../components/providers/AuthContext';

export function usePermissions() {
    const { permissions, roles, allowedCategories, hasUnrestrictedCategoryAccess } = useAuth();

    /**
     * Check if user has a specific permission
     * @param {string} permissionName 
     * @returns {boolean}
     */
    const hasPermission = (permissionName) => {
        if (!permissions || permissions.length === 0) {
            return false;
        }

        // Check for wildcard (admin has all permissions)
        if (permissions.includes('*')) {
            return true;
        }

        return permissions.includes(permissionName);
    };

    /**
     * Check if user has ANY of the specified permissions
     * @param {string[]} permissionNames 
     * @returns {boolean}
     */
    const hasAnyPermission = (permissionNames) => {
        if (!permissions || permissions.length === 0) {
            return false;
        }

        // Check for wildcard
        if (permissions.includes('*')) {
            return true;
        }

        return permissionNames.some(perm => permissions.includes(perm));
    };

    /**
     * Check if user has ALL of the specified permissions
     * @param {string[]} permissionNames 
     * @returns {boolean}
     */
    const hasAllPermissions = (permissionNames) => {
        if (!permissions || permissions.length === 0) {
            return false;
        }

        // Check for wildcard
        if (permissions.includes('*')) {
            return true;
        }

        return permissionNames.every(perm => permissions.includes(perm));
    };

    /**
     * Check if user can access a specific category
     * @param {string} categoryId 
     * @returns {boolean}
     */
    const canAccessCategory = (categoryId) => {
        // If user has unrestricted access, they can access all categories
        if (hasUnrestrictedCategoryAccess) {
            return true;
        }

        // Otherwise, check if category is in allowed list
        return allowedCategories.includes(categoryId);
    };

    /**
     * Filter categories based on user's access
     * @param {Array} categories - Array of category objects with 'id' property
     * @returns {Array}
     */
    const filterCategories = (categories) => {
        if (!categories || categories.length === 0) {
            return [];
        }

        // If user has unrestricted access, return all categories
        if (hasUnrestrictedCategoryAccess) {
            return categories;
        }

        // Filter to only allowed categories
        return categories.filter(cat => allowedCategories.includes(cat.id));
    };

    /**
     * Check if user has a specific role
     * @param {string} roleName 
     * @returns {boolean}
     */
    const hasRole = (roleName) => {
        if (!roles || roles.length === 0) {
            return false;
        }

        return roles.some(role => role.name === roleName);
    };

    return {
        permissions,
        roles,
        allowedCategories,
        hasUnrestrictedCategoryAccess,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        canAccessCategory,
        filterCategories,
        hasRole
    };
}
