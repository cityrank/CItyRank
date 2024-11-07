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

// Country rating colors (simplified for testing)
const testCountryColor = '#FF5733'; // Use a bright color to confirm visibility

// Apply atmosphere settings after style load
map.on('style.load', () => {
    console.log("Map style loaded successfully.");

    // Set fog effect for visual clarity
    map.setFog({
        color: 'rgba(135, 206, 235, 0.5)',
        "high-color": 'rgba(70, 130, 180, 0.8)',
        "space-color": 'rgba(20, 24, 82, 1.0)',
        "horizon-blend": 0.1,
        "star-intensity": 0.1
    });

    // Add the country boundaries source and a basic layer without filters
    addCountryBoundaries();
});

// Function to add a basic unfiltered country layer
function addCountryBoundaries() {
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

    // Log confirmation of the source
    console.log("Added country boundaries source.");

    // Add a simple fill layer to display country boundaries
    map.addLayer({
        id: layerId,
        type: 'fill',
        source: sourceId,
        'source-layer': 'country_boundaries',
        paint: {
            'fill-color': testCountryColor,  // Set to a bright test color
            'fill-opacity': 0.5
        }
    });

    // Confirm layer addition
    if (map.getLayer(layerId)) {
        console.log("Country boundaries layer added successfully.");
    } else {
        console.error("Failed to add country boundaries layer.");
    }
}
