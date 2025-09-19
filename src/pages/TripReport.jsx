import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Eye, 
  Download, 
  Trash2, 
  Search, 
  Filter,
  Calendar,
  User,
  File,
  Plus,
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

export default function TripReport() {
  const [tripReports, setTripReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const itemsPerPage = 10;

  // Search and filter states
  const [generalSearch, setGeneralSearch] = useState('');
  const [documentTypeFilter, setDocumentTypeFilter] = useState('All');
  const [uploadedByFilter, setUploadedByFilter] = useState('All');

  // Upload form states
  const [uploadForm, setUploadForm] = useState({
    receiptNumber: '',
    notes: '',
    uploadedBy: 'Admin'
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef(null);

  // Unique filter values
  const [uniqueDocumentTypes, setUniqueDocumentTypes] = useState(['All']);
  const [uniqueUploadedBy, setUniqueUploadedBy] = useState(['All']);

  // Fetch trip reports
  const fetchTripReports = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        ...(documentTypeFilter !== 'All' && { documentType: documentTypeFilter }),
        ...(uploadedByFilter !== 'All' && { uploadedBy: uploadedByFilter }),
        ...(generalSearch && { search: generalSearch })
      });

      const response = await fetch(`http://localhost:5000/api/trip-reports?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setTripReports(data.tripReports || []);
      setPagination(data.pagination || {});
      
      // Extract unique values for filters
      if (data.tripReports && data.tripReports.length > 0) {
        const docTypes = ['All', ...new Set(data.tripReports.map(report => report.documentType))];
        const uploaders = ['All', ...new Set(data.tripReports.map(report => report.uploadedBy))];
        setUniqueDocumentTypes(docTypes);
        setUniqueUploadedBy(uploaders);
      }

    } catch (err) {
      console.error('Error fetching trip reports:', err);
      setError(`Failed to load trip reports: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png',
        'text/plain'
      ];

      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Only PDF, DOC, DOCX, Excel, JPG, PNG files are allowed.');
        return;
      }

      setSelectedFile(file);
      setError('');
    }
  };

  // Handle upload form submission
  const handleUpload = async (event) => {
    event.preventDefault();
    
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    if (!uploadForm.receiptNumber.trim()) {
      setError('Receipt number is required');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('receiptNumber', uploadForm.receiptNumber.trim());
      formData.append('notes', uploadForm.notes);
      formData.append('uploadedBy', uploadForm.uploadedBy);

      const response = await fetch('http://localhost:5000/api/trip-reports', {
        method: 'POST',
        body: formData, // Don't set Content-Type header for FormData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      setSuccess('Trip report uploaded successfully!');
      setShowUploadModal(false);
      resetUploadForm();
      fetchTripReports(currentPage);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      console.error('Error uploading trip report:', err);
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Reset upload form
  const resetUploadForm = () => {
    setUploadForm({
      receiptNumber: '',
      notes: '',
      uploadedBy: 'Admin'
    });
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle archive/delete
  const handleArchive = async (id) => {
    if (!window.confirm('Are you sure you want to archive this trip report?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/trip-reports/${id}/archive`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to archive trip report');
      }

      setSuccess('Trip report archived successfully');
      fetchTripReports(currentPage);

      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      console.error('Error archiving trip report:', err);
      setError('Failed to archive trip report');
    }
  };

  // Handle download
  const handleDownload = async (id, fileName) => {
    try {
      const response = await fetch(`http://localhost:5000/api/trip-reports/download/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (err) {
      console.error('Error downloading file:', err);
      setError('Failed to download file');
    }
  };

  // Handle view/preview
  const handleView = async (id) => {
    try {
      const url = `http://localhost:5000/api/trip-reports/view/${id}`;
      window.open(url, '_blank');
    } catch (err) {
      console.error('Error viewing file:', err);
      setError('Failed to view file');
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get document type badge color
  const getDocumentTypeBadge = (type) => {
    const colors = {
      'PDF': 'bg-red-100 text-red-800',
      'DOC': 'bg-blue-100 text-blue-800',
      'DOCX': 'bg-blue-100 text-blue-800',
      'Excel': 'bg-green-100 text-green-800',
      'JPG': 'bg-purple-100 text-purple-800',
      'JPEG': 'bg-purple-100 text-purple-800',
      'PNG': 'bg-purple-100 text-purple-800',
      'TXT': 'bg-gray-100 text-gray-800',
      'Other': 'bg-yellow-100 text-yellow-800'
    };
    return colors[type] || colors['Other'];
  };

  // Effects
  useEffect(() => {
    fetchTripReports(1);
    setCurrentPage(1);
  }, [documentTypeFilter, uploadedByFilter, generalSearch]);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Trip Reports</h1>
          <p className="text-gray-600 text-sm">Manage and view uploaded trip documents and receipts</p>
        </div>
        
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search receipts, files..."
            value={generalSearch}
            onChange={(e) => setGeneralSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          />
        </div>

        <select
          value={documentTypeFilter}
          onChange={(e) => setDocumentTypeFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
        >
          {uniqueDocumentTypes.map(type => (
            <option key={type} value={type}>{type === 'All' ? 'All Types' : type}</option>
          ))}
        </select>

        <select
          value={uploadedByFilter}
          onChange={(e) => setUploadedByFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
        >
          {uniqueUploadedBy.map(uploader => (
            <option key={uploader} value={uploader}>{uploader === 'All' ? 'All Uploaders' : uploader}</option>
          ))}
        </select>

        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <FileText className="w-4 h-4" />
          <span>
            {pagination.totalItems || 0} total documents
          </span>
        </div>
      </div>

      {/* Trip Reports Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading trip reports...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Receipt Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tripReports.map((report, index) => {
                  const displayNumber = ((currentPage - 1) * itemsPerPage) + index + 1;
                  
                  return (
                    <tr key={report._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {displayNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-blue-600">
                          {report.receiptNumber}
                        </div>
                        {report.tripNumber && (
                          <div className="text-xs text-gray-500">
                            Trip: {report.tripNumber}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDocumentTypeBadge(report.documentType)}`}>
                          {report.documentType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate" title={report.originalFileName}>
                          {report.originalFileName}
                        </div>
                        {report.notes && (
                          <div className="text-xs text-gray-500 max-w-xs truncate" title={report.notes}>
                            Notes: {report.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatFileSize(report.fileSize)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{report.uploadedBy}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          {formatDate(report.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleView(report._id)}
                          className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                          title="View Document"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </button>
                        <button
                          onClick={() => handleDownload(report._id, report.originalFileName)}
                          className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
                          title="Download Document"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </button>
                        <button
                          onClick={() => handleArchive(report._id)}
                          className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                          title="Archive Document"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Archive
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {tripReports.length === 0 && !loading && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No trip reports found</h3>
                <p className="text-gray-500">
                  {generalSearch || documentTypeFilter !== 'All' || uploadedByFilter !== 'All'
                    ? "No documents match your current filters."
                    : "Upload your first trip report to get started."}
                </p>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Document
                </button>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => {
                    setCurrentPage(currentPage - 1);
                    fetchTripReports(currentPage - 1);
                  }}
                  disabled={!pagination.hasPrev}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                    pagination.hasPrev
                      ? 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                      : 'border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => {
                    setCurrentPage(currentPage + 1);
                    fetchTripReports(currentPage + 1);
                  }}
                  disabled={!pagination.hasNext}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                    pagination.hasNext
                      ? 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                      : 'border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed'
                  }`}
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing page <span className="font-medium">{currentPage}</span> of{' '}
                    <span className="font-medium">{pagination.totalPages}</span> pages
                    ({pagination.totalItems} total documents)
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => {
                        setCurrentPage(currentPage - 1);
                        fetchTripReports(currentPage - 1);
                      }}
                      disabled={!pagination.hasPrev}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium ${
                        pagination.hasPrev
                          ? 'border-gray-300 text-gray-500 bg-white hover:bg-gray-50'
                          : 'border-gray-200 text-gray-300 bg-gray-100 cursor-not-allowed'
                      }`}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => {
                        setCurrentPage(currentPage + 1);
                        fetchTripReports(currentPage + 1);
                      }}
                      disabled={!pagination.hasNext}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium ${
                        pagination.hasNext
                          ? 'border-gray-300 text-gray-500 bg-white hover:bg-gray-50'
                          : 'border-gray-200 text-gray-300 bg-gray-100 cursor-not-allowed'
                      }`}
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleUpload}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Upload Trip Report</h3>
                    <button
                      type="button"
                      onClick={() => {
                        setShowUploadModal(false);
                        resetUploadForm();
                        setError('');
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Receipt Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Receipt Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={uploadForm.receiptNumber}
                        onChange={(e) => setUploadForm({...uploadForm, receiptNumber: e.target.value})}
                        placeholder="Enter receipt number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      />
                    </div>

                    {/* File Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Document File *
                      </label>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
                        <div className="space-y-1 text-center">
                          <Upload className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="flex text-sm text-gray-600">
                            <label
                              htmlFor="file-upload"
                              className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                            >
                              <span>Upload a file</span>
                              <input
                                id="file-upload"
                                name="file-upload"
                                type="file"
                                className="sr-only"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt"
                              />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500">
                            PDF, DOC, DOCX, Excel, JPG, PNG up to 10MB
                          </p>
                          {selectedFile && (
                            <div className="mt-2 text-sm text-green-600">
                              Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Uploaded By */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Uploaded By
                      </label>
                      <input
                        type="text"
                        value={uploadForm.uploadedBy}
                        onChange={(e) => setUploadForm({...uploadForm, uploadedBy: e.target.value})}
                        placeholder="Enter uploader name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes (Optional)
                      </label>
                      <textarea
                        rows={3}
                        value={uploadForm.notes}
                        onChange={(e) => setUploadForm({...uploadForm, notes: e.target.value})}
                        placeholder="Add any notes about this document..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={uploading || !selectedFile}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Uploading...
                      </>
                    ) : (
                      'Upload Document'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadModal(false);
                      resetUploadForm();
                      setError('');
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}