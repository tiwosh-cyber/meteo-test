// F-004 / US-004: the three fixed cities (no add/remove). Weather values come from Supabase.
export const cities = [
  { city: 'Paris', region: 'Île-de-France' },
  { city: 'Lyon', region: 'Auvergne-Rhône-Alpes' },
  { city: 'Marseille', region: 'Provence-Alpes-Côte d’Azur' },
];

export const conditions = ['Ensoleillé', 'Nuageux', 'Pluvieux', 'Orageux'];
export const weatherIcons = { Ensoleillé: 'sun', Nuageux: 'cloud', Pluvieux: 'rain', Orageux: 'storm' };
