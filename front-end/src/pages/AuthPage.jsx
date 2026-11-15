import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { supabase } from '../supabase.js';
import { Button, Field, Message, PageIntro } from '../components/ui.jsx';
import { Icon } from '../components/Icons.jsx';
import { PASSWORD_MIN_LENGTH, validateAuth } from '../validation.js';

// E-001/002 · F-001/002 · US-001/002 · AC-001–005: Supabase Auth, session without email confirmation.
const authErrors = {
  user_already_exists: 'Un compte existe déjà avec cette adresse email.',
  invalid_credentials: 'Email ou mot de passe incorrect.',
  weak_password: 'Mot de passe refusé : utilisez au moins 8 caractères.',
  email_address_invalid: 'Cette adresse email est refusée par le service.',
  over_request_rate_limit: 'Trop de tentatives. Réessayez dans quelques minutes.',
};

export default function AuthPage({ register = false }) {
  const [values, setValues] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const errors = validateAuth(values, register);
  function change(event) {
    setValues({ ...values, [event.target.name]: event.target.value });
    setFeedback(null);
  }
  async function submit(event) {
    event.preventDefault();
    setTouched({ email: true, password: true });
    const invalidField = Object.keys(errors)[0];
    if (invalidField) {
      setFeedback({ tone: 'error', text: 'Vérifiez les champs indiqués pour continuer.' });
      event.currentTarget.elements.namedItem(invalidField).focus();
      return;
    }
    setLoading(true);
    const credentials = { email: values.email.trim(), password: values.password };
    const { data, error } = register ? await supabase.auth.signUp(credentials) : await supabase.auth.signInWithPassword(credentials);
    setLoading(false);
    if (error || !data.session) {
      setFeedback({ tone: 'error', text: authErrors[error?.code] || 'Service indisponible. Vérifiez votre connexion et réessayez.' });
      return;
    }
    navigate('/weather', { replace: true });
  }
  return <div className="auth-layout">
    <section className="auth-story" aria-label="Bienvenue sur METEO TEST">
      <PageIntro title={register ? 'Un compte, le ciel à portée de main' : 'Heureux de vous retrouver'}>
        {register ? 'Un espace simple pour retrouver la météo de vos villes.' : 'Retrouvez le temps qu’il fait dans vos villes, en toute simplicité.'}
      </PageIntro>
      <div className="auth-illustration" aria-hidden="true"><div className="orbit orbit-outer" /><div className="orbit orbit-inner" /><Icon name="sun" className="auth-sun" /></div>
      <div className="auth-story-caption"><span className="eyebrow">LE TEMPS, EN TOUTE SIMPLICITÉ</span><p>Trois villes. Un regard.<br />L’essentiel de votre météo.</p></div>
    </section>
    <section className="form-card" aria-labelledby="auth-title">
      <div className="form-icon"><Icon name={register ? 'user' : 'lock'} /></div>
      <h2 id="auth-title">{register ? 'Créer un compte' : 'Connexion'}</h2>
      <p className="form-description">{register ? 'Renseignez votre email et choisissez un mot de passe.' : 'Saisissez vos identifiants pour vous connecter.'}</p>
      <form noValidate onSubmit={submit}>
        <Field id="email" label="Adresse email" type="email" autoComplete="email" inputMode="email" required value={values.email} onChange={change} onBlur={() => setTouched({ ...touched, email: true })} error={touched.email && errors.email} placeholder="vous@exemple.fr" />
        <Field id="password" label="Mot de passe" error={touched.password && errors.password} hint={register ? `${PASSWORD_MIN_LENGTH} caractères minimum.` : undefined}>
          {accessibility => <div className="password-input">
            <input {...accessibility} name="password" type={showPassword ? 'text' : 'password'} autoComplete={register ? 'new-password' : 'current-password'} required minLength={register ? PASSWORD_MIN_LENGTH : undefined} value={values.password} onChange={change} onBlur={() => setTouched({ ...touched, password: true })} />
            <button type="button" className="password-toggle" aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Masquer' : 'Afficher'}</button>
          </div>}
        </Field>
        {feedback && <Message tone={feedback.tone}>{feedback.text}</Message>}
        <Button type="submit" loading={loading}>{register ? 'Créer mon compte' : 'Se connecter'}<Icon name="arrow" /></Button>
      </form>
      {register && <p className="form-description legal-notice">Votre email sert uniquement à votre compte. <Link to="/mentions-legales">Mentions légales et confidentialité</Link></p>}
      <p className="auth-switch">{register ? 'Déjà un compte ?' : 'Pas encore de compte ?'} <Link to={register ? '/login' : '/register'}>{register ? 'Se connecter' : 'Créer un compte'}</Link></p>
    </section>
  </div>;
}
