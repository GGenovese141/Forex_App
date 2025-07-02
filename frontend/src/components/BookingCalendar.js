import React, { useState, useEffect } from 'react';

const BookingCalendar = ({ userEmail, onBookingSuccess }) => {
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [notes, setNotes] = useState('');
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [myBookings, setMyBookings] = useState([]);

    // Available time slots (can be made dynamic via admin panel)
    const timeSlots = [
        '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'
    ];

    useEffect(() => {
        fetchMyBookings();
    }, []);

    const fetchMyBookings = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/bookings/my`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setMyBookings(data.bookings);
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
        }
    };

    const handleBooking = async (e) => {
        e.preventDefault();
        
        if (!selectedDate || !selectedTime) {
            alert('Seleziona data e orario per la prenotazione');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/bookings/request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_email: userEmail,
                    preferred_date: selectedDate,
                    preferred_time: selectedTime,
                    notes: notes
                })
            });

            if (response.ok) {
                const result = await response.json();
                onBookingSuccess && onBookingSuccess(result);
                fetchMyBookings(); // Refresh bookings
                setSelectedDate('');
                setSelectedTime('');
                setNotes('');
                alert('Prenotazione inviata con successo! Ti contatteremo presto.');
            } else {
                const error = await response.json();
                alert(`Errore: ${error.detail}`);
            }
        } catch (error) {
            alert('Errore durante la prenotazione. Riprova.');
        } finally {
            setLoading(false);
        }
    };

    const getMinDate = () => {
        const today = new Date();
        today.setDate(today.getDate() + 1); // Tomorrow
        return today.toISOString().split('T')[0];
    };

    const getMaxDate = () => {
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 30); // 30 days from now
        return maxDate.toISOString().split('T')[0];
    };

    return (
        <div className="booking-calendar">
            <div className="booking-form">
                <h3>Prenota la tua Video Lezione Gratuita</h3>
                <p className="booking-subtitle">Sessione di 50 minuti con il nostro esperto</p>
                
                <form onSubmit={handleBooking} className="calendar-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label>Data Preferita</label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                min={getMinDate()}
                                max={getMaxDate()}
                                className="form-input"
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Orario Preferito</label>
                            <select
                                value={selectedTime}
                                onChange={(e) => setSelectedTime(e.target.value)}
                                className="form-input"
                                required
                            >
                                <option value="">Seleziona orario</option>
                                {timeSlots.map(slot => (
                                    <option key={slot} value={slot}>
                                        {slot}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label>Note (opzionale)</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Argomenti specifici che vorresti discutere..."
                            className="form-input"
                            rows="3"
                        />
                    </div>
                    
                    <button type="submit" disabled={loading} className="btn btn-success btn-block">
                        {loading ? 'Prenotazione in corso...' : 'Prenota Video Lezione'}
                    </button>
                </form>
            </div>

            {myBookings.length > 0 && (
                <div className="my-bookings">
                    <h4>Le tue prenotazioni</h4>
                    <div className="bookings-list">
                        {myBookings.map((booking, index) => (
                            <div key={booking.id || index} className="booking-item">
                                <div className="booking-info">
                                    <span className="booking-date">
                                        📅 {booking.preferred_date} alle {booking.preferred_time}
                                    </span>
                                    <span className={`booking-status status-${booking.status}`}>
                                        {booking.status === 'pending' ? 'In attesa' : 
                                         booking.status === 'confirmed' ? 'Confermata' : 
                                         booking.status === 'cancelled' ? 'Cancellata' : booking.status}
                                    </span>
                                </div>
                                {booking.notes && (
                                    <p className="booking-notes">Note: {booking.notes}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingCalendar;