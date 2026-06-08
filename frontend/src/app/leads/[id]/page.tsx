"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, Globe, Mail, Phone, Activity, Bot, CheckCircle, AlertTriangle } from 'lucide-react';

const STATUS_OPTIONS = ['New Lead','Researched','Scored','Message Ready','Approved','Contacted','Replied','Interested','Call Booked','Proposal Sent','Won','Lost','Follow-up Needed','Ignored'];

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchLead();
    fetchMessages();
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

  const fetchMessages = async () => {
    try {
      const res = await api.get('/api/messages');
      const leadMsgs = res.data.filter((m: any) => m.lead_id === parseInt(params.id as string));
      setMessages(leadMsgs);
    } catch (err) {
      console.error(err);
    }
  };

  const analyzeWebsite = async () => {
    setAnalyzing(true);
    try {
      await api.post(`/api/leads/${params.id}/analyze`);
      fetchLead();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const generateMessages = async () => {
    setGenerating(true);
    try {
      await api.post(`/api/messages/generate/${params.id}`);
      fetchLead();
      fetchMessages();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Generation failed. Make sure GEMINI_API_KEY is set.');
    } finally {
      setGenerating(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      await api.put(`/api/leads/${params.id}`, { ...lead, status: newStatus });
      setLead((l: any) => ({ ...l, status: newStatus }));
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const approveMessage = async (msgId: number) => {
    await api.post(`/api/messages/${msgId}/approve`);
    fetchMessages();
  };

  const rejectMessage = async (msgId: number) => {
    await api.post(`/api/messages/${msgId}/reject`);
    fetchMessages();
  };

  if (loading) return <div className="p-8 text-slate-400">Loading lead...</div>;
  if (!lead) return <div className="p-8 text-slate-400">Lead not found</div>;

  const tempColor: Record<string, string> = {
    Hot: 'bg-orange-100 text-orange-700',
    Warm: 'bg-yellow-100 text-yellow-700',
    Cold: 'bg-blue-100 text-blue-700',
    Ignore: 'bg-slate-100 text-slate-500',
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" /> Back to Pipeline
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">{lead.business_name}</h1>
            <div className="flex items-center gap-4 text-sm text-slate-600 flex-wrap">
              {lead.website && (
                <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" className="flex items-center gap-1 hover:text-blue-600 hover:underline">
                  <Globe className="w-4 h-4" /> {lead.domain}
                </a>
              )}
              {lead.email && <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {lead.email}</span>}
              {lead.phone && <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {lead.phone}</span>}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900">{lead.score || 0}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wide font-medium">Score</div>
            </div>
            {lead.temperature && (
              <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${tempColor[lead.temperature] || ''}`}>
                {lead.temperature}
              </span>
            )}
          </div>
        </div>

        {/* Status selector */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
          <span className="text-sm font-medium text-slate-600">CRM Status:</span>
          <select
            value={lead.status}
            onChange={e => updateStatus(e.target.value)}
            disabled={updatingStatus}
            className="text-sm p-1.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
          >
            {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900">
            <Activity className="w-5 h-5 text-blue-500" /> Lead Actions
          </h2>
          <button
            onClick={analyzeWebsite}
            disabled={analyzing}
            className="w-full bg-blue-50 border border-blue-200 text-blue-700 py-3 rounded-lg font-medium hover:bg-blue-100 transition-colors disabled:opacity-50 text-sm"
          >
            {analyzing ? '🔍 Analyzing website...' : '1. Analyze Website & Score'}
          </button>
          <button
            onClick={generateMessages}
            disabled={generating || !lead.score}
            className="w-full bg-purple-50 border border-purple-200 text-purple-700 py-3 rounded-lg font-medium hover:bg-purple-100 transition-colors disabled:opacity-50 text-sm"
          >
            {generating ? '🤖 Generating messages...' : '2. Generate AI Outreach Messages'}
          </button>
          {!lead.score && (
            <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              Run website analysis first to enable message generation.
            </div>
          )}
          {lead.score_reason && (
            <div className="pt-3 border-t border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Scoring Breakdown:</h3>
              <ul className="space-y-1">
                {lead.score_reason.split(';').filter(Boolean).map((reason: string, i: number) => (
                  <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                    <span className="text-slate-400 mt-0.5">•</span> {reason.trim()}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Lead Info */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold mb-4 text-slate-900">Lead Info</h2>
          <dl className="space-y-3 text-sm">
            {[
              { label: 'Country', value: lead.country },
              { label: 'Platform', value: lead.platform },
              { label: 'Profile URL', value: lead.profile_url },
              { label: 'Added', value: new Date(lead.created_at).toLocaleString() },
              { label: 'Updated', value: new Date(lead.updated_at).toLocaleString() },
            ].map(item => item.value && (
              <div key={item.label} className="flex gap-3">
                <dt className="w-28 text-slate-500 flex-shrink-0">{item.label}</dt>
                <dd className="font-medium text-slate-800">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Generated Messages */}
      {messages.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900 mb-5">
            <Bot className="w-5 h-5 text-purple-500" /> Generated Outreach Messages
          </h2>
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className="border border-slate-200 rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {msg.message_type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-slate-400">{msg.platform}</span>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    msg.status === 'Approved' ? 'bg-green-100 text-green-700'
                    : msg.status === 'Rejected' ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {msg.status}
                  </span>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{msg.message_text}</p>
                {msg.status === 'Pending Review' && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                    <button onClick={() => approveMessage(msg.id)} className="flex items-center gap-1 text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-100 font-medium">
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button onClick={() => rejectMessage(msg.id)} className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 font-medium">
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
