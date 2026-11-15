import { useEffect, useRef } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router';
import { Icon, IconLibrary } from './components/Icons.jsx';
import WeatherPage from './pages/WeatherPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import AdminPage from './pages/AdminPage.jsx';

const pageTitles = { '/weather': 'Météo', '/login': 'Connexion', '/register': 'Inscription', '/admin': 'Administration · Aperçu' };

export default function App() {
  const { pathname } = useLocation();
  const previousPath = useRef(pathname);
  useEffect(() => {
    document.title = `${pageTitles[pathname] || 'Météo'} — METEO TEST`;
    if (previousPath.current !== pathname) {
      window.scrollTo(0, 0);
      document.querySelector('#page-title')?.focus({ preventScroll: true });
      previousPath.current = pathname;
    }
  }, [pathname]);
  return <>
    <IconLibrary />
    <a className="skip-link" href="#main">Aller au contenu</a>
    <header className="site-header"><div className="header-inner">
      <Link className="logo" to="/weather" aria-label="METEO TEST, accueil"><span className="logo-mark"><Icon name="sun" /></span>METEO<span className="logo-light">TEST</span></Link>
      <nav aria-label="Navigation principale"><NavLink className="nav-link" to="/weather">Ma météo</NavLink><NavLink className="nav-link" to="/admin">Administration<span className="nav-preview">Aperçu</span></NavLink></nav>
      <NavLink className="account-button" to="/login"><Icon name="user" />Mon compte</NavLink>
    </div></header>
    <div className="preview-banner"><span className="preview-dot" /><span>Aperçu frontend · Données fictives · Authentification et sauvegarde indisponibles</span></div>
    <main id="main" className="page" tabIndex={-1}>
      <Routes>
        <Route path="/" element={<Navigate to="/weather" replace />} />
        <Route path="/weather" element={<WeatherPage />} />
        <Route path="/login" element={<AuthPage key="login" />} />
        <Route path="/register" element={<AuthPage key="register" register />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/weather" replace />} />
      </Routes>
      <footer><span>METEO TEST <span className="footer-separator">/</span> Le temps, en toute simplicité.</span><span className="preview-note">Aperçu design · Données fictives</span></footer>
    </main>
  </>;
}
