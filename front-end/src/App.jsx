import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router';
import { Icon, IconLibrary } from './components/Icons.jsx';
import { WeatherState } from './components/ui.jsx';
import { supabase } from './supabase.js';
import WeatherPage from './pages/WeatherPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import AdminPage from './pages/AdminPage.jsx';

const pageTitles = { '/weather': 'Météo', '/login': 'Connexion', '/register': 'Inscription', '/admin': 'Administration' };

export default function App() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const previousPath = useRef(pathname);
  const [session, setSession] = useState(undefined); // undefined = not yet known
  const [isManager, setIsManager] = useState(undefined);
  useEffect(() => {
    document.title = `${pageTitles[pathname] || 'Météo'} — METEO TEST`;
    if (previousPath.current !== pathname) {
      window.scrollTo(0, 0);
      document.querySelector('#page-title')?.focus({ preventScroll: true });
      previousPath.current = pathname;
    }
  }, [pathname]);
  // F-002 · AC-003–005: session restored on load, cleared on sign-out or expiry.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);
  // F-003 · AC-006/011/012: role from public.managers (own row only, RLS). Any error denies.
  const userId = session?.user.id;
  useEffect(() => {
    setIsManager(undefined);
    if (!userId) return;
    supabase.from('managers').select('user_id').eq('user_id', userId)
      .then(({ data, error }) => setIsManager(!error && data.length === 1));
  }, [userId]);
  async function signOut() {
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  }
  const loading = <WeatherState status="loading" />;
  const privateRoute = page => session === undefined ? loading : session ? page : <Navigate to="/login" replace />;
  const guestRoute = page => session === undefined ? loading : session ? <Navigate to="/weather" replace /> : page;
  return <>
    <IconLibrary />
    <a className="skip-link" href="#main">Aller au contenu</a>
    <header className="site-header"><div className="header-inner">
      <Link className="logo" to="/weather" aria-label="METEO TEST, accueil"><span className="logo-mark"><Icon name="sun" /></span>METEO<span className="logo-light">TEST</span></Link>
      <nav aria-label="Navigation principale"><NavLink className="nav-link" to="/weather">Ma météo</NavLink>{isManager && <NavLink className="nav-link" to="/admin">Administration</NavLink>}</nav>
      {session ? <button type="button" className="account-button" onClick={signOut} title={session.user.email}><Icon name="user" />Se déconnecter</button>
        : <NavLink className="account-button" to="/login"><Icon name="user" />Mon compte</NavLink>}
    </div></header>
    <main id="main" className="page" tabIndex={-1}>
      <Routes>
        <Route path="/" element={<Navigate to="/weather" replace />} />
        <Route path="/weather" element={privateRoute(<WeatherPage />)} />
        <Route path="/login" element={guestRoute(<AuthPage key="login" />)} />
        <Route path="/register" element={guestRoute(<AuthPage key="register" register />)} />
        <Route path="/admin" element={privateRoute(isManager === undefined ? loading : <AdminPage isManager={isManager} />)} />
        <Route path="*" element={<Navigate to="/weather" replace />} />
      </Routes>
      <footer><span>METEO TEST <span className="footer-separator">/</span> Le temps, en toute simplicité.</span></footer>
    </main>
  </>;
}
