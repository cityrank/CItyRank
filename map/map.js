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
        // Add the rest of your non-essential layers here...
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

// Fetch country data and add polygons based on average rating
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

    // Define unique source and layer identifiers
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

    // Iterate through the sources to manage visibility
    map.getStyle().layers.forEach(layer => {
        if (layer.id.includes('-layer')) {
            map.setLayoutProperty(layer.id, 'visibility', isVisible);
        }
    });
});
