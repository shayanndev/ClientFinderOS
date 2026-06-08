"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, Globe, Mail, Phone, Activity, Bot, CheckCircle } from 'lucide-react';

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchLead();
  }, []);

  const fetchLead = async () => {
    try {
      const res = await api.get(`/api/leads/${params.id}`);
      setLead(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const analyzeWebsite = async () => {
    setAnalyzing(true);
    try {
      await api.post(`/api/leads/${params.id}/analyze`);
      fetchLead();
    } catch (err) {
      console.error(err);
      alert('Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const generateMessages = async () => {
    setGenerating(true);
    try {
      await api.post(`/api/messages/generate/${params.id}`);
      alert('Messages generated successfully! Check the Messages Queue.');
      fetchLead();
    } catch (err) {
      console.error(err);
      alert('Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!lead) return <div>Lead not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Leads
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">{lead.business_name}</h1>
          <div className="flex items-center gap-4 text-sm text-slate-600">
            {lead.website && (
              <span className="flex items-center gap-1"><Globe className="w-4 h-4" /> <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" className="hover:underline">{lead.domain}</a></span>
            )}
            {lead.email && <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {lead.email}</span>}
            {lead.phone && <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {lead.phone}</span>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-slate-900">{lead.score || 0}</div>
          <div className="text-sm text-slate-500 uppercase tracking-wide font-semibold mt-1">Score</div>
          {lead.temperature && (
            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${lead.temperature === 'Hot' ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-800'}`}>
              {lead.temperature}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900">
            <Activity className="w-5 h-5 text-blue-500" /> Lead Actions
          </h2>
          <div className="space-y-3">
            <button 
              onClick={analyzeWebsite} 
              disabled={analyzing}
              className="w-full bg-blue-50 border border-blue-200 text-blue-700 py-3 rounded-lg font-medium hover:bg-blue-100 transition-colors disabled:opacity-50"
            >
              {analyzing ? 'Analyzing Website...' : '1. Run Website Analysis & Score'}
            </button>
            <button 
              onClick={generateMessages} 
              disabled={generating || !lead.score}
              className="w-full bg-purple-50 border border-purple-200 text-purple-700 py-3 rounded-lg font-medium hover:bg-purple-100 transition-colors disabled:opacity-50"
            >
              {generating ? 'Generating Messages...' : '2. Generate AI Messages'}
            </button>
          </div>
          {lead.score_reason && (
            <div className="mt-4 pt-4 border-t border-slate-100 text-sm">
              <h3 className="font-semibold text-slate-700 mb-2">Scoring Reason:</h3>
              <ul className="list-disc pl-4 space-y-1 text-slate-600">
                {lead.score_reason.split(';').map((reason: string, i: number) => (
                  <li key={i}>{reason.trim()}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold mb-4 text-slate-900">CRM Details</h2>
          <div className="space-y-4 text-sm">
            <div>
              <span className="block text-slate-500 mb-1">Status</span>
              <span className="font-medium bg-slate-100 px-3 py-1 rounded-md">{lead.status}</span>
            </div>
            <div>
              <span className="block text-slate-500 mb-1">Country</span>
              <span className="font-medium">{lead.country || 'N/A'}</span>
            </div>
            <div>
              <span className="block text-slate-500 mb-1">Added</span>
              <span className="font-medium">{new Date(lead.created_at).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
