import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import api from '../../services/api';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { loginAdmin } = useApp();

  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Backend expects password_hash field
      const payload = { username: formData.username, password_hash: formData.password };
      const res = await api.post('/auth/admin-login', payload);
      const { token, admin, data } = res.data;
      loginAdmin(admin || data, token);
      navigate('/admin/flights');
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid admin credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card admin-card">
        <div className="auth-logo">✈ SkyReserve</div>
        <div className="admin-badge">ADMIN PORTAL</div>
        <h2>Admin Sign In</h2>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="admin"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Admin password"
              required
            />
          </div>

          <button type="submit" className="btn-primary btn-admin" disabled={loading}>
            {loading ? 'Signing in...' : 'Admin Sign In'}
          </button>
        </form>

        <p className="auth-link">
          <Link to="/login">← Back to User Login</Link>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
