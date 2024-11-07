// Initialize Mapbox
mapboxgl.accessToken = 'pk.eyJ1IjoibWlraXRrbzEiLCJhIjoiY20wemJxaDVzMDVheDJqczg0NnV3MG1jbyJ9.8MNS07csgIJkUXTGjZiaYA';
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [0, 0],
    zoom: 2,
    projection: 'globe' // Set the map projection to a globe
});

map.on('style.load', () => {
    console.log("Map loaded with style:", map.getStyle());

    // Hardcode adding a single country polygon for testing
    addTestCountryPolygon('United States');
});

// Add a test polygon for a specific country
function addTestCountryPolygon(country) {
    const color = '#27ae60'; // Sample color
    const sourceId = `${country}-source`;
    const layerId = `${country}-layer`;

    console.log(`Attempting to add test polygon for ${country}`);

    // Remove any existing source and layer
    if (map.getSource(sourceId)) map.removeSource(sourceId);
    if (map.getLayer(layerId)) map.removeLayer(layerId);

    // Add a vector source for country boundaries
    map.addSource(sourceId, {
        type: 'vector',
        url: 'mapbox://mapbox.country-boundaries-v1'
    });

    console.log(`Source ${sourceId} added for ${country}`);

    // Try to add a new layer for the test country polygon
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
        console.log(`Test layer ${layerId} added for ${country}`);
    } catch (error) {
        console.error(`Error adding test layer for ${country}:`, error);
    }

    // Verify if the layer was added
    if (map.getLayer(layerId)) {
        console.log(`Test polygon layer added successfully for ${country}`);
    } else {
        console.error(`Failed to add test polygon layer for ${country}`);
    }
}
