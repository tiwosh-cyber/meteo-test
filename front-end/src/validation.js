import { conditions } from './data/weather.js';

export const PASSWORD_MIN_LENGTH = 8;

export function validateAuth({ email, password }, register = false) {
  const errors = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = 'Saisissez une adresse email valide.';
  }
  if (!password) errors.password = 'Saisissez votre mot de passe.';
  else if (register && password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `Utilisez au moins ${PASSWORD_MIN_LENGTH} caractères.`;
  }
  return errors;
}

export function validateWeather({ temperature, condition, humidity }) {
  const errors = {};
  if (String(temperature).trim() === '' || !Number.isFinite(Number(temperature))) {
    errors.temperature = 'Saisissez une température numérique valide.';
  }
  if (!conditions.includes(condition)) errors.condition = 'Choisissez une condition météo proposée.';
  if (String(humidity).trim() === '' || !Number.isFinite(Number(humidity)) || Number(humidity) < 0 || Number(humidity) > 100) {
    errors.humidity = 'Saisissez une humidité comprise entre 0 et 100 %.';
  }
  return errors;
}
