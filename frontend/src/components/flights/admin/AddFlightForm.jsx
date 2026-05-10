import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useApp } from '../../../context/AppContext';

const AddFlightForm = ({ onSuccess, onCancel, editFlight }) => {
  const { toast } = useApp();
  const [formData, setFormData] = useState({
    flight_number:       '',
    airline_name:        '',
    departure_city_id:   '',
    destination_city_id: '',
    aircraft_id:         '',
    base_price:          '',
  });
  const [aircraft, setAircraft] = useState([]);
  const [cities,   setCities]   = useState([]);
  const [loading,  setLoading]  = useState(false);

  const isEdit = !!editFlight;

  // Populate form when editing
  useEffect(() => {
    if (editFlight) {
      setFormData({
        flight_number:       editFlight.flight_number       || '',
        airline_name:        editFlight.airline_name        || '',
        departure_city_id:   editFlight.departure_city_id   || '',
        destination_city_id: editFlight.destination_city_id || '',
        aircraft_id:         editFlight.aircraft_id         || '',
        base_price:          editFlight.base_price          || '',
      });
    }
  }, [editFlight]);

  // Fetch aircraft list
  useEffect(() => {
    const fetchAircraft = async () => {
      try {
        const res = await api.get('/aircraft');
        setAircraft(res.data.data || []);
      } catch {
        setAircraft([]);
      }
    };
    fetchAircraft();
  }, []);

  // Fetch cities list from normalized Cities table
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await api.get('/cities');
        setCities(res.data.data || []);
      } catch {
        setCities([]);
      }
    };
    fetchCities();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        departure_city_id:   formData.departure_city_id   ? parseInt(formData.departure_city_id)   : undefined,
        destination_city_id: formData.destination_city_id ? parseInt(formData.destination_city_id) : undefined,
        aircraft_id:         formData.aircraft_id         ? parseInt(formData.aircraft_id)         : undefined,
        base_price:          parseFloat(formData.base_price),
      };

      if (isEdit) {
        await api.put(`/flights/${editFlight.flight_id}`, payload);
      } else {
        await api.post('/flights', payload);
      }
      onSuccess();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0] ||
        'Operation failed.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>{isEdit ? 'Edit Flight' : 'Add New Flight'}</h2>
          <button className="modal-close" onClick={onCancel}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Flight Number *</label>
              <input
                type="text"
                name="flight_number"
                value={formData.flight_number}
                onChange={handleChange}
                placeholder="PK-301"
                required
                disabled={isEdit}
              />
            </div>
            <div className="form-group">
              <label>Airline Name *</label>
              <input
                type="text"
                name="airline_name"
                value={formData.airline_name}
                onChange={handleChange}
                placeholder="PIA"
                required
              />
            </div>
          </div>

          <div className="form-row">
            {/* Departure City — dropdown from Cities table */}
            <div className="form-group">
              <label>Departure City *</label>
              {cities.length > 0 ? (
                <select
                  name="departure_city_id"
                  value={formData.departure_city_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Select Departure City --</option>
                  {cities.map((c) => (
                    <option key={c.city_id} value={c.city_id}>
                      {c.city_name}{c.iata_code ? ` (${c.iata_code})` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  name="departure_city_id"
                  value={formData.departure_city_id}
                  onChange={handleChange}
                  placeholder="City ID (enter manually)"
                  required
                />
              )}
            </div>

            {/* Destination City — dropdown from Cities table */}
            <div className="form-group">
              <label>Destination City *</label>
              {cities.length > 0 ? (
                <select
                  name="destination_city_id"
                  value={formData.destination_city_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Select Destination City --</option>
                  {cities
                    .filter((c) => c.city_id !== parseInt(formData.departure_city_id))
                    .map((c) => (
                      <option key={c.city_id} value={c.city_id}>
                        {c.city_name}{c.iata_code ? ` (${c.iata_code})` : ''}
                      </option>
                    ))}
                </select>
              ) : (
                <input
                  type="number"
                  name="destination_city_id"
                  value={formData.destination_city_id}
                  onChange={handleChange}
                  placeholder="City ID (enter manually)"
                  required
                />
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Aircraft</label>
              {aircraft.length > 0 ? (
                <select name="aircraft_id" value={formData.aircraft_id} onChange={handleChange}>
                  <option value="">-- Select Aircraft --</option>
                  {aircraft.map((a) => (
                    <option key={a.aircraft_id} value={a.aircraft_id}>
                      {a.aircraft_type} (ID: {a.aircraft_id}) — {a.total_seats} seats
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  name="aircraft_id"
                  value={formData.aircraft_id}
                  onChange={handleChange}
                  placeholder="Aircraft ID (enter manually)"
                />
              )}
            </div>
            <div className="form-group">
              <label>Base Price (PKR) *</label>
              <input
                type="number"
                name="base_price"
                value={formData.base_price}
                onChange={handleChange}
                placeholder="25000"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update Flight' : 'Add Flight'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFlightForm;
