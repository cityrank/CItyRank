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

// Sample country color mapping for testing
const countryRatingColors = {
    "US": '#2ecc71',  // Green for the United States
    "CA": '#3498db',  // Blue for Canada
    "ES": '#e74c3c'   // Red for Mexico
};

map.on('style.load', () => {
    console.log("Map style loaded successfully.");

    // Apply atmospheric effect for visual quality
    map.setFog({
        color: 'rgba(135, 206, 235, 0.5)',
        "high-color": 'rgba(70, 130, 180, 0.8)',
        "space-color": 'rgba(20, 24, 82, 1.0)',
        "horizon-blend": 0.1,
        "star-intensity": 0.1
    });

    // Add the country boundaries with dynamic colors
    addCountryBoundariesWithColors();
});

function addCountryBoundariesWithColors() {
    const sourceId = "country-boundaries";
    const layerId = "country-boundaries-layer";

    // Remove existing source and layer if they exist
    if (map.getSource(sourceId)) map.removeSource(sourceId);
    if (map.getLayer(layerId)) map.removeLayer(layerId);

    // Add the Mapbox vector source
    map.addSource(sourceId, {
        type: 'vector',
        url: 'mapbox://mapbox.country-boundaries-v1'
    });

    // Define the fill layer with a filter for the United States
    map.addLayer({
        id: layerId,
        type: 'fill',
        source: sourceId,
        'source-layer': 'country_boundaries',
        paint: {
            'fill-color': [
                'match',
                ['get', 'iso_3166_1_alpha_2'],
                'US', countryRatingColors['US'],
                'CA', countryRatingColors['CA'],
                'MX', countryRatingColors['MX'],
                '#cccccc' // Default color if no match
            ],
            'fill-opacity': 0.5
        }
    });

    console.log("Country boundaries layer with dynamic colors added successfully.");
}
