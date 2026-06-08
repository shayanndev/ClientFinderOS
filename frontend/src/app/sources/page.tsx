"use client";
import { useState, useEffect } from 'react';
import { Plus, Play, Trash } from 'lucide-react';
import { api } from '@/lib/api';

export default function SourcesPage() {
  const [sources, setSources] = useState<any[]>([]);
  const [niches, setNiches] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ source_name: '', source_type: 'Web Research', keyword: '', location: '', country: '', max_results_per_run: 30, run_frequency: 'daily', niche_id: 0 });

  useEffect(() => {
    fetchSources();
    api.get('/api/niches').then(r => { setNiches(r.data); if (r.data.length) setForm(f => ({ ...f, niche_id: r.data[0].id })); });
  }, []);

  const fetchSources = () => api.get('/api/sources').then(r => setSources(r.data)).catch(() => setSources([]));

  const runSource = async (id: number) => {
    try {
      await api.post(`/api/sources/${id}/run`);
      alert('Research job started!');
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Error running source');
    }
  };

  const deleteSource = async (id: number) => {
    if (!confirm('Delete this source?')) return;
    await api.delete(`/api/sources/${id}`);
    fetchSources();
  };

  const createSource = async (e: any) => {
    e.preventDefault();
    await api.post('/api/sources', form);
    setShowForm(false);
    fetchSources();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lead Sources</h1>
          <p className="text-slate-500">Configure and run automated research to find leads.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium hover:bg-blue-700">
          <Plus className="w-5 h-5" /> Add Source
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4">New Research Source</h2>
          <form onSubmit={createSource} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Source Name *</label>
              <input required value={form.source_name} onChange={e => setForm(f => ({...f, source_name: e.target.value}))} className="w-full p-2 border border-slate-300 rounded" placeholder="e.g. Texas embroidery shops" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Niche *</label>
              <select value={form.niche_id} onChange={e => setForm(f => ({...f, niche_id: +e.target.value}))} className="w-full p-2 border border-slate-300 rounded">
                {niches.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Source Type</label>
              <select value={form.source_type} onChange={e => setForm(f => ({...f, source_type: e.target.value}))} className="w-full p-2 border border-slate-300 rounded">
                {['Web Research','Reddit','Upwork','Business Directory','Manual'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Search Keyword *</label>
              <input required value={form.keyword} onChange={e => setForm(f => ({...f, keyword: e.target.value}))} className="w-full p-2 border border-slate-300 rounded" placeholder="e.g. embroidery shop Texas contact" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
              <input value={form.location} onChange={e => setForm(f => ({...f, location: e.target.value}))} className="w-full p-2 border border-slate-300 rounded" placeholder="e.g. Texas" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
              <input value={form.country} onChange={e => setForm(f => ({...f, country: e.target.value}))} className="w-full p-2 border border-slate-300 rounded" placeholder="USA" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Max Results Per Run</label>
              <input type="number" value={form.max_results_per_run} onChange={e => setForm(f => ({...f, max_results_per_run: +e.target.value}))} className="w-full p-2 border border-slate-300 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Frequency</label>
              <select value={form.run_frequency} onChange={e => setForm(f => ({...f, run_frequency: e.target.value}))} className="w-full p-2 border border-slate-300 rounded">
                {['hourly','daily','weekly','manual'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="col-span-2 flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded font-medium">Save Source</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-medium text-slate-600">Name</th>
              <th className="px-6 py-4 font-medium text-slate-600">Type</th>
              <th className="px-6 py-4 font-medium text-slate-600">Keyword</th>
              <th className="px-6 py-4 font-medium text-slate-600">Freq</th>
              <th className="px-6 py-4 font-medium text-slate-600">Last Run</th>
              <th className="px-6 py-4 font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sources.map(s => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium">{s.source_name}</td>
                <td className="px-6 py-4 text-slate-600">{s.source_type}</td>
                <td className="px-6 py-4 text-slate-600">{s.keyword}</td>
                <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">{s.run_frequency}</span></td>
                <td className="px-6 py-4 text-slate-500 text-xs">{s.last_run_at ? new Date(s.last_run_at).toLocaleString() : 'Never'}</td>
                <td className="px-6 py-4 flex gap-2">
                  <button onClick={() => runSource(s.id)} className="flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded hover:bg-green-100"><Play className="w-3 h-3"/>Run Now</button>
                  <button onClick={() => deleteSource(s.id)} className="text-red-400 hover:text-red-600"><Trash className="w-4 h-4"/></button>
                </td>
              </tr>
            ))}
            {sources.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">No sources yet. Add a research source to start finding leads automatically.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
