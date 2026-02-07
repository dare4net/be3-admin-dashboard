// Quick debug script to check user permissions in localStorage
const user = JSON.parse(localStorage.getItem('user') || '{}');
const permissions = JSON.parse(localStorage.getItem('permissions') || '[]');
const roles = JSON.parse(localStorage.getItem('roles') || '[]');

console.log('=== USER PERMISSION DEBUG ===');
console.log('User:', user.email);
console.log('Permissions:', permissions);
console.log('Roles:', roles);
console.log('Has wildcard?', permissions.includes('*'));
console.log('Has settings.view?', permissions.includes('settings.view'));
console.log('Has admin.access?', permissions.includes('admin.access'));
