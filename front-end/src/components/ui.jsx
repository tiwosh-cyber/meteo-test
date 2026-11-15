import { Icon } from './Icons.jsx';
import { weatherPreview } from '../data/weather.js';

export function Button({ children, variant = 'primary', loading = false, disabled, type = 'button', ...props }) {
  return <button type={type} className={`button button-${variant}`} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
    {loading && <span className="spinner" aria-hidden="true" />}{children}
  </button>;
}

export function Message({ tone = 'info', title, children }) {
  return <div className={`message message-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
    <Icon name={tone === 'success' ? 'check' : 'info'} />
    <div>{title && <strong>{title}</strong>}{children && <p>{children}</p>}</div>
  </div>;
}

export function Field({ id, label, hint, error, children, ...props }) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  return <div className="field">
    <label htmlFor={id}>{label}</label>
    {children ? children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy }) :
      <input id={id} name={id} aria-invalid={Boolean(error)} aria-describedby={describedBy} {...props} />}
    {hint && <p id={`${id}-hint`} className="field-hint">{hint}</p>}
    {error && <p id={`${id}-error`} className="field-error">{error}</p>}
  </div>;
}

export function PageIntro({ eyebrow = 'UN PEU PLUS PRÈS DU CIEL', title, children }) {
  return <div className="intro">
    <p className="eyebrow"><span />{eyebrow}</p>
    <h1 tabIndex={-1} id="page-title">{title}<span className="title-dot">.</span></h1>
    <p className="intro-copy">{children}</p>
  </div>;
}

export function CitySelect({ value, onChange, id = 'city' }) {
  return <div className="city-select">
    <Icon name="pin" /><label className="sr-only" htmlFor={id}>Choisir une ville</label>
    <select id={id} value={value} onChange={event => onChange(event.target.value)}>
      {weatherPreview.map(item => <option key={item.city}>{item.city}</option>)}
    </select>
  </div>;
}

// These are visual states, not simulated network requests or responses.
export function PreviewStates({ value, onChange }) {
  return <details className="preview-states">
    <summary>Prévisualiser les états d’affichage</summary>
    <label htmlFor="preview-state">État visuel de la météo</label>
    <select id="preview-state" value={value} onChange={event => onChange(event.target.value)}>
      <option value="ready">Données fictives</option><option value="loading">Chargement</option>
      <option value="error">Erreur</option><option value="empty">Données absentes</option>
    </select>
    <p>Aperçus visuels uniquement : aucune requête n’est envoyée.</p>
  </details>;
}

export function WeatherState({ status, onRetry }) {
  const content = {
    loading: ['Chargement de la météo', 'Les informations météo apparaîtront ici.'],
    error: ['La météo est indisponible', 'Impossible d’afficher les données. Veuillez réessayer.'],
    empty: ['Pas encore de météo', 'Aucune donnée météo n’est disponible pour cette ville.'],
  }[status];
  return <section className="weather-state" aria-busy={status === 'loading'} aria-label={content[0]}>
    {status === 'loading' ? <span className="spinner" aria-hidden="true" /> : <Icon name={status === 'error' ? 'info' : 'cloud'} />}
    <div role={status === 'error' ? 'alert' : 'status'}><h2>{content[0]}</h2><p>{content[1]}</p></div>
    {status === 'error' && onRetry && <Button variant="secondary" onClick={onRetry}>Revenir aux données fictives</Button>}
  </section>;
}
