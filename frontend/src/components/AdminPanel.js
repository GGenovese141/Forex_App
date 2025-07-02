import React, { useState, useEffect } from 'react';

const AdminPanel = () => {
    const [activeTab, setActiveTab] = useState('config');
    const [config, setConfig] = useState({
        paypal_configured: false,
        google_calendar_configured: false
    });
    const [paypalConfig, setPaypalConfig] = useState({
        client_id: '',
        client_secret: '',
        mode: 'sandbox'
    });
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchConfig();
        fetchBookings();
    }, []);

    const fetchConfig = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/config`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setConfig(data);
            }
        } catch (error) {
            console.error('Error fetching config:', error);
        }
    };

    const fetchBookings = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/bookings`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setBookings(data.bookings);
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
        }
    };

    const updatePayPalConfig = async () => {
        setLoading(true);
        setMessage('');
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/config`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    paypal_client_id: paypalConfig.client_id,
                    paypal_client_secret: paypalConfig.client_secret,
                    paypal_mode: paypalConfig.mode
                })
            });

            if (response.ok) {
                setMessage('Configurazione PayPal aggiornata con successo!');
                fetchConfig();
            } else {
                const error = await response.json();
                setMessage(`Errore: ${error.detail}`);
            }
        } catch (error) {
            setMessage('Errore durante l\'aggiornamento della configurazione');
        } finally {
            setLoading(false);
        }
    };

    const renderConfigTab = () => (
        <div className="admin-config">
            <h3>Configurazione Integrazioni</h3>
            
            <div className="config-status">
                <div className="status-item">
                    <span className="status-label">PayPal:</span>
                    <span className={`status-badge ${config.paypal_configured ? 'configured' : 'not-configured'}`}>
                        {config.paypal_configured ? '✅ Configurato' : '❌ Non Configurato'}
                    </span>
                </div>
                <div className="status-item">
                    <span className="status-label">Google Calendar:</span>
                    <span className={`status-badge ${config.google_calendar_configured ? 'configured' : 'not-configured'}`}>
                        {config.google_calendar_configured ? '✅ Configurato' : '❌ Non Configurato'}
                    </span>
                </div>
            </div>

            <div className="config-section">
                <h4>Configurazione PayPal</h4>
                <div className="form-group">
                    <label>Client ID PayPal</label>
                    <input
                        type="text"
                        value={paypalConfig.client_id}
                        onChange={(e) => setPaypalConfig({...paypalConfig, client_id: e.target.value})}
                        placeholder="Inserisci PayPal Client ID"
                        className="form-input"
                    />
                </div>
                
                <div className="form-group">
                    <label>Client Secret PayPal</label>
                    <input
                        type="password"
                        value={paypalConfig.client_secret}
                        onChange={(e) => setPaypalConfig({...paypalConfig, client_secret: e.target.value})}
                        placeholder="Inserisci PayPal Client Secret"
                        className="form-input"
                    />
                </div>
                
                <div className="form-group">
                    <label>Modalità</label>
                    <select
                        value={paypalConfig.mode}
                        onChange={(e) => setPaypalConfig({...paypalConfig, mode: e.target.value})}
                        className="form-input"
                    >
                        <option value="sandbox">Sandbox (Test)</option>
                        <option value="live">Live (Produzione)</option>
                    </select>
                </div>
                
                <button
                    onClick={updatePayPalConfig}
                    disabled={loading}
                    className="btn btn-primary"
                >
                    {loading ? 'Salvando...' : 'Salva Configurazione PayPal'}
                </button>
            </div>

            {message && (
                <div className={`message ${message.includes('successo') ? 'success' : 'error'}`}>
                    {message}
                </div>
            )}
        </div>
    );

    const renderBookingsTab = () => (
        <div className="admin-bookings">
            <h3>Gestione Prenotazioni</h3>
            
            <div className="bookings-stats">
                <div className="stat-card">
                    <span className="stat-number">{bookings.length}</span>
                    <span className="stat-label">Totale Prenotazioni</span>
                </div>
                <div className="stat-card">
                    <span className="stat-number">
                        {bookings.filter(b => b.status === 'pending').length}
                    </span>
                    <span className="stat-label">In Attesa</span>
                </div>
                <div className="stat-card">
                    <span className="stat-number">
                        {bookings.filter(b => b.status === 'confirmed').length}
                    </span>
                    <span className="stat-label">Confermate</span>
                </div>
            </div>

            <div className="bookings-table">
                {bookings.length === 0 ? (
                    <p>Nessuna prenotazione trovata.</p>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Email</th>
                                <th>Data</th>
                                <th>Orario</th>
                                <th>Note</th>
                                <th>Stato</th>
                                <th>Data Richiesta</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map((booking, index) => (
                                <tr key={booking.id || index}>
                                    <td>{booking.user_email}</td>
                                    <td>{booking.preferred_date}</td>
                                    <td>{booking.preferred_time}</td>
                                    <td>{booking.notes || '-'}</td>
                                    <td>
                                        <span className={`status-badge status-${booking.status}`}>
                                            {booking.status === 'pending' ? 'In attesa' :
                                             booking.status === 'confirmed' ? 'Confermata' :
                                             booking.status === 'cancelled' ? 'Cancellata' : booking.status}
                                        </span>
                                    </td>
                                    <td>{new Date(booking.created_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );

    return (
        <div className="admin-panel">
            <div className="admin-header">
                <h2>Pannello Amministratore</h2>
                <div className="admin-tabs">
                    <button
                        className={`tab-button ${activeTab === 'config' ? 'active' : ''}`}
                        onClick={() => setActiveTab('config')}
                    >
                        Configurazione
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'bookings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('bookings')}
                    >
                        Prenotazioni
                    </button>
                </div>
            </div>

            <div className="admin-content">
                {activeTab === 'config' ? renderConfigTab() : renderBookingsTab()}
            </div>
        </div>
    );
};

export default AdminPanel;