import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import api from '@/lib/axios';
import { LayoutDashboard, Users, Workflow } from 'lucide-react';
import JourneyModal from './JourneyModal';

const RankingTable = ({ data, loading, title = "Leaderboard & Relative Ranking" }) => {
    const [expandedId, setExpandedId] = useState(null);
    const [details, setDetails] = useState({ surfaces: [], referrers: [] });
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [journeyItem, setJourneyItem] = useState(null);

    const handleRowClick = async (item) => {
        const id = `${item.entity_type}-${item.entity_id}`;
        if (expandedId === id) {
            setExpandedId(null);
            return;
        }

        setExpandedId(id);
        setLoadingDetail(true);
        try {
            const response = await api.get(`/analytics/details/${item.entity_type}/${item.entity_id}`);
            setDetails({
                surfaces: response.data?.surfaces || [],
                referrers: response.data?.referrers || []
            });
        } catch (error) {
            console.error('[Analytics] Failed to fetch item details:', error);
            setDetails({ surfaces: [], referrers: [] });
        } finally {
            setLoadingDetail(false);
        }
    };
    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
                Loading deep analytics...
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
                No {title.toLowerCase()} data available yet.
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-none border border-gray-100 overflow-hidden h-full flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
                <div>
                    <h3 className="font-bold text-gray-900">{title}</h3>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Top {data.length} Results By Engagement</p>
                </div>
                <div className="flex items-center gap-1.5 opacity-50">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Live Stats</span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50/50">
                            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor Rank</th>
                            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Market Rank</th>
                            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Entity</th>
                            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Page Views</th>
                            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Impressions</th>
                            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Clicks</th>
                            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right w-48">CTR (%)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {data.map((item) => (
                            <React.Fragment key={`${item.entity_type}-${item.entity_id}`}>
                                <tr
                                    onClick={() => handleRowClick(item)}
                                    className={cn(
                                        "hover:bg-gray-50/50 transition-colors group cursor-pointer",
                                        expandedId === `${item.entity_type}-${item.entity_id}` && "bg-blue-50/30"
                                    )}
                                >
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        {item.vendor_rank ? (
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold shadow-sm",
                                                    item.vendor_rank == 1 ? "bg-amber-100 text-amber-700 border border-amber-200" :
                                                        item.vendor_rank == 2 ? "bg-slate-100 text-slate-600 border border-slate-200" :
                                                            item.vendor_rank == 3 ? "bg-orange-100 text-orange-700 border border-orange-200" :
                                                                "bg-white text-gray-400 border border-gray-100"
                                                )}>
                                                    #{item.vendor_rank}
                                                </span>
                                                <span className="text-[10px] font-semibold text-gray-400 uppercase">Local</span>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] font-bold text-gray-300 uppercase italic">Global Only</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-sm font-bold text-gray-900">#{item.global_rank}</span>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-bold">
                                                    TOP {Math.max(1, Math.round((item.global_rank / item.total_in_type) * 100))}%
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-gray-400">vs {item.total_in_type} entities</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-gray-900 truncate max-w-[200px]" title={item.entity_name || item.entity_id}>
                                                    {item.entity_name || `ID: ${item.entity_id}`}
                                                </span>
                                                <span className={cn(
                                                    "px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter",
                                                    item.entity_type === 'product' ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                                                )}>
                                                    {item.entity_type}
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-gray-400 font-mono">ID: {item.entity_id.slice(0, 12)}...</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-blue-600 font-bold tabular-nums">
                                        {parseInt(item.page_views || 0).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-600 tabular-nums">
                                        {parseInt(item.impressions || 0).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-800 font-bold tabular-nums">
                                        {parseInt(item.clicks || 0).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <div className="flex flex-col gap-1 items-end">
                                            <div className="flex items-center gap-2">
                                                {parseFloat(item.ctr) > 5 && <span className="text-[10px] text-green-600 font-bold animate-pulse">HOT 🔥</span>}
                                                <span className="text-sm font-black text-gray-900">{parseFloat(item.ctr).toFixed(2)}%</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2 max-w-[120px] overflow-hidden">
                                                <div
                                                    className={cn(
                                                        "h-full transition-all duration-1000 ease-out",
                                                        parseFloat(item.ctr) > 10 ? "bg-green-500" : parseFloat(item.ctr) > 5 ? "bg-blue-500" : "bg-gray-400"
                                                    )}
                                                    style={{ width: `${Math.min(parseFloat(item.ctr) * 5, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                                {expandedId === `${item.entity_type}-${item.entity_id}` && (
                                    <tr className="bg-gray-50/50">
                                        <td colSpan="7" className="px-6 py-4">
                                            <div className="bg-white border border-gray-100 rounded-lg p-6 shadow-sm overflow-hidden animate-in zoom-in-95 duration-200">
                                                <div className={cn(
                                                    "grid grid-cols-1 gap-8",
                                                    item.entity_type === 'product' ? "md:grid-cols-3" : "md:grid-cols-2"
                                                )}>
                                                    {/* Journey Button */}
                                                    {item.entity_type === 'product' && (
                                                        <div className="flex flex-col justify-center items-center gap-4 bg-gray-50 border border-gray-100 rounded-xl p-6">
                                                            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-600">
                                                                <Workflow className="w-6 h-6" />
                                                            </div>
                                                            <div className="text-center">
                                                                <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-1">Conversion Journey</h4>
                                                                <p className="text-[10px] text-gray-400 font-medium">Analyze every cart addition, removal, and checkout for this product.</p>
                                                            </div>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setJourneyItem(item);
                                                                }}
                                                                className="px-6 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md shadow-blue-200 active:scale-95"
                                                            >
                                                                View Full Journey Report
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* Surfaces */}
                                                    <div className={cn(item.entity_type === 'product' ? "" : "md:col-span-1")}>
                                                        <h4 className="text-[10px] font-black text-gray-400 uppercase mb-4 px-2 tracking-widest flex items-center gap-2">
                                                            <LayoutDashboard className="w-3 h-3" />
                                                            Surface Breakdown
                                                        </h4>
                                                        {loadingDetail ? (
                                                            <div className="py-8 text-center text-xs text-gray-400">Loading breakdown...</div>
                                                        ) : (details.surfaces || []).length === 0 ? (
                                                            <div className="py-8 text-center text-xs text-gray-400 italic">No surface data recorded.</div>
                                                        ) : (
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                {(details.surfaces || []).map(surf => (
                                                                    <div key={surf.placement_type} className="p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-blue-100 transition-colors">
                                                                        <div className="text-[10px] text-gray-400 uppercase font-black mb-1 leading-none">{surf.placement_type || 'Unknown'}</div>
                                                                        <div className="flex items-baseline justify-between mt-1">
                                                                            <div className="text-sm font-bold text-gray-900 tabular-nums">{surf.page_views || 0} <span className="text-[9px] font-normal text-gray-400 uppercase ml-1">leads</span></div>
                                                                            <div className="text-[10px] text-blue-600 font-black">{Math.round((surf.clicks / Math.max(1, surf.impressions)) * 100)}%</div>
                                                                        </div>
                                                                        <div className="flex justify-between items-center mt-1">
                                                                            <span className="text-[9px] text-gray-400 uppercase font-medium">{surf.impressions} imps</span>
                                                                            <span className="text-[9px] text-gray-500 font-bold">{surf.clicks} clicks</span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Referrers */}
                                                    <div className="border-l border-gray-100 md:pl-8">
                                                        <h4 className="text-[10px] font-black text-gray-400 uppercase mb-4 px-2 tracking-widest flex items-center gap-2">
                                                            <Users className="w-3 h-3" />
                                                            Traffic Sources (Referrers)
                                                        </h4>
                                                        {loadingDetail ? (
                                                            <div className="py-8 text-center text-xs text-gray-400">Analyzing sources...</div>
                                                        ) : (details.referrers || []).length === 0 ? (
                                                            <div className="py-8 text-center text-xs text-gray-400 italic">No external referrers found.</div>
                                                        ) : (
                                                            <div className="space-y-3">
                                                                {(details.referrers || []).map(ref => (
                                                                    <div key={ref.source} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors group">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[10px] font-bold text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors capitalize shadow-sm">
                                                                                {ref.source.charAt(0)}
                                                                            </div>
                                                                            <span className="text-xs font-bold text-gray-700 capitalize">{ref.source}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-3">
                                                                            <span className="text-xs font-black text-gray-900 tabular-nums">{ref.count}</span>
                                                                            <div className="w-24 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                                                <div
                                                                                    className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                                                                                    style={{ width: `${Math.min(100, (ref.count / details.referrers[0].count) * 100)}%` }}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            <JourneyModal
                isOpen={!!journeyItem}
                onClose={() => setJourneyItem(null)}
                entity={journeyItem}
            />
        </div>
    );
};

export default RankingTable;
