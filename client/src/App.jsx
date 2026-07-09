import { useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Tailor shop data
const TAILORS = {
  bebe: {
    id: 'bebe',
    name: 'BeBe Tailor',
    description: 'Elegant custom suits with over 30 years of experience crafting timeless European elegance',
    specialty: 'Classic European Cut',
    image: '✂️'
  },
  bluesky: {
    id: 'bluesky',
    name: 'Blue Sky Tailor',
    description: 'Modern tailoring with contemporary styles for the fashion-forward gentleman',
    specialty: 'Modern Slim Fit',
    image: '🪡'
  },
  yali: {
    id: 'yali',
    name: 'Yali Tailor',
    description: 'Traditional craftsmanship meets modern elegance in every stitch',
    specialty: 'Asian Fusion Style',
    image: '👔'
  }
};

function App() {
  const [step, setStep] = useState('selection'); // selection, form, confirmation
  const [selectedTailor, setSelectedTailor] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    roomNumber: '',
    email: '',
    phone: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [couponData, setCouponData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  const selectTailor = (tailorId) => {
    setSelectedTailor(TAILORS[tailorId]);
    setStep('form');
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'firstName':
      case 'lastName':
        return value.trim().length >= 2 ? '' : 'Must be at least 2 characters';
      case 'roomNumber':
        return /^\d+$/.test(value) ? '' : 'Must be a valid room number';
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Invalid email address';
      case 'phone':
        return !value || /^[\d\s\-\+\(\)]{7,}$/.test(value) ? '' : 'Invalid phone number';
      default:
        return '';
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const isFormValid = () => {
    const requiredFields = ['firstName', 'lastName', 'roomNumber', 'email'];
    return requiredFields.every(field => {
      const error = validateField(field, formData[field]);
      return !error && formData[field].trim();
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      if (['firstName', 'lastName', 'roomNumber', 'email'].includes(key)) {
        const error = validateField(key, formData[key]);
        if (error) newErrors[key] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/submit-coupon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tailorId: selectedTailor.id,
          firstName: formData.firstName,
          lastName: formData.lastName,
          roomNumber: formData.roomNumber,
          email: formData.email,
          phone: formData.phone
        })
      });

      const data = await response.json();

      if (data.success) {
        setCouponData({
          code: data.couponCode,
          tailor: data.tailor,
          guestName: `${formData.firstName} ${formData.lastName}`,
          roomNumber: formData.roomNumber,
          email: formData.email,
          createdAt: new Date().toLocaleString()
        });
        setStep('confirmation');
      } else {
        alert(data.message || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting coupon:', error);
      alert('Failed to submit. Please check if the server is running.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setStep('selection');
    setSelectedTailor(null);
    setFormData({
      firstName: '',
      lastName: '',
      roomNumber: '',
      email: '',
      phone: ''
    });
    setErrors({});
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Coupon code copied to clipboard!');
  };

  const printCoupon = () => {
    window.print();
  };

  const startNew = () => {
    setStep('selection');
    setSelectedTailor(null);
    setFormData({
      firstName: '',
      lastName: '',
      roomNumber: '',
      email: '',
      phone: ''
    });
    setErrors({});
    setCouponData(null);
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <header className="header">
        <div className="container">
          <h1>🏨 La Luna Hotel</h1>
          <p>Exclusive Guest Benefits</p>
        </div>
      </header>

      {/* Step 1: Tailor Selection */}
      {step === 'selection' && (
        <>
          <section className="hero">
            <div className="container">
              <h2>Welcome to La Luna</h2>
              <p>
                As our valued guest, enjoy an exclusive 10% discount at our partner 
                tailor shops. Select your preferred tailor below to get your coupon.
              </p>
            </div>
          </section>

          <section className="tailor-section">
            <div className="container">
              <h2 className="section-title">Choose Your Tailor</h2>
              <div className="tailor-grid">
                {Object.values(TAILORS).map(tailor => (
                  <div key={tailor.id} className="tailor-card">
                    <div className="tailor-icon">{tailor.image}</div>
                    <h3>{tailor.name}</h3>
                    <p className="specialty">{tailor.specialty}</p>
                    <p>{tailor.description}</p>
                    <button 
                      className="select-btn"
                      onClick={() => selectTailor(tailor.id)}
                    >
                      Select & Get Coupon
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {/* Step 2: Guest Information Form */}
      {step === 'form' && selectedTailor && (
        <section className="form-section">
          <div className="container">
            <div className="form-container">
              <span className="back-link" onClick={handleBack}>
                ← Back to Tailor Selection
              </span>

              <div className="form-header">
                <h2>Enter Your Information</h2>
                <div className="selected-tailor">
                  Selected: <span>{selectedTailor.name}</span>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>
                    First Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={errors.firstName ? 'error' : ''}
                    placeholder="John"
                  />
                  {errors.firstName && (
                    <div className="error-message">{errors.firstName}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>
                    Last Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={errors.lastName ? 'error' : ''}
                    placeholder="Smith"
                  />
                  {errors.lastName && (
                    <div className="error-message">{errors.lastName}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>
                    Room Number <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="roomNumber"
                    value={formData.roomNumber}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={errors.roomNumber ? 'error' : ''}
                    placeholder="101"
                  />
                  {errors.roomNumber && (
                    <div className="error-message">{errors.roomNumber}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>
                    Email Address <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={errors.email ? 'error' : ''}
                    placeholder="john.smith@email.com"
                  />
                  {errors.email && (
                    <div className="error-message">{errors.email}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>Phone Number (Optional)</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={errors.phone ? 'error' : ''}
                    placeholder="+1 234 567 8900"
                  />
                  {errors.phone && (
                    <div className="error-message">{errors.phone}</div>
                  )}
                </div>

                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={!isFormValid() || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner"></span>
                      Generating Coupon...
                    </>
                  ) : (
                    'Get My Coupon'
                  )}
                </button>
              </form>
            </div>
          </div>
        </section>
      )}

      {/* Step 3: Confirmation */}
      {step === 'confirmation' && couponData && (
        <section className="confirmation-section">
          <div className="container">
            <div className="success-icon">
              <div className="check">✓</div>
            </div>
            <h2 className="confirmation-title">Your Coupon is Ready!</h2>
            <p className="confirmation-subtitle">
              A confirmation email has been sent to {couponData.email}
            </p>

            <div className="coupon-card">
              <div className="coupon-header">
                <h3>{couponData.tailor.name}</h3>
                <p>Exclusive La Luna Partner</p>
              </div>
              <div className="coupon-body">
                <div className="coupon-code">
                  <p className="label">Your Coupon Code</p>
                  <p className="code">{couponData.code}</p>
                </div>
                <div className="coupon-details">
                  <div className="coupon-detail">
                    <span className="label">Guest Name</span>
                    <span className="value">{couponData.guestName}</span>
                  </div>
                  <div className="coupon-detail">
                    <span className="label">Room Number</span>
                    <span className="value">{couponData.roomNumber}</span>
                  </div>
                  <div className="coupon-detail">
                    <span className="label">Specialty</span>
                    <span className="value">{couponData.tailor.specialty}</span>
                  </div>
                  <div className="coupon-detail">
                    <span className="label">Created</span>
                    <span className="value">{couponData.createdAt}</span>
                  </div>
                </div>
                <div className="discount-badge">🎉 10% OFF</div>
              </div>
              <div className="coupon-footer">
                <div className="instructions">
                  <strong>How to redeem:</strong><br />
                  Show this coupon code or email to the staff at {couponData.tailor.name} 
                  to receive your 10% discount on your purchase.
                </div>
                <div className="actions">
                  <button 
                    className="action-btn primary"
                    onClick={() => copyToClipboard(couponData.code)}
                  >
                    📋 Copy Code
                  </button>
                  <button 
                    className="action-btn secondary"
                    onClick={printCoupon}
                  >
                    🖨️ Print Coupon
                  </button>
                </div>
                <button 
                  className="action-btn secondary"
                  onClick={startNew}
                  style={{ marginTop: '15px' }}
                >
                  Get Another Coupon
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>La Luna Hotel | Exclusive Guest Benefits Program</p>
          <p style={{ marginTop: '10px', fontSize: '0.8rem' }}>
            For assistance, please contact the front desk
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App
