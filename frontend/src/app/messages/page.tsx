"use client";

import { useState, useEffect } from 'react';
import { Check, X, Send, Bot } from 'lucide-react';
import { api } from '@/lib/api';

export default function MessagesQueuePage() {
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await api.get('/api/messages');
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const approveMessage = async (id: number) => {
    try {
      await api.post(`/api/messages/${id}/approve`);
      fetchMessages();
    } catch (err) {
      console.error(err);
    }
  };

  const rejectMessage = async (id: number) => {
    try {
      await api.post(`/api/messages/${id}/reject`);
      fetchMessages();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Message Approval Queue</h1>
          <p className="text-slate-500">Review, edit, and approve AI-generated outreach messages.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium text-slate-600">Lead ID</th>
                <th className="px-6 py-4 font-medium text-slate-600">Type & Platform</th>
                <th className="px-6 py-4 font-medium text-slate-600 w-1/2">Message Content</th>
                <th className="px-6 py-4 font-medium text-slate-600">Status</th>
                <th className="px-6 py-4 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {messages.map((msg) => (
                <tr key={msg.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {msg.lead_id}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900 capitalize">{msg.message_type.replace('_', ' ')}</div>
                    <div className="text-slate-500 text-xs">{msg.platform}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-700 whitespace-pre-wrap">
                    {msg.message_text}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                      ${msg.status === 'Pending Review' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${msg.status === 'Approved' ? 'bg-green-100 text-green-800' : ''}
                      ${msg.status === 'Rejected' ? 'bg-red-100 text-red-800' : ''}
                    `}>
                      {msg.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {msg.status === 'Pending Review' && (
                      <div className="flex gap-2">
                        <button onClick={() => approveMessage(msg.id)} className="p-1 text-green-600 bg-green-50 rounded hover:bg-green-100 transition-colors" title="Approve">
                          <Check className="w-5 h-5" />
                        </button>
                        <button onClick={() => rejectMessage(msg.id)} className="p-1 text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors" title="Reject">
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                    {msg.status === 'Approved' && (
                      <button className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors">
                        <Send className="w-3 h-3" /> Mark Sent
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {messages.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <Bot className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                    No messages in queue. Generate some messages for your leads.
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
