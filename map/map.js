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

// Convert country name to ISO code if available
function convertCountryNameToISOCode(countryName) {
    const countryCodes = {
        "United States": "US", "Canada": "CA", "Mexico": "MX", // Add other mappings as needed
        // Add more countries as needed
    };
    return countryCodes[countryName] || countryName;
}

// Add polygon for a country based on rating
function addCountryPolygon(country, rating) {
    const isoCode = convertCountryNameToISOCode(country);  // Convert country to ISO if needed
    const color = countryRatingColors[Math.round(rating)] || '#3498db';

    // Define unique source and layer identifiers
    const sourceId = `${isoCode}-source`;
    const layerId = `${isoCode}-layer`;

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
        filter: ['==', 'iso_3166_1_alpha_2', isoCode],  // Use ISO code for filtering
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
