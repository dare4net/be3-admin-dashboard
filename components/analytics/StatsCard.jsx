import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

const StatsCard = ({ title, value, subtitle, trend, trendValue, icon: Icon, loading }) => {
    return (
        <Card className="overflow-hidden">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        {Icon && <Icon className="w-5 h-5" />}
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-2 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                    </div>
                ) : (
                    <>
                        <p className="text-sm font-medium text-gray-500">{title}</p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>

                        {(trend || trendValue) && (
                            <div className="flex items-center gap-1 mt-2">
                                {trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                                {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
                                {trend === 'neutral' && <Minus className="w-4 h-4 text-gray-400" />}
                                <span className={cn(
                                    "text-xs font-medium",
                                    trend === 'up' ? "text-green-600" :
                                        trend === 'down' ? "text-red-600" : "text-gray-500"
                                )}>
                                    {trendValue}
                                </span>
                                <span className="text-xs text-gray-400 ml-1">{subtitle}</span>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default StatsCard;
