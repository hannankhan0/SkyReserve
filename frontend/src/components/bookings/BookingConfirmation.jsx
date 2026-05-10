import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';

const BookingConfirmation = () => {
  const { state } = useLocation();
  const { toast } = useApp();
  const booking = state?.booking;
  const [ticket, setTicket] = useState(null);

  useEffect(() => {
    const loadTicket = async () => {
      try {
        const res = await api.get('/tickets/my-tickets');
        const found = (res.data.data || []).find((item) => item.booking_reference === booking?.booking_reference);
        setTicket(found || null);
      } catch (err) {
        toast.error('Ticket lookup failed after payment.');
      }
    };
    if (booking?.booking_reference) loadTicket();
  }, [booking, toast]);

  const addToCalendar = () => {
    const title = encodeURIComponent(`SkyReserve ${booking?.flight_number || 'Flight'}`);
    const details = encodeURIComponent(`Booking ${booking?.booking_reference}`);
    window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`, '_blank', 'noopener,noreferrer');
  };

  const downloadPdf = async () => {
    if (!ticket) {
      toast.error('Ticket PDF is not ready yet.');
      return;
    }
    try {
      const res = await api.get(`/tickets/${ticket.ticket_id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ticket-${ticket.ticket_id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Ticket PDF downloaded.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Download failed.');
    }
  };

  return (
    <div className="page-container confirmation-page">
      <div className="confirmation-card">
        <div className="checkmark-animation">✓</div>
        <span className="muted-small">Booking confirmed</span>
        <h1>{booking?.booking_reference || 'Confirmed'}</h1>
        <p>{booking?.flight_number} | {booking?.departure_city} to {booking?.destination_city}</p>
        <div className="confirmation-actions"><button className="btn-secondary" onClick={addToCalendar}>Add to Calendar</button><button className="btn-primary compact" onClick={downloadPdf}>Download PDF</button><Link className="btn-link" to="/tickets/my">View Tickets</Link></div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
