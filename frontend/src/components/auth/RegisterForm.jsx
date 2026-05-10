import React, { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';

const strengthRules = [
  { test: (value) => value.length >= 8, label: '8+ chars' },
  { test: (value) => /[A-Z]/.test(value), label: 'uppercase' },
  { test: (value) => /\d/.test(value), label: 'number' },
  { test: (value) => /[^A-Za-z0-9]/.test(value), label: 'symbol' },
];

const RegisterForm = () => {
  const navigate = useNavigate();
  const { toast } = useApp();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: '',
    phone_number: '',
    date_of_birth: '',
    passport_number: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => strengthRules.filter((rule) => rule.test(formData.password)).length, [formData.password]);
  const strengthLabel = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'][strength] || 'Very weak';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (formData.first_name.trim().length < 2 || formData.last_name.trim().length < 2) return 'Enter your first and last name.';
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) return 'Enter a valid email address.';
    if (formData.password.length < 6) return 'Password must be at least 6 characters.';
    if (strength < 2) return 'Use a stronger password with a mix of characters.';
    if (formData.password !== formData.confirm_password) return 'Passwords do not match.';
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
      const { confirm_password, ...payload } = formData;
      await api.post('/auth/register', payload);
      toast.success('Account created! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.errors?.[0] || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className={`auth-card ${loading ? 'auth-busy' : ''}`}>
        {loading && <div className="auth-submit-skeleton"><span></span><span></span><span></span></div>}
        <div className="auth-logo">SkyReserve</div>
        <h2>Create Account</h2>
        <p className="auth-subtitle">Join SkyReserve to book flights</p>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            <div className="form-group"><label>First Name</label><input type="text" name="first_name" value={formData.first_name} onChange={handleChange} placeholder="Sadeem" required /></div>
            <div className="form-group"><label>Last Name</label><input type="text" name="last_name" value={formData.last_name} onChange={handleChange} placeholder="Arshad" required /></div>
          </div>
          <div className="form-group"><label>Email</label><input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="sadeem@email.com" required /></div>
          <div className="form-group">
            <label>Password</label>
            <div className="password-field"><input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} placeholder="Min. 6 characters" required /><button type="button" onClick={() => setShowPassword((v) => !v)}>{showPassword ? 'Hide' : 'Show'}</button></div>
            <div className={`password-strength strength-${strength}`}><span style={{ width: `${(strength / 4) * 100}%` }}></span></div>
            <div className="strength-copy">{strengthLabel}: {strengthRules.map((rule) => <span key={rule.label} className={rule.test(formData.password) ? 'met' : ''}>{rule.label}</span>)}</div>
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <div className="password-field"><input type={showConfirm ? 'text' : 'password'} name="confirm_password" value={formData.confirm_password} onChange={handleChange} placeholder="Repeat password" required /><button type="button" onClick={() => setShowConfirm((v) => !v)}>{showConfirm ? 'Hide' : 'Show'}</button></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Phone</label><input type="text" name="phone_number" value={formData.phone_number} onChange={handleChange} placeholder="+923001234567" /></div>
            <div className="form-group"><label>Date of Birth</label><input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} /></div>
          </div>
          <div className="form-group"><label>Passport Number</label><input type="text" name="passport_number" value={formData.passport_number} onChange={handleChange} placeholder="AB1234567" /></div>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Creating Account...' : 'Register'}</button>
        </form>
        <p className="auth-link">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
};

export default RegisterForm;
