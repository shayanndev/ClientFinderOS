"use client";

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Users, Flame, Send, MessageSquare, Briefcase } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/api/analytics/dashboard');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!stats) return <div className="p-8">Loading dashboard...</div>;

  const statCards = [
    { label: 'Total Leads', value: stats.total_leads, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Hot Leads', value: stats.hot_leads, icon: Flame, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Generated Msgs', value: stats.total_messages, icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Approved Msgs', value: stats.approved_messages, icon: Send, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Active Niches', value: stats.total_niches, icon: Briefcase, color: 'text-indigo-600', bg: 'bg-indigo-50' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">Overview of your client acquisition pipeline.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.bg}`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Pipeline Status</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Total Leads Found</span>
                <span className="font-medium text-slate-900">{stats.total_leads}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Hot / Warm Leads</span>
                <span className="font-medium text-slate-900">{stats.hot_leads + stats.warm_leads}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: stats.total_leads > 0 ? `${((stats.hot_leads + stats.warm_leads) / stats.total_leads) * 100}%` : '0%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Messages Approved</span>
                <span className="font-medium text-slate-900">{stats.approved_messages}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: stats.total_messages > 0 ? `${(stats.approved_messages / stats.total_messages) * 100}%` : '0%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 flex flex-col items-center justify-center text-center">
          <Briefcase className="w-12 h-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">Ready to find more clients?</h3>
          <p className="text-slate-500 mb-6 max-w-sm">
            Import a CSV of leads in the CRM Pipeline, or add a new Niche to get started.
          </p>
          <a href="/leads" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
            Go to Pipeline
          </a>
        </div>
      </div>
    </div>
  );
}
