/**
 * PermissionGate Component
 * Conditionally renders children based on permission requirements
 */

"use client";

import { usePermissions } from '@/hooks/usePermissions';

export default function PermissionGate({
    permission,
    permissions,
    requireAll = false,
    fallback = null,
    children
}) {
    const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

    let hasAccess = false;

    if (permission) {
        // Single permission check
        hasAccess = hasPermission(permission);
    } else if (permissions && permissions.length > 0) {
        // Multiple permissions check
        if (requireAll) {
            hasAccess = hasAllPermissions(permissions);
        } else {
            hasAccess = hasAnyPermission(permissions);
        }
    } else {
        // No permissions specified, allow access
        hasAccess = true;
    }

    if (!hasAccess) {
        return fallback;
    }

    return <>{children}</>;
}
