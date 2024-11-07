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

// Define color codes for ratings
const countryRatingColors = {
    5: '#2ecc71',
    4: '#27ae60',
    3: '#f1c40f',
    2: '#e67e22',
    1: '#e74c3c'
};

// Apply globe settings and atmosphere
map.on('style.load', () => {
    map.setFog({
        color: 'rgba(135, 206, 235, 0.5)',
        "high-color": 'rgba(70, 130, 180, 0.8)',
        "space-color": 'rgba(20, 24, 82, 1.0)',
        "horizon-blend": 0.1,
        "star-intensity": 0.1
    });

    map.setMinZoom(1.0);
    map.setMaxZoom(11.0);

    console.log("Map style loaded successfully. Fetching country ratings...");
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
            console.log(`Attempting to add polygon for ${country} with average rating ${avgRating}`);
            addCountryPolygon(country, avgRating);
        });
    }).catch(error => console.error('CloudKit query failed:', error));
}

// Calculate average rating
function calculateAverage(ratings) {
    const sum = ratings.reduce((a, b) => a + b, 0);
    return sum / ratings.length;
}

// Map country names to ISO codes
function convertCountryNameToISOCode(countryName) {
    const countryCodes = {
        "United States": "US", "Canada": "CA", "Mexico": "MX" // Add more mappings as needed
    };
    return countryCodes[countryName] || countryName;
}

// Add polygon for a country based on rating
function addCountryPolygon(country, rating) {
    const isoCode = convertCountryNameToISOCode(country);
    const color = countryRatingColors[Math.round(rating)] || '#3498db';

    // Define source and layer IDs
    const sourceId = `${isoCode}-source`;
    const layerId = `${isoCode}-layer`;

    // Remove existing source and layer if they exist
    if (map.getSource(sourceId)) map.removeSource(sourceId);
    if (map.getLayer(layerId)) map.removeLayer(layerId);

    map.addSource(sourceId, {
        type: 'vector',
        url: 'mapbox://mapbox.country-boundaries-v1'
    });

    // Check source addition
    if (map.getSource(sourceId)) {
        console.log(`Source added for ${isoCode} (${country})`);
    } else {
        console.error(`Failed to add source for ${isoCode} (${country})`);
        return;
    }

    // Add layer for country polygon
    map.addLayer({
        id: layerId,
        type: 'fill',
        source: sourceId,
        'source-layer': 'country_boundaries',
        filter: ['==', 'iso_3166_1_alpha_2', isoCode],
        paint: {
            'fill-color': color,
            'fill-opacity': 0.5
        }
    });

    if (map.getLayer(layerId)) {
        console.log(`Polygon layer added for ${isoCode} (${country}) with color ${color}`);
    } else {
        console.error(`Failed to add polygon layer for ${isoCode} (${country})`);
    }
}

// Toggle visibility based on zoom level
map.on('zoom', () => {
    const zoom = map.getZoom();
    const isVisible = zoom < 4 ? 'visible' : 'none';

    Object.keys(map.getStyle().sources).forEach(sourceId => {
        if (sourceId.includes("-source")) {
            const layerId = sourceId.replace("-source", "-layer");
            if (map.getLayer(layerId)) {
                map.setLayoutProperty(layerId, 'visibility', isVisible);
            }
        }
    });
});
