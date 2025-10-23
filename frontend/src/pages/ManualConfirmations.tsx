import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { paymentRequestService } from '../services';
import { PaymentRequestStatus } from '../types';
import { Card, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorAlert from '../components/ui/ErrorAlert';
import { Eye, Search, Filter, FileText, CheckCircle, XCircle, Clock, X } from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/utils';
interface UpdateStatusModalProps {
  request: any;
  onClose: () => void;
  onUpdate: (status: PaymentRequestStatus) => void;
}

const UpdateStatusModal: React.FC<UpdateStatusModalProps> = ({ request, onClose, onUpdate }) => {
  const [selectedStatus, setSelectedStatus] = useState<PaymentRequestStatus>(PaymentRequestStatus.PAID);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(selectedStatus);
  };

  const statusOptions = [
    { value: PaymentRequestStatus.PAID, label: 'Mark as Paid', icon: CheckCircle, color: 'text-green-600' },
    { value: PaymentRequestStatus.EXPIRED, label: 'Mark as Expired', icon: Clock, color: 'text-red-600' },
    { value: PaymentRequestStatus.CANCELLED, label: 'Mark as Cancelled', icon: XCircle, color: 'text-gray-600' },
  ];

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Update Payment Request Status</h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Payment Request</div>
              <div className="font-mono text-sm text-gray-900">{request.referenceCode || request._id}</div>
              <div className="text-lg font-semibold text-gray-900 mt-2">
                {formatCurrency(request.amount, request.currency)}
              </div>
              <div className="text-sm text-gray-600">{request.customerInfo?.name || 'N/A'}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">Select New Status</label>
              <div className="space-y-2">
                {statusOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <label
                      key={option.value}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedStatus === option.value
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="radio"
                        value={option.value}
                        checked={selectedStatus === option.value}
                        onChange={(e) => setSelectedStatus(e.target.value as PaymentRequestStatus)}
                        className="sr-only"
                      />
                      <Icon className={`h-5 w-5 mr-3 ${option.color}`} />
                      <span className="text-sm font-medium text-gray-900">{option.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                Update Status
              </Button>
              <Button type="button" variant="outline" onClick={onClose} className="px-6">
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const ManualConfirmations: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);

  // Fetch payment requests
  const { data: paymentRequests, isLoading, error } = useQuery({
    queryKey: ['admin-payment-requests', statusFilter],
    queryFn: async () => {
      try {
        const response = await paymentRequestService.getAll();
        const requests = response.data.data.paymentRequests || [];
        
        // Apply status filter
        if (statusFilter === 'all') {
          return requests;
        } else if (statusFilter === 'pending') {
          // Pending means sent or viewed (awaiting action)
          return requests.filter((req: any) => 
            req.status === 'sent' || req.status === 'viewed'
          );
        } else {
          return requests.filter((req: any) => req.status === statusFilter);
        }
      } catch (error) {
        console.error('Failed to fetch payment requests:', error);
        return [];
      }
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PaymentRequestStatus }) => {
      return paymentRequestService.updateStatus(id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payment-requests'] });
      setSelectedRequest(null);
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Failed to update status');
    },
  });

  const handleUpdateStatus = (status: PaymentRequestStatus) => {
    if (selectedRequest) {
      updateStatusMutation.mutate({ id: selectedRequest._id, status });
    }
  };

  const filteredRequests = paymentRequests?.filter((req: any) =>
    req.referenceCode?.toLowerCase().includes(search.toLowerCase()) ||
    req.customerInfo?.email?.toLowerCase().includes(search.toLowerCase()) ||
    req.customerInfo?.name?.toLowerCase().includes(search.toLowerCase()) ||
    req.invoiceNumber?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message="Failed to load payment requests" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manual Confirmations</h1>
        <p className="text-gray-600">Review pending payment requests from merchants</p>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by reference, customer, or invoice..."
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
              <option value="pending">Pending (Sent/Viewed)</option>
              <option value="all">All Statuses</option>
              <option value="sent">Sent</option>
              <option value="viewed">Viewed</option>
              <option value="paid">Paid</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Payment Requests</p>
                <p className="text-3xl font-bold text-gray-900">{paymentRequests?.length || 0}</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FileText className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 mb-1">Total Value</p>
                <p className="text-2xl font-bold text-gray-900 truncate">
                  {formatCurrency(
                    paymentRequests?.reduce((sum: number, req: any) => sum + req.amount, 0) || 0,
                    'USD'
                  )}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 ml-4">
                <Filter className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Requests List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Reference / Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Merchant
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
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <p className="text-gray-500">No pending payment requests</p>
                  </td>
                </tr>
              ) : (
                filteredRequests?.map((request: any) => (
                  <tr key={request._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        {request.referenceCode && (
                          <div className="font-mono text-sm text-gray-900">{request.referenceCode}</div>
                        )}
                        {request.invoiceNumber && (
                          <div className="text-sm text-gray-500">Invoice: {request.invoiceNumber}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">{request.customerInfo?.name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{request.customerInfo?.email || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {request.userId?.legalName || request.userId?.email || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold">
                      {formatCurrency(request.amount, request.currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {request.paymentMethods?.map((method: string) => (
                          <span
                            key={method}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 capitalize"
                          >
                            {method.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(request.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/payment-requests/${request._id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setSelectedRequest(request)}
                          disabled={updateStatusMutation.isPending}
                        >
                          Update Status
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

      {/* Update Status Modal */}
      {selectedRequest && (
        <UpdateStatusModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onUpdate={handleUpdateStatus}
        />
      )}
    </div>
  );
};

export default ManualConfirmations;

