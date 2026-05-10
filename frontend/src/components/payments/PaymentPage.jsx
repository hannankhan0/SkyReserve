import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';

const formatCardNumber = (value) => value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
const formatExpiry = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
};
const maskCardNumber = (value) => value || '4444 4444 4444 4444';

const PaymentPage = () => {
  const { bookingId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { toast } = useApp();
  const [booking, setBooking] = useState(state?.booking || null);
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [amount, setAmount] = useState(state?.totalAmount || state?.booking?.total_amount || '');
  const [cardDetails, setCardDetails] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [bankAccount, setBankAccount] = useState('');
  const [cvvFocused, setCvvFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(!state?.booking);

  useEffect(() => {
    const loadBooking = async () => {
      if (booking) return;
      try {
        const res = await api.get(`/bookings/${bookingId}`);
        setBooking(res.data.data);
        setAmount(res.data.data?.total_amount || '');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load booking.');
      } finally {
        setPageLoading(false);
      }
    };
    loadBooking();
  }, [booking, bookingId, toast]);

  const pay = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/payments', {
        booking_id: Number(bookingId),
        payment_method: paymentMethod,
        payment_amount: Number(amount),
      });
      toast.success('Payment completed. Booking confirmed and ticket is ready.');
      setTimeout(() => navigate('/bookings/confirmation', { state: { booking: { ...booking, booking_status: 'confirmed' } } }), 700);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed. Amount must match booking total.');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) return <div className="loading">Loading booking...</div>;

  const isCard = paymentMethod === 'credit_card' || paymentMethod === 'debit_card';

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Process Payment</h1>
          <p>Payment confirms booking and enables ticket download.</p>
        </div>
      </div>

      <div className="card summary-card">
        <h3>Booking #{bookingId}</h3>
        <p><strong>Status:</strong> {booking?.booking_status || 'pending'} | <strong>Total:</strong> Rs {Number(booking?.total_amount || amount || 0).toLocaleString()}</p>
        <p>{booking?.flight_number} {booking?.departure_city} to {booking?.destination_city}</p>
      </div>

      <div className="payment-layout">
        <div className="card form-card">
          <form onSubmit={pay}>
            <div className="form-group">
              <label>Payment Method</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
              </select>
            </div>

            {isCard && (
              <div className="payment-method-panel">
                <div className="form-group">
                  <label>Card Number</label>
                  <input inputMode="numeric" autoComplete="cc-number" value={cardDetails.number} onChange={(e) => setCardDetails((prev) => ({ ...prev, number: formatCardNumber(e.target.value) }))} placeholder="4444 4444 4444 4444" required />
                </div>
                <div className="form-group">
                  <label>Name on Card</label>
                  <input autoComplete="cc-name" value={cardDetails.name} onChange={(e) => setCardDetails((prev) => ({ ...prev, name: e.target.value }))} placeholder="Passenger name" required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Expiry</label>
                    <input inputMode="numeric" autoComplete="cc-exp" value={cardDetails.expiry} onChange={(e) => setCardDetails((prev) => ({ ...prev, expiry: formatExpiry(e.target.value) }))} placeholder="MM/YY" maxLength="5" required />
                  </div>
                  <div className="form-group">
                    <label>CVV</label>
                    <input type="password" inputMode="numeric" autoComplete="cc-csc" value={cardDetails.cvv} onFocus={() => setCvvFocused(true)} onBlur={() => setCvvFocused(false)} onChange={(e) => setCardDetails((prev) => ({ ...prev, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))} placeholder="123" maxLength="4" required />
                  </div>
                </div>
                <p className="muted-small">Demo only: card details are validated here and are not sent to the backend.</p>
              </div>
            )}

            {paymentMethod === 'bank_transfer' && (
              <div className="payment-method-panel">
                <div className="form-group">
                  <label>Account Number</label>
                  <input inputMode="numeric" value={bankAccount} onChange={(e) => setBankAccount(e.target.value.replace(/\D/g, '').slice(0, 24))} placeholder="Enter bank account number" required />
                </div>
                <p className="muted-small">Demo only: account details stay in this browser session.</p>
              </div>
            )}

            {paymentMethod === 'cash' && <div className="cash-note">Cash payment needs no extra details for this demo.</div>}

            <div className="form-group">
              <label>Payment Amount (PKR)</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <button className="btn-primary" disabled={loading}>{loading ? 'Processing...' : 'Pay & Confirm Booking'}</button>
          </form>
        </div>

        {isCard && (
          <div className={`mini-card-preview ${cvvFocused ? 'is-flipped' : ''}`}>
            <div className="mini-card-face mini-card-front">
              <div className="mini-card-chip"></div>
              <div className="mini-card-number">{maskCardNumber(cardDetails.number)}</div>
              <div className="mini-card-meta"><span>{cardDetails.name || 'CARD HOLDER'}</span><span>{cardDetails.expiry || 'MM/YY'}</span></div>
            </div>
            <div className="mini-card-face mini-card-back">
              <div className="mini-card-strip"></div>
              <div className="mini-card-cvv">{cardDetails.cvv || 'CVV'}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentPage;
