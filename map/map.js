// Initialize CloudKit
CloudKit.configure({
    containers: [{
        containerIdentifier: 'iCloud.com.mikita.mapapp',
        apiTokenAuth: { apiToken: '598d528768fec35ae10417d3313fd4ae6fc6c65907a2e2e7bf88491f0eff9d0a', persist: true },
        environment: 'production'
    }]
});

// Initialize Mapbox
mapboxgl.accessToken = 'pk.eyJ1IjoibWlraXRrbzEiLCJhIjoiY20wemJxaDVzMDVheDJqczg0NnV3MG1jbyJ9.8MNS07csgIJkUXTGjZiaYA';
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [0, 0],
    zoom: 2,
    projection: 'globe' // Set the map projection to a globe
});

map.on('style.load', () => {
    console.log("Map loaded");  // Debug check if Mapbox style loads
    map.setFog({
        color: 'rgba(135, 206, 235, 0.5)', // Light sky blue near horizon
        "high-color": 'rgba(70, 130, 180, 0.8)', // Soft blue higher in the atmosphere
        "space-color": 'rgba(20, 24, 82, 1.0)', // Deep navy for space
        "horizon-blend": 0.1,
        "star-intensity": 0.1
    });

    map.setMinZoom(1.0);
    map.setMaxZoom(11.0);

    fetchCountryRatings();
});

// Fetch country data and add polygons based on average rating
function fetchCountryRatings() {
    console.log("Fetching country ratings from CloudKit");  // Debug check
    CloudKit.getDefaultContainer().publicCloudDatabase.performQuery({
        recordType: 'CityComment'
    }).then(response => {
        if (response.hasErrors) {
            console.error('CloudKit query failed:', response.errors);
            return;
        }

        console.log("Fetched records:", response.records);  // Debug check for records

        const countryRatings = {};
        response.records.forEach(record => {
            const country = record.fields.country?.value;
            const rating = record.fields.rating?.value;

            if (country && rating) {
                if (!countryRatings[country]) countryRatings[country] = [];
                countryRatings[country].push(rating);
            }
        });

        Object.keys(countryRatings).forEach(country => {
            const avgRating = calculateAverage(countryRatings[country]);
            console.log(`Adding polygon for ${country} with average rating ${avgRating}`); // Debug for each country
            addCountryPolygon(country, avgRating);
        });
    }).catch(error => console.error('CloudKit query failed:', error));
}

// Calculate average rating
function calculateAverage(ratings) {
    const sum = ratings.reduce((a, b) => a + b, 0);
    return sum / ratings.length;
}

// Add polygon for a country based on rating
function addCountryPolygon(country, rating) {
    const color = countryRatingColors[Math.round(rating)] || '#3498db';
    const sourceId = `${country}-source`;
    const layerId = `${country}-layer`;

    // Remove existing source and layer if they exist
    if (map.getSource(sourceId)) map.removeSource(sourceId);
    if (map.getLayer(layerId)) map.removeLayer(layerId);

    map.addSource(sourceId, {
        type: 'vector',
        url: 'mapbox://mapbox.country-boundaries-v1'
    });

    map.addLayer({
        id: layerId,
        type: 'fill',
        source: sourceId,
        'source-layer': 'country_boundaries',
        filter: ['==', 'name', country],
        paint: {
            'fill-color': color,
            'fill-opacity': 0.5
        }
    });
}

// Toggle visibility based on zoom level
map.on('zoom', () => {
    const zoom = map.getZoom();
    const isVisible = zoom < 4 ? 'visible' : 'none';

    map.getStyle().layers.forEach(layer => {
        if (layer.id.includes('-layer')) {
            map.setLayoutProperty(layer.id, 'visibility', isVisible);
        }
    });
});
