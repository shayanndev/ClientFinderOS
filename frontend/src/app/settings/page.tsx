"use client";
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Save } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({
    auto_outreach_enabled: false,
    require_manual_approval: true,
    max_total_messages_per_day: 50,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00',
    random_delay_min_minutes: 5,
    random_delay_max_minutes: 15,
    stop_on_reply: true,
    stop_on_error: true,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/api/settings').then(r => { if (r.data) setSettings(r.data); }).catch(() => {});
  }, []);

  const saveSettings = async (e: any) => {
    e.preventDefault();
    try {
      await api.put('/api/settings', settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const Toggle = ({ label, field, description }: { label: string; field: string; description?: string }) => (
    <div className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0">
      <div>
        <p className="font-medium text-slate-800">{label}</p>
        {description && <p className="text-sm text-slate-500">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => setSettings((s: any) => ({ ...s, [field]: !s[field] }))}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings[field] ? 'bg-blue-600' : 'bg-slate-300'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings[field] ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500">Configure global outreach behavior and safety rules.</p>
      </div>

      <form onSubmit={saveSettings} className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Auto-Outreach Controls</h2>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 text-sm text-amber-800">
            ⚠️ Auto-outreach is OFF by default. Enable only after reviewing all safety rules. Every message must be manually approved first.
          </div>
          <Toggle label="Enable Auto-Outreach" field="auto_outreach_enabled" description="Master switch. When OFF, nothing is sent automatically." />
          <Toggle label="Require Manual Approval" field="require_manual_approval" description="All messages must be approved by you before being sent." />
          <Toggle label="Stop on Reply" field="stop_on_reply" description="Immediately stop follow-ups when a lead replies." />
          <Toggle label="Stop on Error" field="stop_on_error" description="Halt outreach if any sending error occurs." />
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Daily Limits & Timing</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Max Messages/Day</label>
              <input type="number" value={settings.max_total_messages_per_day} onChange={e => setSettings((s: any) => ({ ...s, max_total_messages_per_day: +e.target.value }))} className="w-full p-2 border border-slate-300 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Min Delay (minutes)</label>
              <input type="number" value={settings.random_delay_min_minutes} onChange={e => setSettings((s: any) => ({ ...s, random_delay_min_minutes: +e.target.value }))} className="w-full p-2 border border-slate-300 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quiet Hours Start</label>
              <input type="time" value={settings.quiet_hours_start} onChange={e => setSettings((s: any) => ({ ...s, quiet_hours_start: e.target.value }))} className="w-full p-2 border border-slate-300 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quiet Hours End</label>
              <input type="time" value={settings.quiet_hours_end} onChange={e => setSettings((s: any) => ({ ...s, quiet_hours_end: e.target.value }))} className="w-full p-2 border border-slate-300 rounded" />
            </div>
          </div>
        </div>

        <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors">
          <Save className="w-5 h-5" />
          {saved ? 'Settings Saved!' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
