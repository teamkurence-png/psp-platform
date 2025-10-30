import { useState } from 'react';
import { Copy, CheckCircle, AlertTriangle } from 'lucide-react';

interface ApiKeyGeneratorProps {
  apiKey: string;
  onClose: () => void;
}

export const ApiKeyGenerator = ({ apiKey, onClose }: ApiKeyGeneratorProps) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
        <div className="flex items-start gap-3 mb-6">
          <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Your API Key is Ready
            </h2>
            <p className="text-sm text-gray-600">
              Please copy and save your API key now. For security reasons, you won't be able to see it again.
            </p>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            API Key
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={apiKey}
              readOnly
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg font-mono text-sm"
            />
            <button
              onClick={copyToClipboard}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-yellow-800 mb-2">
            Security Notice
          </h3>
          <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
            <li>Store this key securely - treat it like a password</li>
            <li>Never commit it to version control or share it publicly</li>
            <li>Use environment variables in your applications</li>
            <li>Revoke the key immediately if it's compromised</li>
          </ul>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={!copied}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              copied
                ? 'bg-gray-900 text-white hover:bg-gray-800'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {copied ? 'Done' : 'Copy key first'}
          </button>
        </div>
      </div>
    </div>
  );
};

