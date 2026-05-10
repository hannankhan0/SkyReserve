import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import api from '../../services/api';

const UserProfile = () => {
  const { setUser, toast } = useApp();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number : '',
    date_of_birth: '',
    passport_number: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/auth/profile');
        const data = res.data.data;
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          phone_number : data.phone_number  || '',
          date_of_birth: data.date_of_birth ? data.date_of_birth.split('T')[0] : '',
          passport_number: data.passport_number || '',
        });
      } catch (err) {
        toast.error('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [toast]);

const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData((prev) => ({ ...prev, [name]: value }));
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await api.put('/auth/profile', formData);
      const updated = res.data.data;
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
      toast.success('Profile updated successfully!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Update failed.';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Loading profile...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>My Profile</h1>
        <p>Update your personal information</p>
      </div>

      <div className="card form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Phone</label>
              <input
                type="text"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Date of Birth</label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Passport Number</label>
            <input
              type="text"
              name="passport_number"
              value={formData.passport_number}
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserProfile;
