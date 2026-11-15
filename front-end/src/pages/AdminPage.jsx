import { useState } from 'react';
import { conditions, weatherPreview } from '../data/weather.js';
import { validateWeather } from '../validation.js';
import { Button, CitySelect, Field, Message, PageIntro, WeatherState } from '../components/ui.jsx';
import { WeatherCard } from '../components/WeatherCard.jsx';
import { Icon } from '../components/Icons.jsx';

// E-004 · F-005/006 · US-005/006 · AC-011–015: public visual preview only.
// F-003 / US-003 / AC-006–008: real authorization must be enforced by the backend.
function WeatherEditor({ initial }) {
  const initialValues = { temperature: String(initial.temperature), condition: initial.condition, humidity: String(initial.humidity) };
  const [draft, setDraft] = useState(initialValues);
  const [touched, setTouched] = useState({});
  const [feedback, setFeedback] = useState(null);
  const errors = validateWeather(draft);
  const valid = Object.keys(errors).length === 0;
  const changed = Object.keys(draft).some(key => draft[key] !== initialValues[key]);
  function change(event) {
    setDraft({ ...draft, [event.target.name]: event.target.value });
    setFeedback(null);
  }
  function reset() {
    setDraft(initialValues); setTouched({});
    setFeedback({ tone: 'info', text: 'Les valeurs fictives d’origine ont été rétablies.' });
  }
  function submit(event) {
    event.preventDefault();
    setTouched({ temperature: true, condition: true, humidity: true });
    if (!valid) {
      setFeedback({ tone: 'error', text: 'Corrigez les valeurs indiquées pour prévisualiser la météo.' });
      event.currentTarget.elements.namedItem(Object.keys(errors)[0]).focus();
      return;
    }
    setFeedback({ tone: 'success', text: 'Brouillon valide pour l’aperçu uniquement. Aucune donnée n’a été enregistrée.' });
  }
  return <div className="admin-layout">
    <section className="form-card editor-card" aria-labelledby="editor-title">
      <div className="editor-heading"><h2 id="editor-title">Météo de {initial.city}</h2><span className="badge">{changed ? 'Brouillon modifié' : 'Données fictives'}</span></div>
      <p className="form-description">Ajustez les trois valeurs pour explorer le rendu.</p>
      <form noValidate onSubmit={submit}>
        <Field id="temperature" label="Température (°C)" type="number" step="any" inputMode="decimal" required value={draft.temperature} onChange={change} onBlur={() => setTouched({ ...touched, temperature: true })} error={touched.temperature && errors.temperature} />
        <Field id="condition" label="Conditions météo" error={touched.condition && errors.condition}>
          {accessibility => <select {...accessibility} name="condition" value={draft.condition} onChange={change} required>{conditions.map(condition => <option key={condition}>{condition}</option>)}</select>}
        </Field>
        <Field id="humidity" label="Humidité (%)" type="number" min="0" max="100" step="any" inputMode="decimal" required hint="Une valeur comprise entre 0 et 100 %." value={draft.humidity} onChange={change} onBlur={() => setTouched({ ...touched, humidity: true })} error={touched.humidity && errors.humidity} />
        {feedback && <Message tone={feedback.tone}>{feedback.text}</Message>}
        <div className="form-actions"><Button type="submit">Vérifier le brouillon<Icon name="check" /></Button><Button variant="secondary" onClick={reset}>Réinitialiser</Button></div>
        <div className="save-unavailable"><Button disabled><Icon name="lock" />Enregistrement indisponible</Button><p>Le brouillon disparaît au changement de ville, de page ou à l’actualisation.</p></div>
      </form>
    </section>
    <aside className="admin-preview" aria-labelledby="preview-title">
      <div className="section-heading"><h2 id="preview-title">Aperçu du brouillon</h2><span className="badge badge-outline">Non enregistré</span></div>
      {valid ? <WeatherCard data={{ ...initial, temperature: Number(draft.temperature), condition: draft.condition, humidity: Number(draft.humidity) }} /> : <WeatherState status="empty" />}
      <p className="preview-explanation">{valid ? 'L’aperçu suit votre saisie. La page météo conserve ses données fictives d’origine.' : 'Complétez les champs avec des valeurs valides pour retrouver l’aperçu.'}</p>
    </aside>
  </div>;
}

export default function AdminPage() {
  const [city, setCity] = useState('Paris');
  const initial = weatherPreview.find(item => item.city === city);
  return <>
    <PageIntro eyebrow="ESPACE DE GESTION · APERÇU" title="Chaque détail fait le temps">Prévisualisez la gestion météo, dans le même esprit de simplicité.</PageIntro>
    <Message title="Administration : prévisualisation visuelle uniquement">Aucun rôle Manager n’est attribué. L’autorisation et l’enregistrement sont indisponibles tant que le service n’est pas raccordé.</Message>
    <div className="weather-toolbar admin-toolbar"><p className="section-label">Ville à prévisualiser</p><CitySelect value={city} onChange={setCity} id="admin-city" /></div>
    {initial ? <WeatherEditor key={city} initial={initial} /> : <WeatherState status="empty" />}
  </>;
}
