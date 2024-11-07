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
        color: 'rgba(135, 206, 235, 0.5)', // Light sky blue near horizon
        "high-color": 'rgba(70, 130, 180, 0.8)', // Soft blue higher in the atmosphere
        "space-color": 'rgba(20, 24, 82, 1.0)', // Deep navy for space
        "horizon-blend": 0.1,
        "star-intensity": 0.1
    });

    map.setMinZoom(1.0);
    map.setMaxZoom(11.0);

    // Hide non-essential layers
    const layersToHide = [
        "national-park", "landuse", "pitch-outline",
        "aeroway-polygon", "aeroway-line", "building-outline", "building",
        "tunnel-street-minor-low", "tunnel-street-minor-case",
        "tunnel-primary-secondary-tertiary-case", "tunnel-major-link-case",
        "tunnel-motorway-trunk-case", "tunnel-construction", "tunnel-path",
        "tunnel-steps", "tunnel-major-link", "tunnel-pedestrian",
        "tunnel-street-minor", "tunnel-primary-secondary-tertiary",
        "tunnel-oneway-arrow-blue", "tunnel-motorway-trunk",
        "tunnel-oneway-arrow-white", "ferry", "ferry-auto", "road-path-bg",
        "road-steps-bg", "turning-feature-outline", "road-pedestrian-case",
        "road-minor-low", "road-street-low", "road-minor-case", "road-street-case",
        "road-secondary-tertiary-case", "road-primary-case", "road-major-link-case",
        "road-motorway-trunk-case", "road-construction", "road-path",
        "road-steps", "road-major-link", "road-pedestrian", "road-pedestrian-polygon-fill",
        "road-pedestrian-polygon-pattern", "road-polygon", "road-minor",
        "road-street", "road-secondary-tertiary", "road-primary",
        "road-oneway-arrow-blue", "road-motorway-trunk", "road-rail", "road-rail-tracks",
        "level-crossing", "road-oneway-arrow-white", "turning-feature", "golf-hole-line",
        "bridge-path-bg", "bridge-steps-bg", "bridge-pedestrian-case",
        "bridge-street-minor-low", "bridge-street-minor-case",
        "bridge-primary-secondary-tertiary-case", "bridge-major-link-case",
        "bridge-motorway-trunk-case", "bridge-construction", "bridge-path",
        "bridge-steps", "bridge-major-link", "bridge-pedestrian",
        "bridge-street-minor", "bridge-primary-secondary-tertiary",
        "bridge-oneway-arrow-blue", "bridge-motorway-trunk", "bridge-rail",
        "bridge-rail-tracks", "bridge-major-link-2-case", "bridge-motorway-trunk-2-case",
        "bridge-major-link-2", "bridge-motorway-trunk-2", "bridge-oneway-arrow-white",
        "aerialway", "building-number-label", "road-label", "road-number-shield",
        "road-exit-shield", "golf-hole-label", "natural-line-label",
        "natural-point-label", "poi-label", "transit-label", "airport-label",
        "settlement-subdivision-label", "state-label", "water-line-label",
        "water-point-label", "waterway-label", "admin-1-boundary", "admin-1-boundary-bg",
        "hillshade", "terrain"
    ];

    layersToHide.forEach(layerId => {
        if (map.getLayer(layerId)) {
            map.setLayoutProperty(layerId, 'visibility', 'none');
        }
    });

    // Apply default colors for remaining layers
    map.getStyle().layers.forEach(layer => {
        const layerId = layer.id.toLowerCase();

        // Target water layers explicitly by looking for "water" in the layer name or id
        if (layerId.includes('water')) {
            if (layer.type === 'fill') {
                map.setPaintProperty(layer.id, 'fill-color', '#d3d3d3');
            } else if (layer.type === 'line') {
                map.setPaintProperty(layer.id, 'line-color', '#A9A9A9');
            }
        }

        // Apply default grayscale for other fill and line layers
        if (layer.type === 'fill') {
            map.setPaintProperty(layer.id, 'fill-color', '#d3d3d3');
        } else if (layer.type === 'line') {
            map.setPaintProperty(layer.id, 'line-color', '#A9A9A9');
        }
    });

    // Fetch and display country polygons based on ratings
    fetchCountryRatings();
});

// Fetch country data and add polygons
function fetchCountryRatings() {
    CloudKit.getDefaultContainer().publicCloudDatabase.performQuery({
        recordType: 'CityComment'
    }).then(response => {
        if (response.hasErrors) {
            console.error('CloudKit query failed:', response.errors);
            return;
        }

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

    map.addSource(`${country}-source`, {
        type: 'vector',
        url: 'mapbox://mapbox.country-boundaries-v1'
    });

    map.addLayer({
        id: `${country}-layer`,
        type: 'fill',
        source: `${country}-source`,
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

    // Show country polygons if zoom level is low, hide otherwise
    Object.keys(map.getStyle().sources).forEach(sourceId => {
        if (sourceId.includes("-source")) {
            map.setLayoutProperty(sourceId.replace("-source", "-layer"), 'visibility', zoom < 4 ? 'visible' : 'none');
        }
    });
});
