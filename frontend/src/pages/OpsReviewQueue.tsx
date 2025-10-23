import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionService } from '../services';
import { Card } from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorAlert from '../components/ui/ErrorAlert';
import { CheckCircle, XCircle, AlertTriangle, Search, Eye } from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

interface ReviewModalProps {
  transactionId: string;
  transaction: any;
  onClose: () => void;
  onReview: (decision: 'approve' | 'reject', notes: string) => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ transaction, onClose, onReview }) => {
  const [decision, setDecision] = useState<'approve' | 'reject'>('approve');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onReview(decision, notes);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Transaction</h3>
        
        {/* Transaction Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Reference:</span>
            <span className="font-mono text-sm text-gray-900">{transaction.referenceCode}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Amount:</span>
            <span className="font-semibold text-gray-900">{formatCurrency(transaction.amount, transaction.currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Customer:</span>
            <span className="text-sm text-gray-900">{transaction.customer.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Risk Score:</span>
            <span className={`font-semibold ${
              transaction.riskAnalysis?.score > 70 ? 'text-red-600' : 
              transaction.riskAnalysis?.score > 40 ? 'text-yellow-600' : 
              'text-green-600'
            }`}>
              {transaction.riskAnalysis?.score || 'N/A'}
            </span>
          </div>
          {transaction.riskAnalysis?.signals?.length > 0 && (
            <div className="mt-2">
              <span className="text-sm text-gray-600">Risk Signals:</span>
              <ul className="mt-1 space-y-1">
                {transaction.riskAnalysis.signals.map((signal: string, idx: number) => (
                  <li key={idx} className="text-xs text-red-600 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {signal}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Decision</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="approve"
                    checked={decision === 'approve'}
                    onChange={(e) => setDecision(e.target.value as 'approve')}
                    className="w-4 h-4 text-primary focus:ring-2 focus:ring-ring border-input"
                  />
                  <span className="text-sm text-gray-900">Approve Transaction</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="reject"
                    checked={decision === 'reject'}
                    onChange={(e) => setDecision(e.target.value as 'reject')}
                    className="w-4 h-4 text-primary focus:ring-2 focus:ring-ring border-input"
                  />
                  <span className="text-sm text-gray-900">Reject Transaction</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Review Notes {decision === 'reject' && <span className="text-red-600">*</span>}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add your review notes here..."
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                rows={4}
                required={decision === 'reject'}
              />
            </div>

            <div className="flex gap-3">
              <Button 
                type="submit" 
                className={`flex-1 ${decision === 'reject' ? 'bg-red-600 hover:bg-red-700' : ''}`}
              >
                {decision === 'approve' ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </>
                )}
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

const OpsReviewQueue: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);

  // Fetch transactions pending review (high risk)
  const { data: transactions, isLoading, error } = useQuery({
    queryKey: ['review-queue'],
    queryFn: async () => {
      try {
        // Get transactions with high risk that need review
        const result = await transactionService.getTransactions({ 
          status: 'pending' 
        });
        // Filter for high-risk transactions (score > 50)
        return (result?.transactions || []).filter((tx: any) => 
          tx.riskAnalysis?.score > 50 || tx.riskAnalysis?.signals?.length > 0
        );
      } catch (error) {
        console.error('Failed to fetch review queue:', error);
        return [];
      }
    },
  });

  // Review mutation
  const reviewMutation = useMutation({
    mutationFn: async ({ id, decision, notes }: { id: string; decision: 'approve' | 'reject'; notes: string }) => {
      return transactionService.reviewTransaction(id, decision, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-queue'] });
      setSelectedTransaction(null);
    },
  });

  const handleReview = (decision: 'approve' | 'reject', notes: string) => {
    if (selectedTransaction) {
      reviewMutation.mutate({ id: selectedTransaction._id, decision, notes });
    }
  };

  const filteredTransactions = transactions?.filter((tx: any) =>
    tx.referenceCode.toLowerCase().includes(search.toLowerCase()) ||
    tx.customer.email.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message="Failed to load review queue" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ops Review Queue</h1>
        <p className="text-gray-600">Review high-risk transactions requiring manual approval</p>
      </div>

      {/* Search */}
      <Card>
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
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Reviews</p>
              <p className="text-2xl font-bold text-gray-900">{transactions?.length || 0}</p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">High Risk</p>
              <p className="text-2xl font-bold text-gray-900">
                {transactions?.filter((tx: any) => tx.riskAnalysis?.score > 70).length || 0}
              </p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(
                  transactions?.reduce((sum: number, tx: any) => sum + tx.amount, 0) || 0,
                  'USD'
                )}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Eye className="h-6 w-6 text-blue-600" />
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
                  Risk Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Signals
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
                    <p className="text-gray-500">No transactions pending review</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions?.map((transaction: any) => (
                  <tr key={transaction._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm text-gray-900">{transaction.referenceCode}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">{transaction.customer.name}</div>
                        <div className="text-sm text-gray-500">{transaction.customer.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold">
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`font-semibold ${
                        transaction.riskAnalysis?.score > 70 ? 'text-red-600' : 
                        transaction.riskAnalysis?.score > 40 ? 'text-yellow-600' : 
                        'text-green-600'
                      }`}>
                        {transaction.riskAnalysis?.score || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {transaction.riskAnalysis?.signals?.slice(0, 2).map((signal: string, idx: number) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800"
                          >
                            {signal}
                          </span>
                        ))}
                        {transaction.riskAnalysis?.signals?.length > 2 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            +{transaction.riskAnalysis.signals.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(transaction.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/transactions/${transaction._id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setSelectedTransaction(transaction)}
                          disabled={reviewMutation.isPending}
                        >
                          Review
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

      {/* Review Modal */}
      {selectedTransaction && (
        <ReviewModal
          transactionId={selectedTransaction._id}
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          onReview={handleReview}
        />
      )}
    </div>
  );
};

export default OpsReviewQueue;

