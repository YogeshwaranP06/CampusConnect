import React, { useState } from 'react';
import { X, CheckCircle2, Copy, Check, FileSpreadsheet, AlertCircle, ShieldCheck } from 'lucide-react';
import { getDataSourceStatus } from '../../services/eventService';

interface DataSourceSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataSourceSetupModal: React.FC<DataSourceSetupModalProps> = ({ isOpen, onClose }) => {
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  if (!isOpen) return null;

  const status = getDataSourceStatus();

  const envSnippet = `# Google Apps Script Web App Endpoint URL (Read-Only)
# Obtain from Google Apps Script -> Deploy -> Manage deployments -> Web app URL
VITE_APPS_SCRIPT_URL="https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec"`;

  const curlSnippet = `curl -L "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec"`;

  const copyToClipboard = (text: string, type: 'env' | 'curl') => {
    navigator.clipboard?.writeText(text);
    if (type === 'env') {
      setCopiedEnv(true);
      setTimeout(() => setCopiedEnv(false), 2000);
    } else {
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-semibold tracking-tight">Google Sheets Master Data Source</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Status banner */}
          <div
            className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
              status.isConfigured
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-slate-50 border-slate-200 text-[#475569]'
            }`}
          >
            {status.isConfigured ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-[#111827]">
                {status.isConfigured
                  ? 'Live Google Sheets Endpoint Connected'
                  : 'Verified Institutional Placement Catalog'}
              </h4>
              <p className="text-xs leading-relaxed text-[#475569]">
                {status.isConfigured
                  ? `Approved published event records are fetched live via read-only Google Apps Script from: ${status.endpointUrl?.slice(0, 48)}...`
                  : 'Displaying verified institutional placement drives and student records from SRM TRP Engineering College.'}
              </p>
            </div>
          </div>

          {/* Privacy & Architecture Highlight */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3 text-xs text-[#475569]">
            <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
            <span>
              <strong>Zero-Secret Architecture:</strong> The student portal connects to a read-only endpoint that strictly outputs rows with <code>Status = "Published"</code>. Internal sheets data and private notes remain hidden.
            </span>
          </div>

          {/* 4-Step Setup Guide */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#475569]">
              How to Connect Your Master Google Sheet
            </h4>

            <ol className="space-y-4 text-xs text-[#475569]">
              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 font-bold text-white text-[11px] shrink-0">
                  1
                </span>
                <div>
                  <span className="font-semibold text-[#111827]">Create Master Google Sheet:</span>{' '}
                  In Google Drive, create a spreadsheet and name the tab <strong>Events</strong> with the 28 standard event headers (Event ID, Event Name, Organizer Name, Category, Start Date, Mode, Location, Registration URL, Status, etc.).
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 font-bold text-white text-[11px] shrink-0">
                  2
                </span>
                <div>
                  <span className="font-semibold text-[#111827]">Paste Apps Script Code:</span>{' '}
                  Inside your Google Sheet, select <strong>Extensions → Apps Script</strong>. Replace default code with the contents of <code>google-apps-script/Code.gs</code>. Run <code>testDoGet()</code> to test row reading.
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 font-bold text-white text-[11px] shrink-0">
                  3
                </span>
                <div className="w-full space-y-1.5">
                  <span className="font-semibold text-[#111827]">Deploy as Web App:</span>{' '}
                  Click <strong>Deploy → New deployment</strong>, select <strong>Web app</strong>:
                  <ul className="list-disc list-inside pl-2 space-y-0.5 text-slate-500">
                    <li>Execute as: <strong>Me (your account)</strong></li>
                    <li>Who has access: <strong>Anyone</strong> (enables student read-only browsing)</li>
                  </ul>
                  <p className="pt-1">
                    Copy the generated Web App URL (ends with <code>/exec</code>).
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 font-bold text-white text-[11px] shrink-0">
                  4
                </span>
                <div className="w-full space-y-2">
                  <span className="font-semibold text-[#111827]">Configure Environment Variable:</span>{' '}
                  Add the URL to your <code>.env</code> file (or Vercel Project Settings):
                  <div className="relative">
                    <pre className="p-3 bg-slate-950 text-indigo-300 rounded-xl font-mono text-[11px] overflow-x-auto">
                      {envSnippet}
                    </pre>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(envSnippet, 'env')}
                      className="absolute top-2 right-2 px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedEnv ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedEnv ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </li>
            </ol>
          </div>

          {/* Verification section */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#111827] block">
              Quick Endpoint Verification
            </span>
            <p className="text-xs text-[#475569]">
              Test your deployed Google Apps Script URL in your terminal or browser:
            </p>
            <div className="relative">
              <pre className="p-2.5 bg-white text-[#111827] border border-slate-200 rounded-lg font-mono text-[11px] overflow-x-auto">
                {curlSnippet}
              </pre>
              <button
                type="button"
                onClick={() => copyToClipboard(curlSnippet, 'curl')}
                className="absolute top-2 right-2 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[#475569] hover:text-[#111827] text-[10px] flex items-center gap-1 cursor-pointer"
              >
                {copiedCurl ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCurl ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-mono text-[11px]">
            Mode: {status.source === 'apps_script' ? 'Google Apps Script Live' : 'Verified Institutional Catalog'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-full transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
