import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

const StatsCard = ({ title, value, subtitle, trend, trendValue, icon: Icon, loading }) => {
    return (
        <div className="bg-white rounded-lg shadow-none p-5 flex items-start justify-between border border-gray-100">
            <div className="flex-1 min-w-0">
                {loading ? (
                    <div className="space-y-2 animate-pulse">
                        <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                        <div className="h-8 bg-gray-100 rounded w-3/4"></div>
                    </div>
                ) : (
                    <>
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{title}</p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>

                        {(trend || trendValue) && (
                            <div className="flex items-center gap-1 mt-2">
                                {trend === 'up' && <TrendingUp className="w-3 h-3 text-green-500" />}
                                {trend === 'down' && <TrendingDown className="w-3 h-3 text-red-500" />}
                                {trend === 'neutral' && <Minus className="w-3 h-3 text-gray-400" />}
                                <span className={cn(
                                    "text-xs font-bold",
                                    trend === 'up' ? "text-green-600" :
                                        trend === 'down' ? "text-red-600" : "text-gray-500"
                                )}>
                                    {trendValue}
                                </span>
                                <span className="text-[10px] text-gray-400 ml-1">{subtitle}</span>
                            </div>
                        )}
                    </>
                )}
            </div>

            <div className="p-2.5 rounded-lg bg-blue-50/50 text-blue-600 flex-shrink-0">
                {Icon && <Icon className="w-5 h-5" />}
            </div>
        </div>
    );
};

export default StatsCard;
