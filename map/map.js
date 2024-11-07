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

map.on('style.load', () => {
    console.log("Map loaded with style:", map.getStyle());

    // Fetch country ratings dynamically
    fetchCountryRatings();
});

// Fetch country data and add polygons based on average rating
function fetchCountryRatings() {
    console.log("Fetching country ratings from CloudKit");
    CloudKit.getDefaultContainer().publicCloudDatabase.performQuery({
        recordType: 'CityComment'
    }).then(response => {
        if (response.hasErrors) {
            console.error('CloudKit query failed:', response.errors);
            return;
        }

        console.log("Fetched records:", response.records);

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
            console.log(`Adding polygon for ${country} with average rating ${avgRating}`);
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

    console.log(`Processing country: ${country}, Rating: ${rating}, Color: ${color}`); // Debug check

    // Remove existing source and layer if they exist
    if (map.getSource(sourceId)) map.removeSource(sourceId);
    if (map.getLayer(layerId)) map.removeLayer(layerId);

    // Add a vector source for country boundaries
    map.addSource(sourceId, {
        type: 'vector',
        url: 'mapbox://mapbox.country-boundaries-v1'
    });

    console.log(`Source ${sourceId} added for ${country}`);

    // Add a new layer for the country polygon
    try {
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
        console.log(`Polygon layer added for ${country}`);
    } catch (error) {
        console.error(`Error adding layer for ${country}:`, error);
    }

    // Verify layer addition
    if (map.getLayer(layerId)) {
        console.log(`Polygon layer successfully added for ${country}`);
    } else {
        console.error(`Failed to add polygon layer for ${country}`);
    }
}
