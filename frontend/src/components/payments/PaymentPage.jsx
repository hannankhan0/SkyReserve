import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';

const PaymentPage = () => {
  const { bookingId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(state?.booking || null);
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [amount, setAmount] = useState(state?.totalAmount || state?.booking?.total_amount || '');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(!state?.booking);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadBooking = async () => {
      if (booking) return;
      try {
        const res = await api.get(`/bookings/${bookingId}`);
        setBooking(res.data.data);
        setAmount(res.data.data?.total_amount || '');
      } catch (err) { setError(err.response?.data?.message || 'Failed to load booking.'); }
      finally { setPageLoading(false); }
    };
    loadBooking();
  }, [booking, bookingId]);

  const pay = async (e) => {
    e.preventDefault(); setError(''); setSuccess(''); setLoading(true);
    try {
      await api.post('/payments', { booking_id: Number(bookingId), payment_method: paymentMethod, payment_amount: Number(amount) });
      setSuccess('Payment completed. Booking confirmed and ticket is ready.');
      setTimeout(() => navigate('/tickets/my'), 900);
    } catch (err) { setError(err.response?.data?.message || 'Payment failed. Amount must match booking total.'); }
    finally { setLoading(false); }
  };

  if (pageLoading) return <div className="loading">Loading booking...</div>;

  return <div className="page-container"><div className="page-header"><div><h1>Process Payment</h1><p>Payment confirms booking and enables ticket download.</p></div></div>{error && <div className="alert alert-error">{error}</div>}{success && <div className="alert alert-success">{success}</div>}<div className="card summary-card"><h3>Booking #{bookingId}</h3><p><strong>Status:</strong> {booking?.booking_status || 'pending'} | <strong>Total:</strong> Rs {Number(booking?.total_amount || amount || 0).toLocaleString()}</p><p>{booking?.flight_number} {booking?.departure_city} → {booking?.destination_city}</p></div><div className="card form-card"><form onSubmit={pay}><div className="form-group"><label>Payment Method</label><select value={paymentMethod} onChange={(e)=>setPaymentMethod(e.target.value)}><option value="credit_card">Credit Card</option><option value="debit_card">Debit Card</option><option value="bank_transfer">Bank Transfer</option><option value="cash">Cash</option></select></div><div className="form-group"><label>Payment Amount (PKR)</label><input type="number" value={amount} onChange={(e)=>setAmount(e.target.value)} required /></div><button className="btn-primary" disabled={loading}>{loading ? 'Processing...' : 'Pay & Confirm Booking'}</button></form></div></div>;
};
export default PaymentPage;
