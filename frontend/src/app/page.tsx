"use client";

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Users, Flame, Send, MessageSquare, Briefcase, Radio, Clock, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [funnel, setFunnel] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
    api.get('/api/analytics/funnel').then(r => setFunnel(r.data)).catch(() => {});
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/api/analytics/dashboard');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!stats) return (
    <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
      Loading dashboard...
    </div>
  );

  const statCards = [
    { label: 'Total Leads', value: stats.total_leads, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { label: 'Hot Leads', value: stats.hot_leads, icon: Flame, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
    { label: 'Warm Leads', value: stats.warm_leads, icon: TrendingUp, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-100' },
    { label: 'Pending Msgs', value: stats.pending_messages, icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
    { label: 'Msgs Sent', value: stats.sent_messages, icon: Send, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
    { label: 'Active Niches', value: stats.active_niches, icon: Briefcase, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
    { label: 'Lead Sources', value: stats.total_sources, icon: Radio, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
    { label: 'AI Messages', value: stats.total_messages, icon: MessageSquare, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100' },
  ];

  const maxFunnelCount = funnel.reduce((max, s) => Math.max(max, s.count), 1);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm">Your client acquisition pipeline overview.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/sources" className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
            + New Research Source
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className={`bg-white p-5 rounded-xl border ${stat.border} shadow-sm flex items-center gap-4`}>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${stat.bg} flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Funnel + CTA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CRM Funnel */}
        <div className="lg:col-span-2 bg-white border border-slate-200 shadow-sm rounded-xl p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-5">CRM Funnel</h2>
          <div className="space-y-3">
            {funnel.filter(s => s.count > 0 || s.status === 'New Lead').map((stage) => (
              <div key={stage.status}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600 font-medium">{stage.status}</span>
                  <span className="font-bold text-slate-900">{stage.count}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.max((stage.count / maxFunnelCount) * 100, stage.count > 0 ? 3 : 0)}%` }}
                  />
                </div>
              </div>
            ))}
            {funnel.every(s => s.count === 0) && (
              <p className="text-slate-400 text-sm text-center py-4">No leads in pipeline yet. Add a lead source and run research to get started.</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Quick Actions</h2>
            <p className="text-sm text-slate-500 mb-6">Jump right to key tasks in your pipeline.</p>
          </div>
          <div className="space-y-3">
            <Link href="/niches/new" className="block w-full text-center bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              + Create Niche
            </Link>
            <Link href="/sources" className="block w-full text-center bg-slate-100 text-slate-700 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors">
              + Add Lead Source
            </Link>
            <Link href="/leads" className="block w-full text-center bg-slate-100 text-slate-700 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors">
              View CRM Pipeline
            </Link>
            <Link href="/messages" className="block w-full text-center bg-slate-100 text-slate-700 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors">
              Review Message Queue
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
