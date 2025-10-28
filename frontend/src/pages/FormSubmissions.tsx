import React, { useEffect, useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import ErrorAlert from '../components/ui/ErrorAlert';
import Pagination from '../components/ui/Pagination';
import { formatDateTime } from '../lib/utils';
import { contactService, type ContactSubmission } from '../services/contactService';
import { MessageSquare, Mail, User, Search } from 'lucide-react';

const FormSubmissions: React.FC = () => {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchSubmissions();
  }, [currentPage, searchTerm]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await contactService.getSubmissions({
        page: currentPage,
        limit: 10,
        search: searchTerm,
      });
      setSubmissions(response.submissions);
      setPagination(response.pagination);
    } catch (error: any) {
      console.error('Failed to fetch submissions:', error);
      setError(error.response?.data?.error || 'Failed to load form submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchSubmissions();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Form Submissions</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          View and manage contact form submissions from your website
        </p>
      </div>

      {error && <ErrorAlert message={error} onClose={() => setError('')} />}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Contact Messages</CardTitle>
              <CardDescription>
                All contact form submissions from potential customers
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search submissions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
                <Button type="submit" variant="outline">
                  Search
                </Button>
              </form>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : submissions.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No submissions yet"
              description={
                searchTerm
                  ? 'No submissions match your search criteria.'
                  : 'Contact form submissions will appear here once users submit the form.'
              }
            />
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <Card
                  key={submission.id}
                  className="border-l-4 border-l-primary hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Header with name and date */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {submission.name}
                            </h3>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              <span>{submission.email}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground text-right">
                          {formatDateTime(submission.createdAt)}
                        </div>
                      </div>

                      {/* Message */}
                      <div className="pl-12">
                        <div className="bg-gray-50 rounded-lg p-4 border">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {submission.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Card */}
      {!loading && submissions.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {pagination.total}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total Submissions
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  Showing {submissions.length} of {pagination.total}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FormSubmissions;

