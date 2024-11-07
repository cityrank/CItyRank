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
    projection: 'globe'
});

// Define color codes based on rating for country polygons
const countryRatingColors = {
    5: '#2ecc71',
    4: '#27ae60',
    3: '#f1c40f',
    2: '#e67e22',
    1: '#e74c3c'
};

// Apply globe settings, atmosphere, and adjust appearance of layers
map.on('style.load', () => {
    map.setFog({
        color: 'rgba(135, 206, 235, 0.5)',
        "high-color": 'rgba(70, 130, 180, 0.8)',
        "space-color": 'rgba(20, 24, 82, 1.0)',
        "horizon-blend": 0.1,
        "star-intensity": 0.1
    });

    // Fetch and display country polygons based on ratings
    displayCountryPolygons();
});

// Function to display country polygons based on average rating
function displayCountryPolygons() {
    // Replace this list with actual country names or a dynamic list as needed
    const countries = ["USA", "Canada", "France", "China"];

    countries.forEach(country => {
        CloudKitManager.fetchCountryAverageRating(country, (averageRating) => {
            if (averageRating) {
                const roundedRating = Math.round(averageRating);
                const color = countryRatingColors[roundedRating] || '#3498db';

                addCountryPolygon(country, color);
            }
        });
    });
}

// Function to add country polygon layer
function addCountryPolygon(country, color) {
    const sourceId = `${country}-source`;
    const layerId = `${country}-layer`;

    // Remove existing source and layer if present
    if (map.getSource(sourceId)) map.removeSource(sourceId);
    if (map.getLayer(layerId)) map.removeLayer(layerId);

    // Add Mapbox source for country boundary
    map.addSource(sourceId, {
        type: 'vector',
        url: 'mapbox://mapbox.country-boundaries-v1'
    });

    // Add layer for the country polygon with the rating-based color
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

    Object.keys(map.getStyle().sources).forEach(sourceId => {
        if (sourceId.includes("-source")) {
            map.setLayoutProperty(sourceId.replace("-source", "-layer"), 'visibility', isVisible);
        }
    });
});
