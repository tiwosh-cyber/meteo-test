"use strict";

const weather = {
  Paris: { temperature: 22, condition: "Ensoleillé", humidity: 45, icon: "sun" },
  Lyon: { temperature: 18, condition: "Nuageux", humidity: 60, icon: "cloud" },
  Marseille: { temperature: 26, condition: "Ensoleillé", humidity: 35, icon: "sun" }
};

const citySelect = document.querySelector("#city");
const cityCards = document.querySelectorAll(".city-card");

function selectCity(city) {
  if (!Object.hasOwn(weather, city)) return;
  const data = weather[city];
  citySelect.value = city;
  document.querySelector("#current-city").textContent = city;
  document.querySelector("#current-temperature").textContent = data.temperature;
  document.querySelector("#current-condition").textContent = data.condition;
  document.querySelector("#current-humidity").textContent = `${data.humidity} %`;
  document.querySelector("#current-icon").setAttribute("href", `#${data.icon}`);
  cityCards.forEach(card => card.setAttribute("aria-pressed", String(card.dataset.city === city)));
}

citySelect.addEventListener("change", () => selectCity(citySelect.value));
cityCards.forEach(card => card.addEventListener("click", () => selectCity(card.dataset.city)));
selectCity(citySelect.value);
