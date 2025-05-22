// src/components/user/ContactForm.jsx - Fixed missing imports and better UX
import React, { useState } from 'react';
import UserService from '../../services/user.service';
import AuthService from '../../services/auth.service';
import { FaPaperPlane, FaUser, FaEnvelope, FaHeading, FaCommentAlt, FaCheck, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';

const ContactForm = () => {
  const currentUser = AuthService.getCurrentUser();
  const [formData, setFormData] = useState({
    name: currentUser ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() : '',
    email: currentUser ? currentUser.email : '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [showSuccessCard, setShowSuccessCard] = useState(false);

  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = e => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    UserService.submitContactForm(formData.name, formData.email, formData.subject, formData.message)
      .then(response => {
        setIsSuccess(true);
        setMessage('Your message has been sent successfully. We will get back to you soon!');
        setShowSuccessCard(true);
        
        // Clear form fields except name and email
        setFormData({
          ...formData,
          subject: '',
          message: ''
        });
        setLoading(false);
        
        // Hide success message after 5 seconds but keep the form visible
        setTimeout(() => {
          setMessage('');
          setShowSuccessCard(false);
        }, 5000);
      })
      .catch(error => {
        const resMessage = (error.response && 
          error.response.data && 
          Object.values(error.response.data).flat().join(' ')) || 
          error.message || 
          error.toString();
        
        setMessage(resMessage);
        setIsSuccess(false);
        setLoading(false);
        
        // Clear error message after 5 seconds
        setTimeout(() => {
          setMessage('');
        }, 5000);
      });
  };

  return (
    <div className="row justify-content-center">
      <div className="col-lg-8">
        {/* Success Card - shows temporarily */}
        {showSuccessCard && (
          <div className="card border-success mb-4">
            <div className="card-body text-center">
              <FaCheck className="text-success mb-2" size={40} />
              <h4 className="text-success">Message Sent Successfully!</h4>
              <p className="text-muted mb-0">Thank you for contacting us. We'll get back to you soon!</p>
            </div>
          </div>
        )}

        <div className="card shadow-sm">
          <div className="card-header bg-primary text-white text-center py-3">
            <h2 className="mb-0 d-flex align-items-center justify-content-center">
              <FaPaperPlane className="me-2" /> Contact Us
            </h2>
          </div>
          <div className="card-body p-4">
            {message && (
              <div className={`alert ${isSuccess ? 'alert-success' : 'alert-danger'} d-flex align-items-center`} role="alert">
                {isSuccess ? <FaCheck className="me-2" /> : null}
                {message}
              </div>
            )}
            
            <p className="text-center text-muted mb-4">
              Have questions or feedback? We'd love to hear from you! Fill out the form below and our team will get back to you as soon as possible.
            </p>
            
            <form onSubmit={onSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="name" className="form-label">
                    <FaUser className="me-2" />Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={onChange}
                    placeholder="Your name"
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="email" className="form-label">
                    <FaEnvelope className="me-2" />Email
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={onChange}
                    placeholder="Your email address"
                    required
                  />
                </div>
              </div>
              
              <div className="mb-3">
                <label htmlFor="subject" className="form-label">
                  <FaHeading className="me-2" />Subject
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={onChange}
                  placeholder="What is your message about?"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="message" className="form-label">
                  <FaCommentAlt className="me-2" />Message
                </label>
                <textarea
                  className="form-control"
                  id="message"
                  name="message"
                  rows="6"
                  value={formData.message}
                  onChange={onChange}
                  placeholder="Please describe your question or feedback in detail..."
                  required
                ></textarea>
              </div>
              
              <div className="d-grid">
                <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Sending...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane className="me-2" /> Send Message
                    </>
                  )}
                </button>
              </div>
            </form>
            
            <div className="row mt-5">
              <div className="col-md-4 text-center mb-3 mb-md-0">
                <div className="p-3 bg-light rounded-circle d-inline-flex justify-content-center align-items-center mb-3" style={{ width: "60px", height: "60px" }}>
                  <FaEnvelope size={24} className="text-primary" />
                </div>
                <h5>Email Us</h5>
                <p className="text-muted">support@tripmate.com</p>
              </div>
              
              <div className="col-md-4 text-center mb-3 mb-md-0">
                <div className="p-3 bg-light rounded-circle d-inline-flex justify-content-center align-items-center mb-3" style={{ width: "60px", height: "60px" }}>
                  <FaPhone size={24} className="text-primary" />
                </div>
                <h5>Call Us</h5>
                <p className="text-muted">+1 (555) 123-4567</p>
              </div>
              
              <div className="col-md-4 text-center">
                <div className="p-3 bg-light rounded-circle d-inline-flex justify-content-center align-items-center mb-3" style={{ width: "60px", height: "60px" }}>
                  <FaMapMarkerAlt size={24} className="text-primary" />
                </div>
                <h5>Location</h5>
                <p className="text-muted">123 Travel St, New York, NY</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactForm;