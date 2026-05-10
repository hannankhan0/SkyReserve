const PDFDocument = require('pdfkit');

const formatDate = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  return isNaN(date.getTime()) ? String(value) : date.toDateString();
};

const formatDateTime = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  return isNaN(date.getTime()) ? String(value) : date.toLocaleString();
};

const generateTicketPDF = (ticketData, res) => {
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=ticket-${ticketData.ticket_number}.pdf`
  );

  doc.pipe(res);

  doc.fontSize(20).text('SkyReserve E-Ticket', { align: 'center' });
  doc.moveDown();

  doc.fontSize(12).text(`Ticket Number: ${ticketData.ticket_number}`);
  doc.text(`Passenger Name: ${ticketData.passenger_name}`);
  doc.text(`Booking Reference: ${ticketData.booking_reference}`);
  doc.text(`Flight Number: ${ticketData.flight_number}`);
  doc.text(`Airline: ${ticketData.airline_name}`);
  doc.text(`From: ${ticketData.departure_city}`);
  doc.text(`To: ${ticketData.destination_city}`);
  doc.text(`Aircraft Type: ${ticketData.aircraft_type || 'N/A'}`);
  doc.text(`Manufacturer: ${ticketData.manufacturer || 'N/A'}`);
  doc.text(`Model: ${ticketData.model || 'N/A'}`);
  doc.text(`Flight Date: ${formatDate(ticketData.flight_date)}`);
  doc.text(`Departure Time: ${formatDateTime(ticketData.departure_time)}`);
  doc.text(`Arrival Time: ${formatDateTime(ticketData.arrival_time)}`);
  doc.text(`Seat Number: ${ticketData.seat_number || 'Not Assigned'}`);
  doc.text(`Seat Class: ${ticketData.seat_class || 'N/A'}`);
  doc.text(`Ticket Status: ${ticketData.ticket_status}`);
  doc.text(`Issued At: ${formatDateTime(ticketData.issued_at)}`);
  doc.moveDown();

  doc.text('Thank you for choosing SkyReserve.', { align: 'center' });

  doc.end();
};

module.exports = { generateTicketPDF };