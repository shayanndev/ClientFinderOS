"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Upload, ExternalLink, Trash, ChevronRight, Flame, Wind, Snowflake } from 'lucide-react';
import { api } from '@/lib/api';

const TEMP_COLORS: Record<string, string> = {
  Hot: 'bg-orange-100 text-orange-700 border-orange-200',
  Warm: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Cold: 'bg-blue-100 text-blue-700 border-blue-200',
  Ignore: 'bg-slate-100 text-slate-400 border-slate-200',
};

const STATUS_COLORS: Record<string, string> = {
  'New Lead': 'bg-slate-100 text-slate-600',
  'Researched': 'bg-sky-100 text-sky-700',
  'Scored': 'bg-indigo-100 text-indigo-700',
  'Message Ready': 'bg-purple-100 text-purple-700',
  'Approved': 'bg-green-100 text-green-700',
  'Contacted': 'bg-teal-100 text-teal-700',
  'Replied': 'bg-lime-100 text-lime-700',
  'Won': 'bg-emerald-100 text-emerald-700',
  'Lost': 'bg-red-100 text-red-700',
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [niches, setNiches] = useState<any[]>([]);
  const [selectedNiche, setSelectedNiche] = useState<string>('');
  const [filterTemp, setFilterTemp] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchLeads();
    api.get('/api/niches').then(r => {
      setNiches(r.data);
      if (r.data.length > 0) setSelectedNiche(r.data[0].id.toString());
    });
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await api.get('/api/leads');
      setLeads(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file || !selectedNiche) return alert('Please select a niche first');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post(`/api/leads/import-csv?niche_id=${selectedNiche}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert(res.data.message);
      fetchLeads();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Error importing CSV');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const deleteLead = async (e: any, id: number) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm('Delete this lead?')) return;
    await api.delete(`/api/leads/${id}`);
    fetchLeads();
  };

  const filtered = leads.filter(l => {
    if (filterTemp && l.temperature !== filterTemp) return false;
    if (filterStatus && l.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">CRM Pipeline</h1>
          <p className="text-slate-500 text-sm">{leads.length} leads total · {leads.filter(l => l.temperature === 'Hot').length} hot</p>
        </div>
        <div className="flex gap-3 items-center flex-wrap">
          {/* Filters */}
          <select value={filterTemp} onChange={e => setFilterTemp(e.target.value)} className="text-sm p-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500">
            <option value="">All Temperatures</option>
            {['Hot','Warm','Cold','Ignore'].map(t => <option key={t}>{t}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-sm p-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500">
            <option value="">All Statuses</option>
            {['New Lead','Researched','Scored','Message Ready','Approved','Contacted','Replied','Won','Lost'].map(s => <option key={s}>{s}</option>)}
          </select>

          {/* Niche selector + CSV import */}
          {niches.length > 0 && (
            <select value={selectedNiche} onChange={e => setSelectedNiche(e.target.value)} className="text-sm p-2 border border-slate-300 rounded-lg bg-white">
              {niches.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
            </select>
          )}
          <button onClick={() => fileInputRef.current?.click()} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-slate-50 transition-colors">
            <Upload className="w-4 h-4" /> Import CSV
          </button>
          <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Business</th>
                <th className="px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Contact</th>
                <th className="px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Status</th>
                <th className="px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Score</th>
                <th className="px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((lead) => (
                <tr key={lead.id} className="hover:bg-blue-50/30 transition-colors cursor-pointer group">
                  <td className="px-6 py-4">
                    <Link href={`/leads/${lead.id}`} className="block">
                      <div className="font-medium text-slate-900 group-hover:text-blue-700 transition-colors flex items-center gap-1">
                        {lead.business_name}
                        <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      {lead.website && (
                        <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" onClick={e => e.stopPropagation()} className="text-blue-500 hover:underline flex items-center gap-1 text-xs mt-0.5">
                          {lead.domain} <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-700 text-xs">{lead.email || <span className="text-slate-400">No email</span>}</div>
                    {lead.phone && <div className="text-slate-500 text-xs mt-0.5">{lead.phone}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[lead.status] || 'bg-slate-100 text-slate-600'}`}>
                        {lead.status}
                      </span>
                      {lead.temperature && (
                        <div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${TEMP_COLORS[lead.temperature] || ''}`}>
                            {lead.temperature}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 font-bold text-slate-700 text-sm">
                        {lead.score || 0}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Link href={`/leads/${lead.id}`} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100">
                        Open
                      </Link>
                      <button onClick={(e) => deleteLead(e, lead.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <Users className="w-10 h-10 mx-auto text-slate-200 mb-3" />
                    <p className="text-slate-400 text-sm">{leads.length === 0 ? 'No leads yet. Import a CSV or run an auto-research source.' : 'No leads match your filters.'}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Users(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}
