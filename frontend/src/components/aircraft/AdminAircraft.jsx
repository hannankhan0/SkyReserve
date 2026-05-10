import React, { useCallback, useEffect, useState } from 'react';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';

const emptyAircraft = {
  aircraft_type: '',
  manufacturer: '',
  model: '',
  total_seats: 6,
  economy_seats: 4,
  business_seats: 2,
  first_class_seats: 0,
};

const formatPKR = (value) => `Rs ${Number(value || 0).toLocaleString('en-PK')}`;

const AdminAircraft = () => {
  const { toast } = useApp();
  const [aircraft, setAircraft] = useState([]);
  const [form, setForm] = useState(emptyAircraft);
  const [editId, setEditId] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadAircraft = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/aircraft');
      setAircraft(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load aircraft.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadStats = async () => {
    try {
      const res = await api.get('/aircraft/stats');
      setStats(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load aircraft stats.');
    }
  };

  useEffect(() => { loadAircraft(); }, [loadAircraft]);

  const updateField = (e) => {
    const { name, value } = e.target;
    const numeric = ['total_seats', 'economy_seats', 'business_seats', 'first_class_seats'];
    setForm((prev) => ({ ...prev, [name]: numeric.includes(name) ? Number(value) : value }));
  };

  const resetForm = () => {
    setForm(emptyAircraft);
    setEditId(null);
  };

  const submit = async (e) => {
    e.preventDefault();

    if (Number(form.total_seats) !== Number(form.economy_seats) + Number(form.business_seats) + Number(form.first_class_seats)) {
      toast.error('Total seats must equal Economy + Business + First Class seats.');
      return;
    }

    try {
      if (editId) {
        await api.put(`/aircraft/${editId}`, form);
        toast.success('Aircraft updated successfully.');
      } else {
        await api.post('/aircraft', form);
        toast.success('Aircraft added successfully.');
      }
      resetForm();
      loadAircraft();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Aircraft save failed.');
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
      toast.success('Aircraft deleted.');
      loadAircraft();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed.');
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

      {stats && (
        <div className="stat-card-grid aircraft-stats-grid">
          {stats.map((item) => (
            <div className="admin-stat-card" key={item.aircraft_id}>
              <span className="stat-icon">AC</span>
              <strong>{item.total_scheduled_flights || 0}</strong>
              <span>{item.aircraft_type} scheduled flights</span>
              <em>↑ {Number(item.avg_occupancy_rate || 0).toFixed(1)}% occupancy</em>
              <small>{formatPKR(item.total_revenue)} revenue</small>
            </div>
          ))}
          {!stats.length && <div className="empty-state">No aircraft stats available yet.</div>}
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
