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
    center: [-3.7038, 40.4168], // Center on Spain for testing
    zoom: 5,
    projection: 'globe'
});

// Define rating colors with a unique variable name
const countryRatingColors = {
    5: '#2ecc71', // Bright green
    4: '#27ae60', // Green
    3: '#f1c40f', // Yellow
    2: '#e67e22', // Orange
    1: '#e74c3c'  // Red
};

// Calculate average rating and apply to country polygons
map.on('style.load', () => {
    console.log("Map style loaded successfully.");
    map.setFog({
        color: 'rgba(135, 206, 235, 0.5)',
        "high-color": 'rgba(70, 130, 180, 0.8)',
        "space-color": 'rgba(20, 24, 82, 1.0)',
        "horizon-blend": 0.1,
        "star-intensity": 0.1
    });
    
    // Fetch ratings for countries
    fetchCountryRatings();
});

function fetchCountryRatings() {
    console.log("Fetching country ratings from CloudKit.");
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

        // Calculate average ratings for each country
        Object.keys(countryRatings).forEach(country => {
            const avgRating = calculateAverage(countryRatings[country]);
            const roundedRating = Math.round(avgRating);
            addCountryPolygon(country, roundedRating);
        });
    }).catch(error => console.error('CloudKit query failed:', error));
}

// Calculate the average of an array
function calculateAverage(ratings) {
    return ratings.reduce((a, b) => a + b, 0) / ratings.length;
}

// Add polygon for a country based on calculated rating
function addCountryPolygon(country, rating) {
    const color = countryRatingColors[rating] || '#3498db';  // Default to blue if no rating
    const countryCodeMap = { 'Spain': 'ES' };  // Add Spain as a test case

    if (!countryCodeMap[country]) return;  // Only add polygons for defined countries (e.g., Spain)

    const isoCode = countryCodeMap[country];  // Get ISO code for filtering

    // Define the fill layer
    const sourceId = `${isoCode}-source`;
    const layerId = `${isoCode}-layer`;

    // Remove existing source and layer if they exist
    if (map.getSource(sourceId)) map.removeSource(sourceId);
    if (map.getLayer(layerId)) map.removeLayer(layerId);

    // Add Mapbox vector source for country boundaries
    map.addSource(sourceId, {
        type: 'vector',
        url: 'mapbox://mapbox.country-boundaries-v1'
    });

    // Add polygon layer with color based on rating
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

    console.log(`Added polygon for ${country} with color ${color}`);
}
