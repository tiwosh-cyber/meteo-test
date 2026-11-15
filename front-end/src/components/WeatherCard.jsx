import { Icon } from './Icons.jsx';
import { weatherIcons } from '../data/weather.js';
import { WeatherState } from './ui.jsx';

export function WeatherCard({ data }) {
  if (!data) return <WeatherState status="empty" />;
  return <section className="weather-main" aria-label={`Météo de ${data.city}`}>
    <div className="weather-details">
      <p className="location"><Icon name="pin" /><span>{data.city}</span><span className="country">France</span></p>
      <p className="now">EN CE MOMENT</p>
      <p className="temperature"><span>{data.temperature}</span><span className="unit">°C</span></p>
      <p className="condition">{data.condition}</p>
      <div className="humidity"><Icon name="drop" /><span>Humidité</span><strong>{data.humidity} %</strong></div>
    </div>
    <div className="weather-art" aria-hidden="true">
      <div className="orbit orbit-outer" /><div className="orbit orbit-inner" />
      <Icon name={weatherIcons[data.condition]} className="main-weather-icon" />
      <span className="art-caption">Un regard dehors, l’esprit léger.</span>
    </div>
    <div className="landscape" aria-hidden="true" />
  </section>;
}

export function CityCard({ data, selected, onClick }) {
  return <button className="city-card" type="button" aria-pressed={selected} onClick={onClick}>
    <span className="city-card-top"><span className="city-name">{data.city}<span className="city-region">{data.region}</span></span><Icon name={weatherIcons[data.condition]} className="small-weather-icon" /></span>
    <span className="city-card-weather"><span className="small-temperature">{data.temperature}<span> °C</span></span><span className="small-condition">{data.condition}</span></span>
    <span className="city-card-bottom"><span><Icon name="drop" />{data.humidity} % d’humidité</span><Icon name="arrow" className="icon card-arrow" /></span>
  </button>;
}
