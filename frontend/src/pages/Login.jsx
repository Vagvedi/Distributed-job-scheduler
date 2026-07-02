import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../api/api';
import { FiMail, FiLock, FiCpu } from 'react-icons/fi';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginUser(email, password);
      navigate('/');
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Login failed. Please check your credentials and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="card auth-card glass-panel p-4 p-sm-5">
        <div className="d-flex justify-content-center align-items-center mb-3">
          <FiCpu className="text-primary me-2" size={36} />
          <h2 className="mb-0 fw-extrabold text-dark" style={{ letterSpacing: '-0.5px' }}>Scheduler IO</h2>
        </div>
        <p className="text-center text-muted mb-4">Log in to manage organizations, projects, and queues.</p>

        {error && (
          <div className="alert alert-danger rounded-3 py-2 px-3 small border-0" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label small fw-semibold text-secondary">Email Address</label>
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0 text-muted rounded-start-3">
                <FiMail />
              </span>
              <input
                type="email"
                className="form-control border-start-0 rounded-end-3 py-2"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label small fw-semibold text-secondary">Password</label>
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0 text-muted rounded-start-3">
                <FiLock />
              </span>
              <input
                type="password"
                className="form-control border-start-0 rounded-end-3 py-2"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary-custom w-100 py-2 d-flex align-items-center justify-content-center"
            disabled={loading}
          >
            {loading ? (
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            ) : null}
            <span>{loading ? 'Logging in...' : 'Log In'}</span>
          </button>
        </form>

        <div className="text-center mt-4">
          <span className="text-muted small">Don't have an account? </span>
          <Link to="/register" className="small text-primary fw-bold text-decoration-none">
            Register Here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
