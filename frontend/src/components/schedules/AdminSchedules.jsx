import React, { useEffect, useState } from 'react';
import api from '../../services/api';

const statusOptions = ['on_time', 'delayed', 'cancelled', 'boarding'];

const emptyForm = {
  flight_id: '',
  flight_date: '',
  departure_time: '',
  arrival_time: '',
  status: 'on_time',
  gate_number: '',
};

const toDateInput = (value) => value ? String(value).split('T')[0] : '';
const toDateTimeLocal = (value) => {
  if (!value) return '';
  const d = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const AdminSchedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [flights, setFlights] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [schedRes, flightRes] = await Promise.all([api.get('/schedules'), api.get('/flights')]);
      setSchedules(schedRes.data.data || []);
      setFlights(flightRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load schedules.');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const change = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const reset = () => { setForm(emptyForm); setEditId(null); setError(''); };

  const submit = async (e) => {
    e.preventDefault(); setError(''); setMessage('');
    try {
      const payload = {
        ...form,
        flight_id: form.flight_id ? Number(form.flight_id) : undefined,
        gate_number: form.gate_number || null,
      };
      if (editId) {
        delete payload.flight_id;
        await api.put(`/schedules/${editId}`, payload);
        setMessage('Schedule updated.');
      } else {
        await api.post('/schedules', payload);
        setMessage('Schedule created and seats generated.');
      }
      reset(); load();
    } catch (err) {
      setError(err.response?.data?.message || 'Schedule save failed. Use full valid date/time and allowed status.');
    }
  };

  const edit = (s) => {
    setEditId(s.schedule_id);
    setForm({
      flight_id: s.flight_id || '',
      flight_date: toDateInput(s.flight_date),
      departure_time: toDateTimeLocal(s.departure_time),
      arrival_time: toDateTimeLocal(s.arrival_time),
      status: s.status || 'on_time',
      gate_number: s.gate_number || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this schedule?')) return;
    try { await api.delete(`/schedules/${id}`); setMessage('Schedule deleted.'); load(); }
    catch (err) { setError(err.response?.data?.message || 'Delete failed.'); }
  };

  return (
    <div className="page-container">
      <div className="page-header"><div><h1>Schedule Management</h1><p>Ahad module: connect flights with dates, gates, and seats.</p></div><button className="btn-secondary" onClick={load}>Refresh</button></div>
      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <div className="card form-card wide-form">
        <h3>{editId ? 'Edit Schedule' : 'Create Schedule'}</h3>
        <form onSubmit={submit}>
          {!editId && <div className="form-group"><label>Flight</label><select name="flight_id" value={form.flight_id} onChange={change} required><option value="">Select flight</option>{flights.map(f => <option key={f.flight_id} value={f.flight_id}>{f.flight_number} — {f.departure_city} to {f.destination_city}</option>)}</select></div>}
          <div className="form-row">
            <div className="form-group"><label>Flight Date</label><input type="date" name="flight_date" value={form.flight_date} onChange={change} required /></div>
            <div className="form-group"><label>Status</label><select name="status" value={form.status} onChange={change}>{statusOptions.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div className="form-group"><label>Gate</label><input name="gate_number" value={form.gate_number} onChange={change} placeholder="A1" /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Departure</label><input type="datetime-local" name="departure_time" value={form.departure_time} onChange={change} required /></div>
            <div className="form-group"><label>Arrival</label><input type="datetime-local" name="arrival_time" value={form.arrival_time} onChange={change} required /></div>
          </div>
          <div className="form-actions"><button className="btn-primary">{editId ? 'Update Schedule' : 'Create Schedule'}</button>{editId && <button type="button" className="btn-secondary" onClick={reset}>Cancel Edit</button>}</div>
        </form>
      </div>

      {loading ? <div className="loading">Loading schedules...</div> : <div className="table-card"><table className="data-table"><thead><tr><th>ID</th><th>Flight</th><th>Route</th><th>Date</th><th>Time</th><th>Status</th><th>Seats</th><th>Actions</th></tr></thead><tbody>{schedules.map(s => <tr key={s.schedule_id}><td>{s.schedule_id}</td><td>{s.flight_number}</td><td>{s.departure_city} → {s.destination_city}</td><td>{toDateInput(s.flight_date)}</td><td>{toDateTimeLocal(s.departure_time).replace('T',' ')} → {toDateTimeLocal(s.arrival_time).replace('T',' ')}</td><td><span className="badge">{s.status}</span></td><td>{s.available_seats}</td><td className="table-actions"><button className="btn-edit" onClick={() => edit(s)}>Edit</button><button className="btn-delete" onClick={() => remove(s.schedule_id)}>Delete</button></td></tr>)}{!schedules.length && <tr><td colSpan="8">No schedules found.</td></tr>}</tbody></table></div>}
    </div>
  );
};

export default AdminSchedules;
