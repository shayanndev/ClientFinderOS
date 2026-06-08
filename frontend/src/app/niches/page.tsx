"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, MoreVertical, Edit2, Copy, Trash, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '@/lib/api';

export default function NichesPage() {
  const [niches, setNiches] = useState<any[]>([]);

  useEffect(() => {
    fetchNiches();
  }, []);

  const fetchNiches = async () => {
    try {
      const res = await api.get('/api/niches');
      setNiches(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleActive = async (id: number) => {
    try {
      await api.post(`/api/niches/${id}/activate`);
      fetchNiches();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNiche = async (id: number) => {
    if (!confirm('Are you sure you want to delete this niche?')) return;
    try {
      await api.delete(`/api/niches/${id}`);
      fetchNiches();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Niche Manager</h1>
          <p className="text-slate-500">Manage your target niches and ideal client profiles.</p>
        </div>
        <Link 
          href="/niches/new" 
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Niche
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {niches.map((niche) => (
          <div key={niche.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${niche.is_active ? 'bg-green-500' : 'bg-slate-300'}`} />
                <h3 className="font-semibold text-lg text-slate-900">{niche.name}</h3>
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggleActive(niche.id)} title="Toggle Active">
                  {niche.is_active ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-slate-400" />}
                </button>
                <button onClick={() => deleteNiche(niche.id)} title="Delete" className="text-red-500">
                  <Trash className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-slate-600">
              <p><strong className="text-slate-800">Target:</strong> {niche.target_client}</p>
              <p className="truncate"><strong className="text-slate-800">Offer:</strong> {niche.service_offer}</p>
              <p><strong className="text-slate-800">Stack:</strong> {niche.tech_stack}</p>
            </div>
          </div>
        ))}
        
        {niches.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500 bg-white border border-slate-200 border-dashed rounded-xl">
            <BriefcaseIcon className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p>No niches created yet. Start by adding a new niche.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function BriefcaseIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  );
}
