// F-004 / US-004 / AC-009: isolated preview fixtures, never persisted.
export const weatherPreview = [
  { city: 'Paris', region: 'Île-de-France', temperature: 22, condition: 'Ensoleillé', humidity: 45 },
  { city: 'Lyon', region: 'Auvergne-Rhône-Alpes', temperature: 18, condition: 'Nuageux', humidity: 60 },
  { city: 'Marseille', region: 'Provence-Alpes-Côte d’Azur', temperature: 26, condition: 'Ensoleillé', humidity: 35 },
];

export const conditions = ['Ensoleillé', 'Nuageux', 'Pluvieux', 'Orageux'];
export const weatherIcons = { Ensoleillé: 'sun', Nuageux: 'cloud', Pluvieux: 'rain', Orageux: 'storm' };
