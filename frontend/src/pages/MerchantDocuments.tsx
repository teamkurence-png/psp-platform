import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Label from '../components/ui/Label';
import { DocumentType } from '../types/index';
import api from '../lib/api';
import { Upload, FileText, Trash2, Download } from 'lucide-react';

interface Document {
  _id: string;
  type: DocumentType;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

const MerchantDocuments: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedType, setSelectedType] = useState<DocumentType>(DocumentType.INCORPORATION);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/merchants/documents');
      setDocuments(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select a file');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('type', selectedType);

      await api.post('/merchants/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      alert('Document uploaded successfully!');
      setSelectedFile(null);
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      await fetchDocuments();
    } catch (error: any) {
      console.error('Failed to upload document:', error);
      alert(error.response?.data?.error || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await api.delete(`/merchants/documents/${documentId}`);
      alert('Document deleted successfully!');
      await fetchDocuments();
    } catch (error: any) {
      console.error('Failed to delete document:', error);
      alert(error.response?.data?.error || 'Failed to delete document');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getDocumentTypeLabel = (type: DocumentType): string => {
    switch (type) {
      case DocumentType.INCORPORATION:
        return 'Certificate of Incorporation';
      case DocumentType.BANK_LETTER:
        return 'Bank Reference Letter';
      case DocumentType.PROOF_OF_ADDRESS:
        return 'Proof of Business Address';
      case DocumentType.WEBSITE_SCREENSHOT:
        return 'Website Screenshot';
      case DocumentType.PROCESSING_HISTORY:
        return 'Processing History Statement';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Documents</h1>
        <p className="text-muted-foreground">Upload required documents for onboarding</p>
      </div>

      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Document</CardTitle>
          <CardDescription>Select document type and upload file (Max 10MB)</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <Label htmlFor="document-type">Document Type</Label>
              <select
                id="document-type"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as DocumentType)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mt-2"
              >
                {Object.values(DocumentType).map((type) => (
                  <option key={type} value={type}>
                    {getDocumentTypeLabel(type)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="file-upload">Choose File</Label>
              <div className="mt-2 flex items-center gap-4">
                <input
                  id="file-upload"
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
                {selectedFile && (
                  <span className="text-sm text-muted-foreground">
                    {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </span>
                )}
              </div>
            </div>

            <Button type="submit" disabled={uploading || !selectedFile}>
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? 'Uploading...' : 'Upload Document'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Documents</CardTitle>
          <CardDescription>
            {documents.length} document{documents.length !== 1 ? 's' : ''} uploaded
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No documents uploaded yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Upload required documents to complete your onboarding
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div
                  key={doc._id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{getDocumentTypeLabel(doc.type)}</h3>
                      <p className="text-sm text-muted-foreground">{doc.fileName}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatFileSize(doc.fileSize)} • Uploaded{' '}
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`${api.defaults.baseURL}/${doc.filePath}`, '_blank')}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(doc._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Requirements Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-blue-900 mb-2">Required Documents</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Certificate of Incorporation (Required)</li>
            <li>• Bank Reference Letter (Required)</li>
            <li>• Proof of Business Address (Required)</li>
            <li>• Website Screenshot (Recommended)</li>
            <li>• Processing History Statement (if applicable)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default MerchantDocuments;

