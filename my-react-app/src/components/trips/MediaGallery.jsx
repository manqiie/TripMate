// src/components/trips/MediaGallery.jsx
import React, { useState } from 'react';
import { FaImage, FaVideo, FaPlay, FaDownload, FaEye, FaTimes } from 'react-icons/fa';

const MediaGallery = ({ media = [] }) => {
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleMediaClick = (mediaItem) => {
    setSelectedMedia(mediaItem);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedMedia(null);
  };

  const getMediaIcon = (mediaType) => {
    switch (mediaType) {
      case 'image':
        return <FaImage />;
      case 'video':
        return <FaVideo />;
      default:
        return <FaImage />;
    }
  };

  if (media.length === 0) {
    return (
      <div className="text-center py-4">
        <FaImage size={48} className="text-muted mb-3" />
        <p className="text-muted">No media uploaded yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="row g-2">
        {media.map((item) => (
          <div key={item.id} className="col-6 col-md-4 col-lg-3">
            <div 
              className="card border-0 shadow-sm h-100"
              style={{ cursor: 'pointer' }}
              onClick={() => handleMediaClick(item)}
            >
              <div className="position-relative">
                {item.media_type === 'image' ? (
                  <img
                    src={item.file_url}
                    alt={item.title || 'Trip media'}
                    className="card-img-top"
                    style={{ height: '120px', objectFit: 'cover' }}
                  />
                ) : item.media_type === 'video' ? (
                  <div 
                    className="card-img-top bg-dark d-flex align-items-center justify-content-center"
                    style={{ height: '120px' }}
                  >
                    <FaPlay className="text-white" size={24} />
                  </div>
                ) : (
                  <div 
                    className="card-img-top bg-light d-flex align-items-center justify-content-center"
                    style={{ height: '120px' }}
                  >
                    {getMediaIcon(item.media_type)}
                  </div>
                )}
                
                <div className="position-absolute top-0 end-0 m-2">
                  <span className="badge bg-dark bg-opacity-75">
                    {getMediaIcon(item.media_type)}
                  </span>
                </div>
              </div>
              
              {item.title && (
                <div className="card-body p-2">
                  <p className="card-text small mb-0" title={item.title}>
                    {item.title.length > 30 ? `${item.title.substring(0, 30)}...` : item.title}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Media Modal */}
      {showModal && selectedMedia && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {selectedMedia.title || 'Media'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={closeModal}
                ></button>
              </div>
              <div className="modal-body p-0">
                {selectedMedia.media_type === 'image' ? (
                  <img
                    src={selectedMedia.file_url}
                    alt={selectedMedia.title}
                    className="img-fluid w-100"
                  />
                ) : selectedMedia.media_type === 'video' ? (
                  <video
                    controls
                    className="w-100"
                    style={{ maxHeight: '500px' }}
                  >
                    <source src={selectedMedia.file_url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="p-4 text-center">
                    <p>Media preview not available</p>
                    <a 
                      href={selectedMedia.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                    >
                      <FaDownload className="me-2" />
                      Download File
                    </a>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <div className="flex-grow-1">
                  {selectedMedia.description && (
                    <p className="text-muted small mb-0">{selectedMedia.description}</p>
                  )}
                  {selectedMedia.captured_at && (
                    <small className="text-muted">
                      Captured: {new Date(selectedMedia.captured_at).toLocaleString()}
                    </small>
                  )}
                </div>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal Backdrop */}
      {showModal && (
        <div className="modal-backdrop fade show" onClick={closeModal}></div>
      )}
    </>
  );
};

export default MediaGallery;