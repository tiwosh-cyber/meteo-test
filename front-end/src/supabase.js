import { createClient } from '@supabase/supabase-js';
import { cities } from './data/weather.js';

// Public values only (Vite exposes them to the browser). Never a service_role key here.
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) throw new Error('Définir VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY dans front-end/.env.local.');

export const supabase = createClient(url, key);

// F-004 · AC-009/010: rows readable by authenticated users only (RLS). A city without a row is omitted → empty state.
export async function loadWeather() {
  const { data, error } = await supabase.from('weather').select('city, temperature, condition, humidity');
  if (error) throw error;
  return cities.flatMap(item => {
    const row = data.find(r => r.city === item.city);
    return row ? [{ ...item, ...row, temperature: Number(row.temperature), humidity: Number(row.humidity) }] : [];
  });
}
