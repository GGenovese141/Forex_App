import React, { useState, useEffect, createContext, useContext } from 'react';
import PayPalCheckout from './components/PayPalCheckout';
import BookingCalendar from './components/BookingCalendar';
import AdminPanel from './components/AdminPanel';
import './App.css';

// Context for authentication
const AuthContext = createContext();

// Custom hook to use auth context
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider Component
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserInfo(token);
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }
  }, []);

  const fetchUserInfo = async (token) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        setUser(data.user);
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.detail };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const register = async (userData) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        setUser(data.user);
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.detail };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Header Component
const Header = ({ onShowLogin, onShowRegister, onShowAdmin }) => {
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <h1 className="logo">Forex Master Course</h1>
          <nav className="nav">
            {user ? (
              <div className="user-menu">
                <span className="user-info">
                  Benvenuto, {user.name}
                  {user.is_premium && <span className="premium-badge">Premium</span>}
                  {user.is_admin && <span className="admin-badge">Admin</span>}
                </span>
                {user.is_admin && (
                  <button onClick={onShowAdmin} className="btn btn-outline">
                    Admin
                  </button>
                )}
                <button onClick={logout} className="btn btn-outline">
                  Logout
                </button>
              </div>
            ) : (
              <div className="auth-buttons">
                <button onClick={onShowLogin} className="btn btn-outline">Login</button>
                <button onClick={onShowRegister} className="btn btn-primary">Registrati</button>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

// Hero Section Component
const HeroSection = ({ onShowRegister, onShowFreeCourse }) => {
  return (
    <section className="hero">
      <div className="hero-content">
        <div className="hero-text">
          <h1 className="hero-title">
            Diventa un <span className="highlight">Trader Forex</span> Professionale
          </h1>
          <p className="hero-subtitle">
            Impara le strategie vincenti del trading forex con il nostro corso completo. 
            Dalla teoria alla pratica, dal principiante all'esperto.
          </p>
          <div className="hero-buttons">
            <button onClick={onShowFreeCourse} className="btn btn-primary btn-large">
              Inizia Gratuitamente
            </button>
            <button className="btn btn-outline btn-large">
              Vedi Corso Completo
            </button>
          </div>
        </div>
        <div className="hero-image">
          <img 
            src="https://images.pexels.com/photos/7789849/pexels-photo-7789849.jpeg" 
            alt="Forex Trading Charts" 
            className="hero-img"
          />
        </div>
      </div>
    </section>
  );
};

// Course Sections Component
const CourseSections = ({ onShowPayment, onShowBooking }) => {
  const { user } = useAuth();

  const sections = [
    {
      id: 'apprendimento',
      title: 'Sezione Apprendimento',
      subtitle: 'Completamente Gratuita',
      description: 'Inizia il tuo viaggio nel trading forex con le nostre lezioni base gratuite.',
      features: [
        'Video lezioni introduttive',
        'PowerPoint con concetti base',
        'Prenotazione video call gratuita',
        'Nessun costo nascosto'
      ],
      price: 'Gratuito',
      buttonText: 'Inizia Ora',
      buttonClass: 'btn-success',
      available: true,
      action: () => onShowBooking()
    },
    {
      id: 'corso_completo',
      title: 'Corso Completo',
      subtitle: 'Accesso Premium',
      description: 'Sblocca tutto il potenziale del trading forex con il nostro corso completo.',
      features: [
        'Oltre 50 video lezioni avanzate',
        'Strategie di trading professionali',
        'Analisi tecnica approfondita',
        'Supporto dedicato'
      ],
      price: '€79,99',
      buttonText: user?.is_premium ? 'Accedi al Corso' : 'Acquista Ora',
      buttonClass: user?.is_premium ? 'btn-primary' : 'btn-warning',
      available: true,
      action: () => user?.is_premium ? alert('Funzionalità in arrivo!') : onShowPayment('corso_completo', 79.99)
    },
    {
      id: 'contenuti_extra',
      title: 'Contenuti Extra',
      subtitle: 'Specializzazioni',
      description: 'Approfondisci argomenti specifici con i nostri contenuti premium aggiuntivi.',
      features: [
        'PowerPoint Strategie Avanzate (€10,99)',
        'Video Strategia Configurazione (€14,99)',
        'PowerPoint Argomenti di Nicchia (€17,99)',
        'Acquista solo quello che ti serve'
      ],
      price: 'Da €10,99',
      buttonText: 'Vedi Contenuti',
      buttonClass: 'btn-outline',
      available: true,
      action: () => alert('Funzionalità contenuti extra in arrivo!')
    }
  ];

  return (
    <section className="course-sections">
      <div className="container">
        <h2 className="section-title">Scegli il Tuo Percorso di Apprendimento</h2>
        <div className="sections-grid">
          {sections.map((section) => (
            <div key={section.id} className="section-card">
              <div className="card-header">
                <h3 className="card-title">{section.title}</h3>
                <p className="card-subtitle">{section.subtitle}</p>
              </div>
              <div className="card-body">
                <p className="card-description">{section.description}</p>
                <ul className="features-list">
                  {section.features.map((feature, index) => (
                    <li key={index} className="feature-item">
                      <span className="feature-icon">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card-footer">
                <div className="price">{section.price}</div>
                <button onClick={section.action} className={`btn ${section.buttonClass} btn-block`}>
                  {section.buttonText}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Stats Section Component
const StatsSection = () => {
  const stats = [
    { number: '1000+', label: 'Studenti Formati' },
    { number: '50+', label: 'Video Lezioni' },
    { number: '95%', label: 'Tasso di Soddisfazione' },
    { number: '24/7', label: 'Supporto Disponibile' }
  ];

  return (
    <section className="stats-section">
      <div className="container">
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-item">
              <div className="stat-number">{stat.number}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Login Modal Component
const LoginModal = ({ isOpen, onClose, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password);
    if (result.success) {
      onClose();
      setEmail('');
      setPassword('');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Accedi al tuo account</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input"
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary btn-block">
            {loading ? 'Accesso in corso...' : 'Accedi'}
          </button>
        </form>
        <div className="modal-footer">
          <p>
            Non hai un account?{' '}
            <button className="link-button" onClick={onSwitchToRegister}>
              Registrati qui
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

// Register Modal Component
const RegisterModal = ({ isOpen, onClose, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    gdpr_consent: false,
    marketing_consent: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Le password non corrispondono');
      setLoading(false);
      return;
    }

    if (!formData.gdpr_consent) {
      setError('Devi accettare il trattamento dei dati personali');
      setLoading(false);
      return;
    }

    const result = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      gdpr_consent: formData.gdpr_consent,
      marketing_consent: formData.marketing_consent
    });

    if (result.success) {
      onClose();
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        gdpr_consent: false,
        marketing_consent: false
      });
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Crea il tuo account</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label>Nome Completo</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>Conferma Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="gdpr_consent"
                checked={formData.gdpr_consent}
                onChange={handleChange}
                required
              />
              Accetto il trattamento dei dati personali secondo il GDPR
            </label>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="marketing_consent"
                checked={formData.marketing_consent}
                onChange={handleChange}
              />
              Acconsento a ricevere comunicazioni promozionali via email
            </label>
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary btn-block">
            {loading ? 'Registrazione in corso...' : 'Registrati'}
          </button>
        </form>
        <div className="modal-footer">
          <p>
            Hai già un account?{' '}
            <button className="link-button" onClick={onSwitchToLogin}>
              Accedi qui
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

// Payment Modal Component
const PaymentModal = ({ isOpen, onClose, coursePackage, amount, userEmail }) => {
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const handlePaymentSuccess = (result) => {
    setPaymentSuccess(true);
    setPaymentError('');
    setTimeout(() => {
      onClose();
      window.location.reload(); // Refresh to update user status
    }, 3000);
  };

  const handlePaymentError = (error) => {
    setPaymentError(error);
    setPaymentSuccess(false);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Completa il pagamento</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="payment-content">
          {paymentSuccess ? (
            <div className="payment-success">
              <h3>🎉 Pagamento completato!</h3>
              <p>Benvenuto nel corso premium! La pagina si aggiornerà automaticamente.</p>
            </div>
          ) : (
            <>
              <div className="payment-details">
                <h3>Dettagli Acquisto</h3>
                <p><strong>Corso:</strong> {coursePackage === 'corso_completo' ? 'Corso Completo' : coursePackage}</p>
                <p><strong>Prezzo:</strong> €{amount}</p>
              </div>
              
              {paymentError && (
                <div className="error-message">{paymentError}</div>
              )}
              
              <PayPalCheckout
                coursePackage={coursePackage}
                userEmail={userEmail}
                amount={amount}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Booking Modal Component
const BookingModal = ({ isOpen, onClose, userEmail }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Prenota la tua Video Lezione Gratuita</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <BookingCalendar 
            userEmail={userEmail} 
            onBookingSuccess={() => {
              alert('Prenotazione effettuata con successo!');
            }}
          />
        </div>
      </div>
    </div>
  );
};

// Admin Modal Component
const AdminModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content extra-large-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Pannello Amministratore</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <AdminPanel />
        </div>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const { user } = useAuth();

  const handleSwitchToRegister = () => {
    setShowLoginModal(false);
    setShowRegisterModal(true);
  };

  const handleSwitchToLogin = () => {
    setShowRegisterModal(false);
    setShowLoginModal(true);
  };

  const handleShowPayment = (coursePackage, amount) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    setPaymentData({ coursePackage, amount, userEmail: user.email });
    setShowPaymentModal(true);
  };

  const handleShowBooking = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    setShowBookingModal(true);
  };

  const handleShowAdmin = () => {
    setShowAdminModal(true);
  };

  return (
    <AuthProvider>
      <div className="App">
        <Header 
          onShowLogin={() => setShowLoginModal(true)}
          onShowRegister={() => setShowRegisterModal(true)}
          onShowAdmin={handleShowAdmin}
        />
        <main>
          <HeroSection 
            onShowRegister={() => setShowRegisterModal(true)}
            onShowFreeCourse={handleShowBooking}
          />
          <CourseSections 
            onShowPayment={handleShowPayment}
            onShowBooking={handleShowBooking}
          />
          <StatsSection />
        </main>
        
        <footer className="footer">
          <div className="container">
            <div className="footer-content">
              <div className="footer-section">
                <h3>Forex Master Course</h3>
                <p>La tua guida definitiva al trading forex professionale.</p>
                <div className="app-install">
                  <p><strong>📱 Installa l'App:</strong></p>
                  <p>Su mobile: tocca il menu del browser e seleziona "Aggiungi alla schermata Home"</p>
                </div>
              </div>
              <div className="footer-section">
                <h4>Sezioni</h4>
                <ul>
                  <li><a href="#apprendimento">Apprendimento Gratuito</a></li>
                  <li><a href="#corso-completo">Corso Completo</a></li>
                  <li><a href="#contenuti-extra">Contenuti Extra</a></li>
                </ul>
              </div>
              <div className="footer-section">
                <h4>Supporto</h4>
                <ul>
                  <li><a href="#faq">FAQ</a></li>
                  <li><a href="#contatti">Contatti</a></li>
                  <li><a href="#privacy">Privacy Policy</a></li>
                </ul>
              </div>
            </div>
            <div className="footer-bottom">
              <p>&copy; 2024 Forex Master Course. Tutti i diritti riservati.</p>
            </div>
          </div>
        </footer>

        <LoginModal 
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onSwitchToRegister={handleSwitchToRegister}
        />

        <RegisterModal 
          isOpen={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
          onSwitchToLogin={handleSwitchToLogin}
        />

        {paymentData && (
          <PaymentModal 
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            coursePackage={paymentData.coursePackage}
            amount={paymentData.amount}
            userEmail={paymentData.userEmail}
          />
        )}

        <BookingModal 
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          userEmail={user?.email}
        />

        {user?.is_admin && (
          <AdminModal 
            isOpen={showAdminModal}
            onClose={() => setShowAdminModal(false)}
          />
        )}
      </div>
    </AuthProvider>
  );
};

export default App;