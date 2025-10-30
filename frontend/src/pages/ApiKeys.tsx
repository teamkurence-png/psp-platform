import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Key, 
  Plus, 
  Trash2, 
  ExternalLink,
  Calendar,
  Clock,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { 
  listApiKeys, 
  createApiKey, 
  revokeApiKey, 
  type ApiKey,
  type ApiKeyWithToken 
} from '../services/apiKeyService';
import { ApiKeyGenerator } from '../components/ApiKeyGenerator';

// Helper to get the base server URL (without /api suffix)
const getServerUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  return apiUrl.replace(/\/api$/, '');
};

export const ApiKeys = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKey, setNewKey] = useState<ApiKeyWithToken | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // Redirect non-merchants
  useEffect(() => {
    if (user && user.role !== 'merchant') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Load API keys
  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      const keys = await listApiKeys();
      setApiKeys(keys);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newKeyName.trim()) {
      setError('Please enter a name for the API key');
      return;
    }

    try {
      setCreating(true);
      setError(null);
      const key = await createApiKey({ name: newKeyName.trim() });
      setNewKey(key);
      setShowCreateForm(false);
      setNewKeyName('');
      await loadApiKeys();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  const handleRevokeKey = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to revoke the API key "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setRevoking(id);
      await revokeApiKey(id);
      await loadApiKeys();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to revoke API key');
    } finally {
      setRevoking(null);
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const copyKeyPrefix = async (keyId: string, prefix: string) => {
    try {
      await navigator.clipboard.writeText(prefix);
      setCopiedKeyId(keyId);
      setTimeout(() => setCopiedKeyId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">API Keys</h1>
            <p className="text-gray-600">
              Manage your API keys for integrating payment requests into your applications
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create API Key
          </button>
        </div>

        <a
          href={`${getServerUrl()}/api/docs`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          <ExternalLink className="w-4 h-4" />
          View API Documentation
        </a>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-red-800">Error</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Create API Key</h2>
            <form onSubmit={handleCreateKey}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Key Name
                </label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., Production Server"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
                <p className="mt-1 text-xs text-gray-500">
                  Choose a descriptive name to identify where this key will be used
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewKeyName('');
                    setError(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newKeyName.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Show Generated Key Modal */}
      {newKey && (
        <ApiKeyGenerator
          apiKey={newKey.fullKey}
          onClose={() => setNewKey(null)}
        />
      )}

      {/* API Keys List */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading API keys...</div>
        ) : apiKeys.length === 0 ? (
          <div className="p-12 text-center">
            <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No API Keys</h3>
            <p className="text-gray-600 mb-6">
              Create your first API key to start integrating with your applications
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create API Key
            </button>
          </div>
        ) : (
          <div className="divide-y">
            {apiKeys.map((key) => (
              <div key={key.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{key.name}</h3>
                      {key.isActive ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded">
                          Revoked
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <code className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-sm font-mono">
                        {key.prefix}••••••••••••
                      </code>
                      <button
                        onClick={() => copyKeyPrefix(key.id, key.prefix)}
                        className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                        title="Copy key prefix"
                      >
                        {copiedKeyId === key.id ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Created {formatDate(key.createdAt)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Last used {formatDate(key.lastUsedAt)}
                      </div>
                    </div>
                  </div>
                  {key.isActive && (
                    <button
                      onClick={() => handleRevokeKey(key.id, key.name)}
                      disabled={revoking === key.id}
                      className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                      {revoking === key.id ? 'Revoking...' : 'Revoke'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-blue-900 mb-3">Getting Started</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>
            Use your API key to authenticate requests to the PSP Platform API. Include it in your requests using one of these methods:
          </p>
          <div className="bg-white rounded p-3 font-mono text-xs mt-2">
            <div className="mb-2">Authorization: Bearer psp_live_your_api_key_here</div>
            <div>X-API-Key: psp_live_your_api_key_here</div>
          </div>
          <p className="pt-2">
            <strong>Note:</strong> For security, only the key prefix is displayed above. You can click the copy icon to copy the prefix for reference. The full API key is only shown once during creation.
          </p>
          <p className="pt-2">
            For complete examples and endpoint documentation, visit the{' '}
            <a
              href={`${getServerUrl()}/api/docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline"
            >
              API documentation
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

