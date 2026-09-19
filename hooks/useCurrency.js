"use client";

import { useState, useEffect } from "react";
import { formatPrice as formatPriceUtil, getCurrencySymbol } from "@/lib/currency";
import api from "@/lib/axios";

// Module-level cache so we only fetch tenant currency once per session
let _cachedCurrency = null;
let _cachedSymbol = null;
let _fetchPromise = null;

export function updateCurrencyCache(currency, symbol) {
    _cachedCurrency = currency;
    _cachedSymbol = symbol || getCurrencySymbol(currency);
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("tenant-currency-changed", {
            detail: { currency: _cachedCurrency, symbol: _cachedSymbol }
        }));
    }
}

async function loadTenantCurrency() {
    if (_cachedCurrency) return { currency: _cachedCurrency, symbol: _cachedSymbol };
    if (_fetchPromise) return _fetchPromise;

    _fetchPromise = api.get("/tenants/current")
        .then((res) => {
            if (res.data?.success) {
                const t = res.data.tenant;
                _cachedCurrency = t.currency || "USD";
                _cachedSymbol = t.currency_symbol || getCurrencySymbol(_cachedCurrency);
            } else {
                _cachedCurrency = "USD";
                _cachedSymbol = "$";
            }
            return { currency: _cachedCurrency, symbol: _cachedSymbol };
        })
        .catch(() => {
            _cachedCurrency = "USD";
            _cachedSymbol = "$";
            return { currency: "USD", symbol: "$" };
        })
        .finally(() => {
            _fetchPromise = null;
        });

    return _fetchPromise;
}

/**
 * useCurrency - Admin Dashboard
 * Fetches tenant currency once and caches it for the session.
 * Usage:
 *   const { formatPrice, currency, currencySymbol } = useCurrency();
 *   formatPrice(1299.99) => "₦1,299.99"
 */
export function useCurrency() {
    const [currency, setCurrency] = useState(_cachedCurrency || "USD");
    const [currencySymbol, setCurrencySymbol] = useState(_cachedSymbol || "$");

    useEffect(() => {
        if (_cachedCurrency) {
            setCurrency(_cachedCurrency);
            setCurrencySymbol(_cachedSymbol);
        } else {
            loadTenantCurrency().then(({ currency, symbol }) => {
                setCurrency(currency);
                setCurrencySymbol(symbol);
            });
        }

        const handleUpdate = (e) => {
            if (e.detail) {
                setCurrency(e.detail.currency);
                setCurrencySymbol(e.detail.symbol);
            }
        };

        if (typeof window !== "undefined") {
            window.addEventListener("tenant-currency-changed", handleUpdate);
            return () => window.removeEventListener("tenant-currency-changed", handleUpdate);
        }
    }, []);

    const formatPrice = (amount) => formatPriceUtil(amount, currency, currencySymbol);

    return { currency, currencySymbol, formatPrice };
}

export default useCurrency;