import React, { useEffect, useState } from 'react';
import api from '../../services/api';

const emptyAircraft = {
  aircraft_type: '',
  manufacturer: '',
  model: '',
  total_seats: 6,
  economy_seats: 4,
  business_seats: 2,
  first_class_seats: 0,
};

const AdminAircraft = () => {
  const [aircraft, setAircraft] = useState([]);
  const [form, setForm] = useState(emptyAircraft);
  const [editId, setEditId] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadAircraft = async () => {
    setLoading(true);
    try {
      const res = await api.get('/aircraft');
      setAircraft(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load aircraft.');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await api.get('/aircraft/stats');
      setStats(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load aircraft stats.');
    }
  };

  useEffect(() => { loadAircraft(); }, []);

  const updateField = (e) => {
    const { name, value } = e.target;
    const numeric = ['total_seats', 'economy_seats', 'business_seats', 'first_class_seats'];
    setForm((prev) => ({ ...prev, [name]: numeric.includes(name) ? Number(value) : value }));
  };

  const resetForm = () => {
    setForm(emptyAircraft);
    setEditId(null);
    setError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (Number(form.total_seats) !== Number(form.economy_seats) + Number(form.business_seats) + Number(form.first_class_seats)) {
      setError('Total seats must equal Economy + Business + First Class seats.');
      return;
    }

    try {
      if (editId) {
        await api.put(`/aircraft/${editId}`, form);
        setMessage('Aircraft updated successfully.');
      } else {
        await api.post('/aircraft', form);
        setMessage('Aircraft added successfully.');
      }
      resetForm();
      loadAircraft();
    } catch (err) {
      setError(err.response?.data?.message || 'Aircraft save failed.');
    }
  };

  const edit = (item) => {
    setEditId(item.aircraft_id);
    setForm({
      aircraft_type: item.aircraft_type || '',
      manufacturer: item.manufacturer || '',
      model: item.model || '',
      total_seats: item.total_seats || 0,
      economy_seats: item.economy_seats || 0,
      business_seats: item.business_seats || 0,
      first_class_seats: item.first_class_seats || 0,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this aircraft? It cannot be deleted if flights already use it.')) return;
    try {
      await api.delete(`/aircraft/${id}`);
      setMessage('Aircraft deleted.');
      loadAircraft();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed.');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Aircraft Management</h1>
          <p>Ahad module: add aircraft before Sadeem creates flights.</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={loadStats}>📊 Stats</button>
          <button className="btn-secondary" onClick={loadAircraft}>Refresh</button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {stats && (
        <div className="card">
          <h3>Aircraft Utilization Stats</h3>
          <pre className="json-box">{JSON.stringify(stats, null, 2)}</pre>
        </div>
      )}

      <div className="card form-card wide-form">
        <h3>{editId ? 'Edit Aircraft' : 'Add Aircraft'}</h3>
        <form onSubmit={submit}>
          <div className="form-row">
            <div className="form-group"><label>Aircraft Type *</label><input name="aircraft_type" value={form.aircraft_type} onChange={updateField} placeholder="Boeing 737 Test" required /></div>
            <div className="form-group"><label>Manufacturer *</label><input name="manufacturer" value={form.manufacturer} onChange={updateField} placeholder="Boeing" required /></div>
            <div className="form-group"><label>Model *</label><input name="model" value={form.model} onChange={updateField} placeholder="737" required /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Total Seats</label><input type="number" name="total_seats" value={form.total_seats} onChange={updateField} required /></div>
            <div className="form-group"><label>Economy</label><input type="number" name="economy_seats" value={form.economy_seats} onChange={updateField} required /></div>
            <div className="form-group"><label>Business</label><input type="number" name="business_seats" value={form.business_seats} onChange={updateField} required /></div>
            <div className="form-group"><label>First Class</label><input type="number" name="first_class_seats" value={form.first_class_seats} onChange={updateField} required /></div>
          </div>
          <div className="form-actions">
            <button className="btn-primary" type="submit">{editId ? 'Update Aircraft' : 'Add Aircraft'}</button>
            {editId && <button type="button" className="btn-secondary" onClick={resetForm}>Cancel Edit</button>}
          </div>
        </form>
      </div>

      {loading ? <div className="loading">Loading aircraft...</div> : (
        <div className="table-card">
          <table className="data-table">
            <thead><tr><th>ID</th><th>Type</th><th>Manufacturer</th><th>Model</th><th>Seats</th><th>Actions</th></tr></thead>
            <tbody>
              {aircraft.map((a) => (
                <tr key={a.aircraft_id}>
                  <td>{a.aircraft_id}</td><td>{a.aircraft_type}</td><td>{a.manufacturer}</td><td>{a.model}</td>
                  <td>{a.total_seats} (E:{a.economy_seats}, B:{a.business_seats}, F:{a.first_class_seats})</td>
                  <td className="table-actions"><button className="btn-edit" onClick={() => edit(a)}>Edit</button><button className="btn-delete" onClick={() => remove(a.aircraft_id)}>Delete</button></td>
                </tr>
              ))}
              {!aircraft.length && <tr><td colSpan="6">No aircraft found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminAircraft;
