import { useState } from 'react';
import { Mail, RefreshCw, CheckCircle2, AlertCircle, ExternalLink, Info } from 'lucide-react';
import { fetchGmailAuthUrl, syncGmailInbox, disconnectGmail } from '../services/gmail.api';

export function GmailPanel({ connected, onStatusChange }) {
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [infoNotice, setInfoNotice] = useState('');

  async function handleConnect() {
    setLoading(true);
    setInfoNotice('');
    try {
      const url = await fetchGmailAuthUrl();
      if (url && !url.includes('dummy-client-id')) {
        window.location.href = url;
      } else {
        setInfoNotice('Google OAuth credentials required in backend .env (GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET). Manual tracking & feed updates remain fully operational!');
      }
    } catch (err) {
      setInfoNotice('Google OAuth endpoint requires GOOGLE_CLIENT_ID setup in backend .env file.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSync() {
    setLoading(true);
    setInfoNotice('');
    try {
      const updates = await syncGmailInbox();
      setMessages(updates);
    } catch (err) {
      setInfoNotice('Gmail sync failed. Please connect account first.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect() {
    await disconnectGmail();
    if (onStatusChange) onStatusChange(false);
  }

  return (
    <div className="saas-card p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-indigo-600" />
          <h3 className="serif-font text-lg font-bold text-slate-900">Gmail Auto-Tracker</h3>
        </div>

        {connected ? (
          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[0.65rem] font-bold text-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Connected
          </span>
        ) : (
          <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[0.65rem] font-bold text-slate-600">
            OAuth Ready
          </span>
        )}
      </div>

      <p className="text-xs text-slate-500">
        Automatically scan your Gmail inbox for online assessment links, recruiter emails, and interview status updates.
      </p>

      <div className="flex items-center gap-2 pt-1">
        {connected ? (
          <>
            <button
              onClick={handleSync}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Sync Company Mails</span>
            </button>
            <button
              onClick={handleDisconnect}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-rose-600 transition"
            >
              Disconnect
            </button>
          </>
        ) : (
          <button
            onClick={handleConnect}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition shadow-2xs"
          >
            <Mail className="h-4 w-4" />
            <span>Connect Gmail Account</span>
          </button>
        )}
      </div>

      {infoNotice && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex items-start gap-2">
          <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <span>{infoNotice}</span>
        </div>
      )}

      {/* Render fetched email updates if any */}
      {messages.length > 0 && (
        <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
          <p className="font-bold text-slate-800">Recent Parsed Emails:</p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {messages.map((m) => (
              <div key={m.id} className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 space-y-1">
                <div className="flex items-center justify-between text-[0.65rem] font-bold text-indigo-600">
                  <span className="truncate">{m.subject}</span>
                  <span className="text-slate-400 font-normal">{m.date ? String(m.date).slice(0, 10) : ''}</span>
                </div>
                <p className="text-slate-600 text-[0.68rem] truncate">{m.snippet}</p>
                {m.matchedCompany && (
                  <span className="inline-block rounded bg-indigo-100 text-indigo-800 px-1.5 py-0.5 text-[0.6rem] font-bold">
                    Matched: {m.matchedCompany}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
