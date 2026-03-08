import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { cn } from "@/lib/utils";

const SurfaceHeatmap = ({ data, loading }) => {
    if (loading) return <div className="h-64 flex items-center justify-center text-gray-400">Loading heatmap...</div>;

    const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

    return (
        <div className="bg-white rounded-lg shadow-none border border-gray-100 p-4">
            <div className="mb-4">
                <h3 className="font-semibold text-gray-900">Traffic Heatmap</h3>
                <p className="text-sm text-gray-500">Distribution of clicks across storefront locations</p>
            </div>

            <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="placement_type"
                            type="category"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }}
                            width={100}
                        />
                        <Tooltip
                            cursor={{ fill: '#f8fafc' }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const d = payload[0].payload;
                                    return (
                                        <div className="bg-white border border-gray-100 shadow-xl rounded-lg p-3">
                                            <p className="text-xs font-bold text-gray-400 uppercase mb-1">{d.placement_type}</p>
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium">Clicks: <span className="font-bold">{d.clicks}</span></p>
                                                <p className="text-sm font-medium">Impressions: <span className="font-bold">{d.impressions}</span></p>
                                                <p className="text-sm font-medium">Avg CTR: <span className="text-blue-600 font-bold">{d.ctr}%</span></p>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Bar
                            dataKey="clicks"
                            radius={[0, 4, 4, 0]}
                            barSize={32}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {data.slice(0, 4).map((surface, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-[10px] font-bold text-gray-500 uppercase">{surface.placement_type || 'General'}</p>
                        <p className="text-sm font-black text-gray-900">{surface.ctr}% CTR</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SurfaceHeatmap;
