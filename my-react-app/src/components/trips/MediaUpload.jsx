// src/components/trips/MediaUpload.jsx
import React, { useState, useRef } from 'react';
import { FaUpload, FaCamera, FaVideo, FaFile, FaTimes } from 'react-icons/fa';

const MediaUpload = ({ onUpload, destinations = [] }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    destination: '',
    title: '',
    description: '',
    captured_at: ''
  });

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        setError(`File ${file.name} is too large. Maximum size is 50MB.`);
        return false;
      }
      return true;
    });

    setSelectedFiles(validFiles);
    if (validFiles.length > 0) {
      setError('');
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one file to upload.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      for (const file of selectedFiles) {
        const uploadData = {
          title: formData.title || file.name,
          description: formData.description,
          captured_at: formData.captured_at || null,
          destination: formData.destination || null
        };

        await onUpload(file, uploadData);
      }

      // Reset form
      setSelectedFiles([]);
      setFormData({
        destination: '',
        title: '',
        description: '',
        captured_at: ''
      });
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setError('Failed to upload media. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) return <FaCamera />;
    if (file.type.startsWith('video/')) return <FaVideo />;
    return <FaFile />;
  };

  const formatFileSize = (bytes) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="card">
      <div className="card-header">
        <h6 className="mb-0">
          <FaUpload className="me-2" />
          Upload Media
        </h6>
      </div>
      <div className="card-body">
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {/* File Selection */}
        <div className="mb-3">
          <label className="form-label">Select Files</label>
          <input
            ref={fileInputRef}
            type="file"
            className="form-control"
            multiple
            accept="image/*,video/*,audio/*"
            onChange={handleFileSelect}
          />
          <div className="form-text">
            Supported formats: Images (JPG, PNG, GIF), Videos (MP4, MOV), Audio (MP3, WAV). Max size: 50MB per file.
          </div>
        </div>

        {/* Selected Files Preview */}
        {selectedFiles.length > 0 && (
          <div className="mb-3">
            <label className="form-label">Selected Files ({selectedFiles.length})</label>
            <div className="list-group">
              {selectedFiles.map((file, index) => (
                <div key={index} className="list-group-item d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <div className="me-3">
                      {getFileIcon(file)}
                    </div>
                    <div>
                      <div className="fw-medium">{file.name}</div>
                      <small className="text-muted">{formatFileSize(file.size)}</small>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => removeFile(index)}
                  >
                    <FaTimes />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Form */}
        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label">Title (Optional)</label>
            <input
              type="text"
              className="form-control"
              name="title"
              value={formData.title}
              onChange={handleFormChange}
              placeholder="Enter a title for your media"
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Destination (Optional)</label>
            <select
              className="form-select"
              name="destination"
              value={formData.destination}
              onChange={handleFormChange}
            >
              <option value="">Not associated with a destination</option>
              {destinations.map(dest => (
                <option key={dest.id} value={dest.id}>
                  {dest.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label">Captured Date & Time (Optional)</label>
            <input
              type="datetime-local"
              className="form-control"
              name="captured_at"
              value={formData.captured_at}
              onChange={handleFormChange}
            />
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">Description (Optional)</label>
          <textarea
            className="form-control"
            name="description"
            value={formData.description}
            onChange={handleFormChange}
            rows="3"
            placeholder="Add a description for your media..."
          />
        </div>

        <div className="d-flex justify-content-end">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={uploading || selectedFiles.length === 0}
          >
            {uploading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Uploading...
              </>
            ) : (
              <>
                <FaUpload className="me-2" />
                Upload Media
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MediaUpload;