import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import FilterBar from '../components/ui/FilterBar';
import StatusBadge from '../components/ui/StatusBadge';
import ErrorAlert from '../components/ui/ErrorAlert';
import { formatDateTime } from '../lib/utils';
import { useList, useSearch } from '../hooks';
import { merchantService } from '../services';
import { OnboardingStatus, UserRole, type Merchant } from '../types';
import { useAuth } from '../lib/auth';
import { CheckCircle, XCircle, Building2 } from 'lucide-react';

const Merchants: React.FC = () => {
  const { user } = useAuth();
  const { items: merchants, loading, setItems, setLoading } = useList<Merchant>();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [error, setError] = useState('');
  const [reviewingMerchant, setReviewingMerchant] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const isAdminOrOps = user?.role === UserRole.ADMIN || user?.role === UserRole.OPS;

  useEffect(() => {
    fetchMerchants();
  }, [statusFilter]);

  const fetchMerchants = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await merchantService.listMerchants({
        status: statusFilter || undefined,
      });
      setItems(response.merchants || []);
    } catch (error: any) {
      console.error('Failed to fetch merchants:', error);
      setError(error.response?.data?.error || 'Failed to load merchants');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (merchantId: string) => {
    try {
      setReviewingMerchant(merchantId);
      await merchantService.reviewMerchant(merchantId, 'approved');
      await fetchMerchants();
    } catch (error: any) {
      console.error('Failed to approve merchant:', error);
      setError(error.response?.data?.error || 'Failed to approve merchant');
    } finally {
      setReviewingMerchant(null);
    }
  };

  const handleRejectClick = (merchantId: string) => {
    setSelectedMerchantId(merchantId);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async () => {
    if (!selectedMerchantId || !rejectionReason.trim()) {
      setError('Rejection reason is required');
      return;
    }

    try {
      setReviewingMerchant(selectedMerchantId);
      await merchantService.reviewMerchant(selectedMerchantId, 'rejected', rejectionReason);
      setShowRejectModal(false);
      setSelectedMerchantId(null);
      setRejectionReason('');
      await fetchMerchants();
    } catch (error: any) {
      console.error('Failed to reject merchant:', error);
      setError(error.response?.data?.error || 'Failed to reject merchant');
    } finally {
      setReviewingMerchant(null);
    }
  };

  const { searchTerm, setSearchTerm, filteredItems: filteredMerchants } = useSearch(
    merchants,
    (merchant, term) => {
      const lowerTerm = term.toLowerCase();
      return (
        merchant.legalName.toLowerCase().includes(lowerTerm) ||
        (merchant.supportEmail?.toLowerCase().includes(lowerTerm) ?? false) ||
        (merchant.website?.toLowerCase().includes(lowerTerm) ?? false)
      );
    }
  );

  const getStatusColor = (status: OnboardingStatus) => {
    switch (status) {
      case OnboardingStatus.APPROVED:
        return 'success';
      case OnboardingStatus.IN_REVIEW:
        return 'warning';
      case OnboardingStatus.REJECTED:
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: OnboardingStatus) => {
    switch (status) {
      case OnboardingStatus.APPROVED:
        return 'Approved';
      case OnboardingStatus.IN_REVIEW:
        return 'In Review';
      case OnboardingStatus.REJECTED:
        return 'Rejected';
      default:
        return status;
    }
  };

  if (loading && merchants.length === 0) {
    return <LoadingSpinner message="Loading merchants..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Merchants</h1>
          <p className="text-muted-foreground">Manage merchant accounts and approvals</p>
        </div>
        <Building2 className="h-8 w-8 text-muted-foreground" />
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <FilterBar
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              searchPlaceholder="Search by name, email, or website..."
              showFilterButton={false}
            />
            
            {/* Status Filter */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={statusFilter === '' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('')}
              >
                All
              </Button>
              <Button
                variant={statusFilter === OnboardingStatus.IN_REVIEW ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(OnboardingStatus.IN_REVIEW)}
              >
                In Review
              </Button>
              <Button
                variant={statusFilter === OnboardingStatus.APPROVED ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(OnboardingStatus.APPROVED)}
              >
                Approved
              </Button>
              <Button
                variant={statusFilter === OnboardingStatus.REJECTED ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(OnboardingStatus.REJECTED)}
              >
                Rejected
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Merchants List */}
      <Card>
        <CardHeader>
          <CardTitle>All Merchants</CardTitle>
          <CardDescription>
            {filteredMerchants.length} {filteredMerchants.length === merchants.length ? 'total' : 'filtered'} merchant{filteredMerchants.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredMerchants.length === 0 ? (
            <EmptyState
              message={
                merchants.length === 0 
                  ? "No merchants yet" 
                  : "No merchants match your filters"
              }
            />
          ) : (
            <div className="space-y-4">
              {filteredMerchants.map((merchant) => (
                <div
                  key={merchant._id}
                  className="p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{merchant.legalName}</h3>
                        <StatusBadge 
                          status={getStatusColor(merchant.onboardingStatus)}
                          label={getStatusLabel(merchant.onboardingStatus)}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground mb-2">
                        {merchant.supportEmail && (
                          <div>
                            <span className="font-medium">Email:</span> {merchant.supportEmail}
                          </div>
                        )}
                        {merchant.website && (
                          <div>
                            <span className="font-medium">Website:</span>{' '}
                            <a 
                              href={merchant.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              {merchant.website}
                            </a>
                          </div>
                        )}
                        {merchant.industry && (
                          <div>
                            <span className="font-medium">Industry:</span> {merchant.industry}
                          </div>
                        )}
                        {merchant.registrationNumber && (
                          <div>
                            <span className="font-medium">Reg. Number:</span> {merchant.registrationNumber}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Created: {formatDateTime(merchant.createdAt)}</span>
                        {merchant.approvedAt && (
                          <>
                            <span>·</span>
                            <span>Approved: {formatDateTime(merchant.approvedAt)}</span>
                          </>
                        )}
                      </div>

                      {merchant.rejectionReason && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                          <span className="font-medium">Rejection Reason:</span> {merchant.rejectionReason}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons for Admin/Ops */}
                    {isAdminOrOps && merchant.onboardingStatus === OnboardingStatus.IN_REVIEW && (
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApprove(merchant._id)}
                          disabled={reviewingMerchant === merchant._id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectClick(merchant._id)}
                          disabled={reviewingMerchant === merchant._id}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowRejectModal(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold mb-4">Reject Merchant</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Please provide a reason for rejecting this merchant application:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background mb-4"
              rows={4}
              required
            />
            <div className="flex gap-3">
              <Button
                variant="destructive"
                onClick={handleRejectSubmit}
                disabled={!rejectionReason.trim() || !!reviewingMerchant}
                className="flex-1"
              >
                Confirm Rejection
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                disabled={!!reviewingMerchant}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Merchants;

