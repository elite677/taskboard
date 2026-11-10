import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function AuthPage({ mode }) {
  const isLogin = mode === 'login';
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (isLogin) await login(form.email, form.password);
      else await register(form.name, form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth">
      <form className="auth-card" onSubmit={submit}>
        <h1>{isLogin ? 'Log in to your boards' : 'Create your account'}</h1>
        {!isLogin && (
          <label>Name<input value={form.name} onChange={set('name')} required maxLength={60} /></label>
        )}
        <label>Email<input type="email" value={form.email} onChange={set('email')} required /></label>
        <label>Password
          <input type="password" value={form.password} onChange={set('password')} required minLength={isLogin ? 1 : 8} />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn primary" disabled={busy}>{isLogin ? 'Log in' : 'Sign up'}</button>
        <p className="swap">
          {isLogin ? <>New here? <Link to="/register">Create an account</Link></> : <>Have an account? <Link to="/login">Log in</Link></>}
        </p>
      </form>
    </main>
  );
}
