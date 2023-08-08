/*eslint-disable*/

// const locationsData = JSON.parse(document.getElementById('map').dataset.locations);
const locations = JSON.parse(document.getElementById('map').dataset.locations);
console.log(locations);

mapboxgl.accessToken = 'pk.eyJ1IjoicnJnMjQiLCJhIjoiY2xreXhzZjRrMDFoODNvcDNsdmR6YTNnYyJ9.kAxdbNNQ1I9sMjb_hZZS3g';

var map = new mapboxgl.Map({
    container: 'map', //id of element in html file where map should be visible
    style: 'mapbox://styles/rrg24/clkyxwqww007201pd4r4n491e',
    scrollZoom: false,
    // center: [-118.113491, 34.111745],
    // zoom: 10,
    // interactive: false,
});

const bounds = new mapboxgl.LngLatBounds();

locations.forEach((loc) => {
    //Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    //Add marker
    new mapboxgl.Marker({
        element: el,
        anchor: 'bottom',
    })
        .setLngLat(loc.coordinates)
        .addTo(map);
    // Add popup
    new mapboxgl.Popup({
        offset: 30,
    })
        .setLngLat(loc.coordinates)
        .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
        .addTo(map);
    // Extend map bounds to include current locations
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
