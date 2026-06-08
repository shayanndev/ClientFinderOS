"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function NewNichePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    target_client: '',
    service_offer: '',
    tech_stack: '',
    target_countries: '',
    positive_keywords: '',
    negative_keywords: '',
    tone: 'professional',
    call_to_action: '',
  });

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      await api.post('/api/niches', formData);
      router.push('/niches');
    } catch (err) {
      console.error(err);
      alert('Error creating niche');
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Create New Niche</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Niche Name *</label>
          <input required name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. WooCommerce Checkout Fix Expert" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Target Client *</label>
          <input required name="target_client" value={formData.target_client} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. Small ecommerce store owners" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Service Offer *</label>
          <textarea required name="service_offer" value={formData.service_offer} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" placeholder="What do you do for them?" rows={3}></textarea>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tech Stack</label>
          <input name="tech_stack" value={formData.tech_stack} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. WordPress, WooCommerce, PHP" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Target Countries</label>
          <input name="target_countries" value={formData.target_countries} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. USA, UK, Canada" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Positive Keywords</label>
            <textarea name="positive_keywords" value={formData.positive_keywords} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" placeholder="Comma separated" rows={2}></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Negative Keywords</label>
            <textarea name="negative_keywords" value={formData.negative_keywords} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" placeholder="Comma separated" rows={2}></textarea>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Message Tone</label>
            <select name="tone" value={formData.tone} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500">
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="enthusiastic">Enthusiastic</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Call to Action</label>
            <input name="call_to_action" value={formData.call_to_action} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. Want me to send 2 quick issues I noticed?" />
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-4">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-medium">Create Niche</button>
        </div>
      </form>
    </div>
  );
}
