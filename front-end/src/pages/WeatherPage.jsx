import { useState } from 'react';
import { weatherPreview } from '../data/weather.js';
import { CityCard, WeatherCard } from '../components/WeatherCard.jsx';
import { CitySelect, PageIntro, PreviewStates, WeatherState } from '../components/ui.jsx';

// E-003 · F-004 / US-004 / AC-009–010. Public design preview, no private data.
export default function WeatherPage() {
  const [city, setCity] = useState('Paris');
  const [status, setStatus] = useState('ready');
  const current = weatherPreview.find(item => item.city === city);
  function selectCity(nextCity) { setCity(nextCity); setStatus('ready'); }
  return <>
    <PageIntro title="La météo en un coup d'œil">Le temps qu’il fait, simplement. Votre journée commence ici.</PageIntro>
    <div className="weather-toolbar"><p className="section-label">Votre météo du moment</p><CitySelect value={city} onChange={selectCity} /></div>
    <p className="sr-only" role="status" aria-atomic="true">{status === 'ready' && current ? `${current.city} : ${current.temperature} °C, ${current.condition}, humidité ${current.humidity} %.` : 'Aperçu : les données météo ne sont pas affichées.'}</p>
    {status === 'ready' ? <WeatherCard data={current} /> : <WeatherState status={status} onRetry={() => setStatus('ready')} />}
    <section className="cities" aria-labelledby="cities-title">
      <div className="section-heading"><h2 id="cities-title">Et ailleurs en France</h2><p>À chaque ville, son ciel.</p></div>
      <div className="city-grid">{weatherPreview.map(data => <CityCard key={data.city} data={data} selected={city === data.city} onClick={() => selectCity(data.city)} />)}</div>
    </section>
    <PreviewStates value={status} onChange={setStatus} />
  </>;
}
