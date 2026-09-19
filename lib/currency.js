/**
 * Currency Formatting Utility for Admin Dashboard
 */

export const CURRENCY_OPTIONS = [
    { code: 'USD', symbol: '$', label: 'US Dollar ($)' },
    { code: 'NGN', symbol: '₦', label: 'Nigerian Naira (₦)' },
    { code: 'XOF', symbol: 'CFA', label: 'West African CFA Franc (CFA)' },
    { code: 'EUR', symbol: '€', label: 'Euro (€)' },
    { code: 'GBP', symbol: '£', label: 'British Pound (£)' },
    { code: 'CAD', symbol: 'CA$', label: 'Canadian Dollar (CA$)' },
    { code: 'AUD', symbol: 'A$', label: 'Australian Dollar (A$)' },
    { code: 'KES', symbol: 'KSh', label: 'Kenyan Shilling (KSh)' },
    { code: 'GHS', symbol: 'GH₵', label: 'Ghanaian Cedi (GH₵)' },
    { code: 'ZAR', symbol: 'R', label: 'South African Rand (R)' },
    { code: 'INR', symbol: '₹', label: 'Indian Rupee (₹)' },
];

const CURRENCY_SYMBOLS = {
    USD: '$',
    NGN: '₦',
    XOF: 'CFA',
    EUR: '€',
    GBP: '£',
    CAD: 'CA$',
    AUD: 'A$',
    KES: 'KSh',
    GHS: 'GH₵',
    ZAR: 'R',
    INR: '₹',
    JPY: '¥',
};

export function formatPrice(amount, currencyCode = 'USD', explicitSymbol = null) {
    if (amount === null || amount === undefined || amount === '') {
        return `${explicitSymbol || CURRENCY_SYMBOLS[currencyCode] || '$'}0.00`;
    }

    const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
    if (isNaN(num)) {
        return `${explicitSymbol || CURRENCY_SYMBOLS[currencyCode] || '$'}0.00`;
    }

    const code = (currencyCode || 'USD').toUpperCase();
    const symbol = explicitSymbol || CURRENCY_SYMBOLS[code] || '$';

    try {
        const formattedNumber = num.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        return `${symbol}${formattedNumber}`;
    } catch (e) {
        return `${symbol}${num.toFixed(2)}`;
    }
}

export function getCurrencySymbol(currencyCode = 'USD') {
    const code = (currencyCode || 'USD').toUpperCase();
    return CURRENCY_SYMBOLS[code] || '$';
}
