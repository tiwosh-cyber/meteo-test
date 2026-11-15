import { useEffect, useState } from 'react';
import { conditions } from '../data/weather.js';
import { validateWeather } from '../validation.js';
import { loadWeather, supabase } from '../supabase.js';
import { Button, CitySelect, Field, Message, PageIntro, WeatherState } from '../components/ui.jsx';
import { WeatherCard } from '../components/WeatherCard.jsx';
import { Icon } from '../components/Icons.jsx';

// E-004 · F-005/006 · US-005/006 · AC-011–015. The UI guard is cosmetic:
// F-003 / US-003 / AC-006–008 are enforced by RLS (public.is_manager()) and table constraints.
function WeatherEditor({ initial, onSaved }) {
  const initialValues = { temperature: String(initial.temperature), condition: initial.condition, humidity: String(initial.humidity) };
  const [draft, setDraft] = useState(initialValues);
  const [touched, setTouched] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [saving, setSaving] = useState(false);
  const errors = validateWeather(draft);
  const valid = Object.keys(errors).length === 0;
  const changed = Object.keys(draft).some(key => draft[key] !== initialValues[key]);
  function change(event) {
    setDraft({ ...draft, [event.target.name]: event.target.value });
    setFeedback(null);
  }
  function reset() {
    setDraft(initialValues); setTouched({});
    setFeedback({ tone: 'info', text: 'Les valeurs enregistrées ont été rétablies.' });
  }
  async function submit(event) {
    event.preventDefault();
    setTouched({ temperature: true, condition: true, humidity: true });
    if (!valid) {
      setFeedback({ tone: 'error', text: 'Corrigez les valeurs indiquées avant d’enregistrer.' });
      event.currentTarget.elements.namedItem(Object.keys(errors)[0]).focus();
      return;
    }
    setSaving(true);
    const values = { temperature: Number(draft.temperature), condition: draft.condition, humidity: Number(draft.humidity) };
    const { data, error } = await supabase.from('weather').update(values).eq('city', initial.city).select('city, temperature, condition, humidity');
    setSaving(false);
    if (error || data.length !== 1) {
      setFeedback({ tone: 'error', text: error ? 'Enregistrement refusé par le service. Vérifiez les valeurs ou réessayez.' : 'Enregistrement refusé : votre compte ne permet pas de modifier la météo.' });
      return;
    }
    const row = data[0];
    setDraft({ temperature: String(row.temperature), condition: row.condition, humidity: String(row.humidity) });
    onSaved({ ...initial, ...row, temperature: Number(row.temperature), humidity: Number(row.humidity) });
    setFeedback({ tone: 'success', text: `Météo de ${initial.city} enregistrée.` });
  }
  return <div className="admin-layout">
    <section className="form-card editor-card" aria-labelledby="editor-title">
      <div className="editor-heading"><h2 id="editor-title">Météo de {initial.city}</h2><span className="badge">{changed ? 'Modifications non enregistrées' : 'Enregistré'}</span></div>
      <p className="form-description">Modifiez les trois valeurs puis enregistrez.</p>
      <form noValidate onSubmit={submit}>
        <Field id="temperature" label="Température (°C)" type="number" step="any" inputMode="decimal" required value={draft.temperature} onChange={change} onBlur={() => setTouched({ ...touched, temperature: true })} error={touched.temperature && errors.temperature} />
        <Field id="condition" label="Conditions météo" error={touched.condition && errors.condition}>
          {accessibility => <select {...accessibility} name="condition" value={draft.condition} onChange={change} required>{conditions.map(condition => <option key={condition}>{condition}</option>)}</select>}
        </Field>
        <Field id="humidity" label="Humidité (%)" type="number" min="0" max="100" step="any" inputMode="decimal" required hint="Une valeur comprise entre 0 et 100 %." value={draft.humidity} onChange={change} onBlur={() => setTouched({ ...touched, humidity: true })} error={touched.humidity && errors.humidity} />
        {feedback && <Message tone={feedback.tone}>{feedback.text}</Message>}
        <div className="form-actions"><Button type="submit" loading={saving}>Enregistrer<Icon name="check" /></Button><Button variant="secondary" onClick={reset} disabled={saving}>Réinitialiser</Button></div>
      </form>
    </section>
    <aside className="admin-preview" aria-labelledby="preview-title">
      <div className="section-heading"><h2 id="preview-title">Aperçu</h2>{changed && <span className="badge badge-outline">Non enregistré</span>}</div>
      {valid ? <WeatherCard data={{ ...initial, temperature: Number(draft.temperature), condition: draft.condition, humidity: Number(draft.humidity) }} /> : <WeatherState status="empty" />}
      <p className="preview-explanation">{valid ? 'L’aperçu suit votre saisie. La page météo affiche les valeurs une fois enregistrées.' : 'Complétez les champs avec des valeurs valides pour retrouver l’aperçu.'}</p>
    </aside>
  </div>;
}

export default function AdminPage({ isManager }) {
  const [city, setCity] = useState('Paris');
  const [weather, setWeather] = useState([]);
  const [status, setStatus] = useState('loading');
  function load() {
    setStatus('loading');
    loadWeather().then(rows => { setWeather(rows); setStatus('ready'); }, () => setStatus('error'));
  }
  useEffect(() => { if (isManager) load(); }, [isManager]);
  if (!isManager) return <>
    <PageIntro eyebrow="ESPACE DE GESTION" title="Accès réservé">La gestion de la météo est réservée aux Managers.</PageIntro>
    <Message tone="error" title="Accès refusé">Votre compte ne permet pas d’accéder à l’administration.</Message>
  </>;
  const initial = weather.find(item => item.city === city);
  return <>
    <PageIntro eyebrow="ESPACE DE GESTION" title="Chaque détail fait le temps">Mettez à jour la météo des trois villes, dans le même esprit de simplicité.</PageIntro>
    <div className="weather-toolbar admin-toolbar"><p className="section-label">Ville à modifier</p><CitySelect value={city} onChange={setCity} id="admin-city" /></div>
    {status !== 'ready' ? <WeatherState status={status} onRetry={load} /> :
      initial ? <WeatherEditor key={city} initial={initial} onSaved={row => setWeather(weather.map(item => item.city === row.city ? row : item))} /> : <WeatherState status="empty" />}
  </>;
}
