// src/components/admin/AdminContactList.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import UserService from '../../services/user.service';

const AdminContactList = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    if (contacts.length > 0) {
      const filtered = contacts.filter(contact => 
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.subject.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredContacts(filtered);
    }
  }, [searchTerm, contacts]);

  const fetchContacts = () => {
    setLoading(true);
    UserService.getAllContacts()
      .then(response => {
        setContacts(response.data);
        setFilteredContacts(response.data);
        setLoading(false);
      })
      .catch(error => {
        const resMessage = (error.response && 
          error.response.data && 
          Object.values(error.response.data).flat().join(' ')) || 
          error.message || 
          error.toString();
        
        setError(resMessage);
        setLoading(false);
      });
  };

  const handleStatusChange = (contactId, isResolved) => {
    UserService.updateContactStatus(contactId, isResolved)
      .then(response => {
        setIsSuccess(true);
        setMessage(`Contact status updated successfully!`);
        
        // Update the contact list
        fetchContacts();
        
        // Clear message after a delay
        setTimeout(() => {
          setMessage('');
        }, 3000);
      })
      .catch(error => {
        const resMessage = (error.response && 
          error.response.data && 
          Object.values(error.response.data).flat().join(' ')) || 
          error.message || 
          error.toString();
        
        setMessage(resMessage);
        setIsSuccess(false);
        
        // Clear message after a delay
        setTimeout(() => {
          setMessage('');
        }, 3000);
      });
  };

  const handleReply = (contact) => {
    setSelectedContact(contact);
    setReplyMessage('');
  };

  const sendReply = () => {
    if (!replyMessage.trim()) {
      setMessage('Please enter a reply message');
      setIsSuccess(false);
      return;
    }
    
    // In a real application, this would send an email to the user
    // For now, we'll just mark it as resolved
    UserService.updateContactStatus(selectedContact.id, true)
      .then(response => {
        setIsSuccess(true);
        setMessage(`Reply sent to ${selectedContact.email} successfully!`);
        
        // Close the modal and reset
        setSelectedContact(null);
        setReplyMessage('');
        
        // Update the contact list
        fetchContacts();
        
        // Clear message after a delay
        setTimeout(() => {
          setMessage('');
        }, 3000);
      })
      .catch(error => {
        const resMessage = (error.response && 
          error.response.data && 
          Object.values(error.response.data).flat().join(' ')) || 
          error.message || 
          error.toString();
        
        setMessage(resMessage);
        setIsSuccess(false);
      });
  };

  if (loading) {
    return <div>Loading contacts...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h2>Contact Submissions</h2>
        <Link to="/admin" className="btn btn-secondary">Back to Dashboard</Link>
      </div>
      <div className="card-body">
        {message && (
          <div className={`alert ${isSuccess ? 'alert-success' : 'alert-danger'}`} role="alert">
            {message}
          </div>
        )}
        
        <div className="mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Search by name, email, or subject"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Name</th>
                <th>Email</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.length > 0 ? (
                filteredContacts.map(contact => (
                  <tr key={contact.id}>
                    <td>{contact.id}</td>
                    <td>{new Date(contact.created_at).toLocaleDateString()}</td>
                    <td>{contact.name}</td>
                    <td>{contact.email}</td>
                    <td>{contact.subject}</td>
                    <td>
                      <span className={`badge ${contact.is_resolved ? 'bg-success' : 'bg-warning'}`}>
                        {contact.is_resolved ? 'Resolved' : 'Pending'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-sm btn-primary me-2"
                        onClick={() => handleReply(contact)}
                        data-bs-toggle="modal" 
                        data-bs-target="#replyModal"
                      >
                        Reply
                      </button>
                      <button 
                        className={`btn btn-sm ${contact.is_resolved ? 'btn-secondary' : 'btn-success'}`}
                        onClick={() => handleStatusChange(contact.id, !contact.is_resolved)}
                      >
                        {contact.is_resolved ? 'Mark as Pending' : 'Mark as Resolved'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center">No contacts found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Reply Modal */}
        <div className="modal fade" id="replyModal" tabIndex="-1" aria-labelledby="replyModalLabel" aria-hidden="true">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="replyModalLabel">
                  {selectedContact && `Reply to ${selectedContact.name}`}
                </h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div className="modal-body">
                {selectedContact && (
                  <>
                    <div className="mb-3">
                      <label className="form-label">Subject</label>
                      <p className="form-control-plaintext">{selectedContact.subject}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Original Message</label>
                      <p className="form-control-plaintext border p-2">{selectedContact.message}</p>
                    </div>
                    <div className="mb-3">
                      <label htmlFor="replyMessage" className="form-label">Your Reply</label>
                      <textarea
                        className="form-control"
                        id="replyMessage"
                        rows="5"
                        value={replyMessage}
                        onChange={e => setReplyMessage(e.target.value)}
                        required
                      ></textarea>
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={sendReply}
                  data-bs-dismiss="modal"
                >
                  Send Reply
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminContactList;