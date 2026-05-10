import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import api from '../../services/api';

const LoginForm = () => {
  const navigate = useNavigate();
  const { loginUser, toast } = useApp();
  const [formData, setFormData] = useState({ email: '', password: '', remember: true });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const validate = () => {
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) return 'Enter a valid email address.';
    if (!formData.password) return 'Enter your password.';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email: formData.email, password: formData.password });
      const { token, user, data } = res.data;
      loginUser(user || data, token, formData.remember);
      navigate('/flights');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className={`auth-card ${loading ? 'auth-busy' : ''}`}>
        {loading && <div className="auth-submit-skeleton"><span></span><span></span><span></span></div>}
        <div className="auth-logo">SkyReserve</div>
        <h2>Welcome Back</h2>
        <p className="auth-subtitle">Sign in to continue</p>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group"><label>Email</label><input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="sadeem@email.com" required /></div>
          <div className="form-group">
            <label>Password</label>
            <div className="password-field"><input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} placeholder="Your password" required /><button type="button" onClick={() => setShowPassword((v) => !v)}>{showPassword ? 'Hide' : 'Show'}</button></div>
          </div>
          <label className="checkbox-row"><input type="checkbox" name="remember" checked={formData.remember} onChange={handleChange} /> Remember me</label>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
        </form>
        <p className="auth-link">No account? <Link to="/register">Register</Link></p>
        <p className="auth-link">Admin? <Link to="/admin-login">Admin Login</Link></p>
      </div>
    </div>
  );
};

export default LoginForm;
