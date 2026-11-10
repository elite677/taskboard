import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="navbar">
      <Link to="/" className="brand">Taskboard</Link>
      {user && (
        <div className="nav-right">
          <span>{user.name}</span>
          <button className="btn ghost" onClick={async () => { await logout(); navigate('/login'); }}>
            Log out
          </button>
        </div>
      )}
    </header>
  );
}
