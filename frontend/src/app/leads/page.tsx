"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Upload, Plus, Trash, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [niches, setNiches] = useState<any[]>([]);
  const [selectedNiche, setSelectedNiche] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchLeads();
    fetchNiches();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await api.get('/api/leads');
      setLeads(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNiches = async () => {
    try {
      const res = await api.get('/api/niches');
      setNiches(res.data);
      if (res.data.length > 0) setSelectedNiche(res.data[0].id.toString());
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file || !selectedNiche) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post(`/api/leads/import-csv?niche_id=${selectedNiche}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('CSV imported successfully');
      fetchLeads();
    } catch (err) {
      console.error(err);
      alert('Error importing CSV');
    }
    
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const deleteLead = async (id: number) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    try {
      await api.delete(`/api/leads/${id}`);
      fetchLeads();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">CRM Pipeline</h1>
          <p className="text-slate-500">Manage your leads and outreach statuses.</p>
        </div>
        <div className="flex gap-4 items-center">
          {niches.length > 0 && (
            <select 
              value={selectedNiche} 
              onChange={(e) => setSelectedNiche(e.target.value)}
              className="p-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              {niches.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
            </select>
          )}
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 font-medium hover:bg-slate-50 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </button>
          <input 
            type="file" 
            accept=".csv" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium text-slate-600">Business</th>
                <th className="px-6 py-4 font-medium text-slate-600">Contact</th>
                <th className="px-6 py-4 font-medium text-slate-600">Status</th>
                <th className="px-6 py-4 font-medium text-slate-600">Score</th>
                <th className="px-6 py-4 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{lead.business_name}</div>
                    {lead.website && (
                      <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" className="text-blue-600 hover:underline flex items-center gap-1 text-xs mt-1">
                        {lead.domain} <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-600">{lead.email || 'No email'}</div>
                    <div className="text-slate-500 text-xs">{lead.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{lead.score || 0}</div>
                    {lead.temperature && (
                      <span className={`text-xs ${lead.temperature === 'Hot' ? 'text-orange-600' : 'text-slate-500'}`}>
                        {lead.temperature}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    <button onClick={() => deleteLead(lead.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <Trash className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No leads found. Import a CSV to get started.
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
