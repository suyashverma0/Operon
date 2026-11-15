import React, { useState } from 'react';
import { api } from '../lib/api';
import { ParsedCommand } from '@openron/shared';

interface CommandBoxProps {
  onSuccess?: () => void;
}

export const CommandBox: React.FC<CommandBoxProps> = ({ onSuccess }) => {
  const [command, setCommand] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<{
    parsed: ParsedCommand;
    preview: string;
    requiresConfirmation: boolean;
  } | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    setLoading(true);
    setFeedback(null);
    setPreviewData(null);

    try {
      const response = await api.parseCommand(command);
      if (response.success) {
        setPreviewData(response);
      } else {
        setFeedback(response.error || 'Command samajh nahi aayi.');
      }
    } catch (err: any) {
      setFeedback('Error connecting to backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!previewData) return;
    setLoading(true);

    try {
      const response = await api.executeCommand(previewData.parsed, true);
      if (response.success) {
        setFeedback(`✅ ${response.message}`);
        setPreviewData(null);
        setCommand('');
        if (onSuccess) onSuccess();
      } else {
        setFeedback(`❌ ${response.error || response.clarify || 'Karyawahi poori nahi ho saki.'}`);
      }
    } catch (err: any) {
      setFeedback('Error executing command.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setPreviewData(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-6">
      <h2 className="text-lg font-bold text-slate-800 mb-2">
        OPENRON AI Voice & Text Command
      </h2>
      <p className="text-xs text-slate-500 mb-4">
        Bol kar ya likh kar command dein (e.g. &quot;Ramesh ko 500 ka udhaar laga do&quot;, &quot;Aata ke 10 kilo add karo&quot;)
      </p>

      <form onSubmit={handleParse} className="flex gap-2">
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Command yahan likhein (Hindi / Hinglish / English)..."
          className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-600 focus:outline-none"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !command.trim()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : 'Send'}
        </button>
      </form>

      {/* Confirmation & Preview Step */}
      {previewData && (
        <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <p className="text-xs font-semibold uppercase text-amber-800 tracking-wider mb-1">
            Pustikaran (Confirmation Required)
          </p>
          <p className="text-sm font-medium text-slate-800 mb-3">
            {previewData.preview}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg"
            >
              Haan, Kar Do (Confirm)
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold px-4 py-2 rounded-lg"
            >
              Raddh Karein (Cancel)
            </button>
          </div>
        </div>
      )}

      {feedback && (
        <div className="mt-3 p-3 rounded-xl bg-slate-50 text-sm text-slate-700 border border-slate-200">
          {feedback}
        </div>
      )}
    </div>
  );
};
