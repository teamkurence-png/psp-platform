import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionService } from '../services';
import { Card } from '../components/ui/Card';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorAlert from '../components/ui/ErrorAlert';
import { CheckCircle, Upload, Search, Filter } from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/utils';

interface ConfirmModalProps {
  transactionId: string;
  onClose: () => void;
  onConfirm: (confirmation: string, proof?: File) => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ onClose, onConfirm }) => {
  const [confirmation, setConfirmation] = useState<'confirmed' | 'not_received'>('confirmed');
  const [proofFile, setProofFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(confirmation, proofFile || undefined);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Transaction</h3>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Confirmation Status</label>
              <select
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value as 'confirmed' | 'not_received')}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background"
              >
                <option value="confirmed">Payment Confirmed</option>
                <option value="not_received">Payment Not Received</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Upload Proof (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="proof-upload"
                />
                <label
                  htmlFor="proof-upload"
                  className="flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {proofFile ? proofFile.name : 'Click to upload proof'}
                  </span>
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="flex-1">
                Submit Confirmation
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
};

const ManualConfirmations: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);

  // Fetch pending confirmations
  const { data: transactions, isLoading, error } = useQuery({
    queryKey: ['confirmations', statusFilter],
    queryFn: async () => {
      try {
        const filters: any = { merchantConfirmation: 'pending' };
        if (statusFilter !== 'all') {
          filters.status = statusFilter;
        }
        const result = await transactionService.getTransactions(filters);
        return result?.transactions || [];
      } catch (error) {
        console.error('Failed to fetch confirmations:', error);
        return [];
      }
    },
  });

  // Confirm mutation
  const confirmMutation = useMutation({
    mutationFn: async ({ id, confirmation, proof }: { id: string; confirmation: string; proof?: File }) => {
      const formData = new FormData();
      formData.append('confirmation', confirmation);
      if (proof) {
        formData.append('proof', proof);
      }
      return transactionService.confirmTransaction(id, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['confirmations'] });
      setSelectedTransaction(null);
    },
  });

  const handleConfirm = (confirmation: string, proof?: File) => {
    if (selectedTransaction) {
      confirmMutation.mutate({ id: selectedTransaction, confirmation, proof });
    }
  };

  const filteredTransactions = transactions?.filter((tx) =>
    tx.referenceCode.toLowerCase().includes(search.toLowerCase()) ||
    tx.customer.email.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message="Failed to load confirmations" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manual Confirmations</h1>
        <p className="text-gray-600">Review and confirm pending transactions</p>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by reference or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="approved">Approved</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Confirmations</p>
              <p className="text-2xl font-bold text-gray-900">{transactions?.length || 0}</p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <Filter className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Transactions List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Reference
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <p className="text-gray-500">No pending confirmations</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions?.map((transaction) => (
                  <tr key={transaction._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm">{transaction.referenceCode}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium">{transaction.customer.name}</div>
                        <div className="text-sm text-gray-500">{transaction.customer.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold">
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="capitalize text-gray-900">{transaction.paymentMethod}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={transaction.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(transaction.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => setSelectedTransaction(transaction._id)}
                          disabled={confirmMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Confirm
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Confirm Modal */}
      {selectedTransaction && (
        <ConfirmModal
          transactionId={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
};

export default ManualConfirmations;

