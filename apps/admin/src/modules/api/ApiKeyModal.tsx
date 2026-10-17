import React, { useState } from 'react';
import { Key, Copy, Check, AlertTriangle } from 'lucide-react';
import { Modal, Button } from '@dineflow/ui';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  generatedSecret: string | null;
  onCreateKey: (keyName: string) => Promise<void>;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  generatedSecret,
  onCreateKey,
}) => {
  const [keyName, setKeyName] = useState('');
  const [copied, setCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) {
      setError('Key name is required');
      return;
    }

    try {
      setIsCreating(true);
      await onCreateKey(keyName.trim());
      setIsCreating(false);
      setKeyName('');
    } catch (err: any) {
      setIsCreating(false);
      setError(err.message || 'Error generating API key');
    }
  };

  const handleCopy = () => {
    if (generatedSecret) {
      navigator.clipboard.writeText(generatedSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={generatedSecret ? 'API Key Created Successfully' : 'Generate New API Key'}
      description="API keys authenticate POS terminals, inventory webhooks, and third-party integrations."
      maxWidth="md"
    >
      {generatedSecret ? (
        <div className="space-y-4">
          <div className="p-3 bg-amber-950/80 border border-amber-800 rounded-xl text-amber-300 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Save this secret token immediately. For security reasons, it cannot be displayed
              again.
            </span>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Your Full API Secret</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={generatedSecret}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-orange-400 font-mono text-xs focus:outline-none"
              />
              <Button
                variant="secondary"
                size="sm"
                icon={copied ? Check : Copy}
                onClick={handleCopy}
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-800">
            <Button variant="primary" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-xl text-xs">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Key Name / Client *</label>
            <input
              type="text"
              required
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder="e.g. POS Front Counter, Zapier Webhook, Kitchen Screen"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" icon={Key} isLoading={isCreating}>
              Generate Key
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
