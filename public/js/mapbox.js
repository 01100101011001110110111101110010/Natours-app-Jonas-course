/* eslint-disable */
console.log('hello from the client side');
const locations = JSON.parse(document.getElementById('map').dataset.locations);
console.log(locations);

mapboxgl.accessToken =
  'pk.eyJ1IjoidmVub20xMzY4NiIsImEiOiJjbXBjcDBrMGUwMGJyMnNzOGlnNjd5bXFvIn0.35twOuLNg7spS5wtjEO1kA';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/venom13686/cmpevybm8000001sghnw3cvok',
  scrollZoom: false,
});
const bounds = new mapboxgl.LngLatBounds();

locations.forEach((loc) => {
  // Создать маркер
  const el = document.createElement('div');
  el.className = 'marker';

  // Добавить маркер
  new mapboxgl.Marker({
    element: el,
    anchor: 'bottom',
  })
    .setLngLat(loc.coordinates)
    .addTo(map);

  // Добавить всплывающее окно
  new mapboxgl.Popup({
    offset: 30,
  })
    .setLngLat(loc.coordinates)
    .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
    .addTo(map);

  // Расширить границы карты, чтобы включить текущую локацию
  bounds.extend(loc.coordinates);
});

map.fitBounds(bounds, {
  padding: {
    top: 200,
    bottom: 150,
    left: 100,
    right: 100,
  },
});
