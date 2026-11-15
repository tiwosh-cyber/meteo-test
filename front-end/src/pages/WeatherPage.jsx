import { useEffect, useState } from 'react';
import { loadWeather } from '../supabase.js';
import { CityCard, WeatherCard } from '../components/WeatherCard.jsx';
import { CitySelect, PageIntro, WeatherState } from '../components/ui.jsx';

// E-003 · F-004 / US-004 / AC-009–010. Authenticated route; data protected by RLS.
export default function WeatherPage() {
  const [city, setCity] = useState('Paris');
  const [weather, setWeather] = useState([]);
  const [status, setStatus] = useState('loading');
  function load() {
    setStatus('loading');
    loadWeather().then(rows => { setWeather(rows); setStatus('ready'); }, () => setStatus('error'));
  }
  useEffect(load, []);
  const current = weather.find(item => item.city === city);
  const shown = status === 'ready' && current ? 'ready' : status === 'ready' ? 'empty' : status;
  return <>
    <PageIntro title="La météo en un coup d'œil">Le temps qu’il fait, simplement. Votre journée commence ici.</PageIntro>
    <div className="weather-toolbar"><p className="section-label">Votre météo du moment</p><CitySelect value={city} onChange={setCity} /></div>
    <p className="sr-only" role="status" aria-atomic="true">{shown === 'ready' ? `${current.city} : ${current.temperature} °C, ${current.condition}, humidité ${current.humidity} %.` : shown === 'loading' ? 'Chargement de la météo.' : 'Les données météo ne sont pas affichées.'}</p>
    {shown === 'ready' ? <WeatherCard data={current} /> : <WeatherState status={shown} onRetry={load} />}
    {weather.length > 0 && <section className="cities" aria-labelledby="cities-title">
      <div className="section-heading"><h2 id="cities-title">Et ailleurs en France</h2><p>À chaque ville, son ciel.</p></div>
      <div className="city-grid">{weather.map(data => <CityCard key={data.city} data={data} selected={city === data.city} onClick={() => setCity(data.city)} />)}</div>
    </section>}
  </>;
}
