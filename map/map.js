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

// Define colors for country ratings
const countryRatingColors = {
    5: '#2ecc71',
    4: '#27ae60',
    3: '#f1c40f',
    2: '#e67e22',
    1: '#e74c3c'
};

// Add initial atmosphere and other styles
map.on('style.load', () => {
    setupAtmosphere();
    hideNonEssentialLayers();
    setupCountryPolygons();

    // Load country polygons if zoom level is low
    handleZoomToggle();
    map.on('zoom', handleZoomToggle);
});

// Sets up the atmosphere for the globe
function setupAtmosphere() {
    map.setFog({
        color: 'rgba(135, 206, 235, 0.5)', // Light sky blue near horizon
        "high-color": 'rgba(70, 130, 180, 0.8)', // Soft blue higher in the atmosphere
        "space-color": 'rgba(20, 24, 82, 1.0)', // Deep navy for space
        "horizon-blend": 0.1,
        "star-intensity": 0.1
    });
    map.setMinZoom(1.0);
    map.setMaxZoom(11.0);
}

// Hides non-essential layers
function hideNonEssentialLayers() {
    const layersToHide = [
        "national-park", "landuse", "pitch-outline",
        // (Add more layers based on your preferences)
        "road-label", "water-line-label", "admin-1-boundary", "admin-1-boundary-bg"
    ];
    layersToHide.forEach(layerId => {
        if (map.getLayer(layerId)) {
            map.setLayoutProperty(layerId, 'visibility', 'none');
        }
    });
}

// Sets up the country polygons layer with dynamic color based on rating
function setupCountryPolygons() {
    map.addSource('country-boundaries', {
        type: 'vector',
        url: 'mapbox://mapbox.country-boundaries-v1'
    });

    map.addLayer({
        id: 'country-boundaries-layer',
        type: 'fill',
        source: 'country-boundaries',
        'source-layer': 'country_boundaries',
        paint: {
            'fill-color': ['match', ['get', 'iso_3166_1'], ...getCountryRatingColors(), '#000000'], // Default color
            'fill-opacity': 0.5
        },
        layout: {
            'visibility': 'none' // Start hidden until zoom level check
        }
    });
}

// Retrieves color codes for each country rating for the paint property
function getCountryRatingColors() {
    // This should include a mapping of ISO country codes to ratings
    // For example: "US": 5, "CN": 4, etc.
    const ratingData = {
        "US": 5,
        "CN": 4,
        // (Map all countries you need with their respective ratings)
    };

    const result = [];
    for (const [isoCode, rating] of Object.entries(ratingData)) {
        result.push(isoCode, countryRatingColors[rating] || '#000000');
    }
    return result;
}

// Handles showing/hiding country polygons based on zoom level
function handleZoomToggle() {
    const zoomLevel = map.getZoom();
    const visibility = zoomLevel < 4 ? 'visible' : 'none';
    map.setLayoutProperty('country-boundaries-layer', 'visibility', visibility);
}
