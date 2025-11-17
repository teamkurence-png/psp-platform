import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorAlert from '../components/ui/ErrorAlert';
import { formatDateTime } from '../lib/utils';
import merchantLeaderService from '../services/merchantLeaderService';
import { useNavigate } from 'react-router-dom';
import { Users, ArrowLeft, Building2, Mail, Phone, Globe } from 'lucide-react';
import type { Merchant } from '../types';

const GroupMerchants: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    loadMerchants();
  }, [pagination.page]);

  const loadMerchants = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await merchantLeaderService.getGroupMerchants({
        page: pagination.page,
        limit: pagination.limit,
      });
      setMerchants(response.data.merchants);
      setPagination(response.data.pagination);
    } catch (error: any) {
      console.error('Failed to load group merchants:', error);
      setError(error.response?.data?.error || 'Failed to load group merchants');
    } finally {
      setLoading(false);
    }
  };

  if (loading && merchants.length === 0) {
    return <LoadingSpinner message="Loading group merchants..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/merchant-leader-dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Group Merchants</h1>
            <p className="text-muted-foreground">
              {pagination.total} merchant{pagination.total !== 1 ? 's' : ''} in your group
            </p>
          </div>
        </div>
        <Users className="h-8 w-8 text-muted-foreground" />
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}

      {/* Merchants List */}
      {merchants.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No merchants in your group</h3>
              <p className="text-muted-foreground">
                You don't have any merchants assigned to your group yet.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {merchants.map((merchant) => (
            <Card key={merchant._id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-4">
                    {/* Merchant Name and Basic Info */}
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h3 className="text-xl font-semibold">{merchant.legalName}</h3>
                        {merchant.dba && merchant.dba !== merchant.legalName && (
                          <p className="text-sm text-muted-foreground">DBA: {merchant.dba}</p>
                        )}
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {merchant.supportEmail && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <a href={`mailto:${merchant.supportEmail}`} className="text-blue-600 hover:underline">
                            {merchant.supportEmail}
                          </a>
                        </div>
                      )}
                      {merchant.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{merchant.phone}</span>
                        </div>
                      )}
                      {merchant.website && (
                        <div className="flex items-center gap-2 text-sm">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <a
                            href={merchant.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {merchant.website}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Additional Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      {merchant.industry && (
                        <div>
                          <span className="font-medium">Industry:</span>{' '}
                          <span className="text-muted-foreground">{merchant.industry}</span>
                        </div>
                      )}
                      {merchant.registrationNumber && (
                        <div>
                          <span className="font-medium">Registration #:</span>{' '}
                          <span className="text-muted-foreground">{merchant.registrationNumber}</span>
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Member Since:</span>{' '}
                        <span className="text-muted-foreground">
                          {formatDateTime(merchant.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Address */}
                    {merchant.address && (
                      <div className="text-sm">
                        <span className="font-medium">Address:</span>{' '}
                        <span className="text-muted-foreground">
                          {merchant.address.street && `${merchant.address.street}, `}
                          {merchant.address.city && `${merchant.address.city}, `}
                          {merchant.address.state && `${merchant.address.state} `}
                          {merchant.address.postalCode && `${merchant.address.postalCode}, `}
                          {merchant.address.country}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page === 1 || loading}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.pages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page === pagination.pages || loading}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default GroupMerchants;

