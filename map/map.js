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

let countryPolygonsAdded = false;
const cityRatingCache = new Map();
const countryRatingCache = new Map();
const cityCoordinatesCache = new Map();

// Colors for country ratings
const ratingColors = {
    5: '#2ecc71', // Green
    4: '#27ae60', // Light green
    3: '#f1c40f', // Yellow
    2: '#e67e22', // Orange
    1: '#e74c3c'  // Red
};

// Display country polygons if zoom level is less than threshold
map.on('zoom', () => {
    const zoomLevel = map.getZoom();
    if (zoomLevel < 4.0 && !countryPolygonsAdded) {
        showCountryPolygons();
        countryPolygonsAdded = true;
    } else if (zoomLevel >= 4.0 && countryPolygonsAdded) {
        hideCountryPolygons();
        countryPolygonsAdded = false;
    }
});

// Function to add country polygons based on ratings
function showCountryPolygons() {
    countryRatingCache.forEach((rating, countryCode) => {
        addPolygonForCountryBasedOnRating(countryCode, rating);
    });
}

// Function to hide all country polygons
function hideCountryPolygons() {
    countryRatingCache.forEach((_, countryCode) => {
        clearPolygonForCountry(countryCode);
    });
}

// Fetch city data and plot circles on the map
function fetchCitiesWithRatings() {
    CloudKit.getDefaultContainer().publicCloudDatabase.performQuery({
        recordType: 'CityComment'
    }).then(response => {
        if (response.hasErrors) {
            console.error('CloudKit query failed:', response.errors);
            return;
        }

        response.records.forEach(record => {
            const cityName = record.fields.cityName.value;
            const rating = record.fields.rating.value;
            const coordinate = cityCoordinatesCache.get(cityName) || null;

            if (coordinate) {
                addCityCircle(cityName, coordinate, rating);
            } else {
                geocodeCity(cityName).then(coordinate => {
                    if (coordinate) {
                        cityCoordinatesCache.set(cityName, coordinate);
                        addCityCircle(cityName, coordinate, rating);
                    }
                });
            }
        });
    });
}

// Add circle for a city with a specific rating
function addCityCircle(cityName, coordinate, rating) {
    const color = ratingColors[Math.round(rating)] || '#3498db';

    // Add a GeoJSON source for the city circle
    const sourceId = `${cityName}-source`;
    const layerId = `${cityName}-layer`;

    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);

    map.addSource(sourceId, {
        type: 'geojson',
        data: {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: coordinate
            },
            properties: { rating }
        }
    });

    map.addLayer({
        id: layerId,
        type: 'circle',
        source: sourceId,
        paint: {
            'circle-radius': 10,
            'circle-color': color,
            'circle-opacity': 0.7
        }
    });
}

// Function to add polygon for a country based on rating
function addPolygonForCountryBasedOnRating(countryCode, rating) {
    const sourceId = `${countryCode}-boundary-source`;
    const layerId = `${countryCode}-boundary-layer`;
    const color = ratingColors[Math.round(rating)] || '#3498db';

    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);

    map.addSource(sourceId, {
        type: 'vector',
        url: 'mapbox://mapbox.country-boundaries-v1'
    });

    map.addLayer({
        id: layerId,
        type: 'fill',
        source: sourceId,
        'source-layer': 'country_boundaries',
        paint: {
            'fill-color': color,
            'fill-opacity': 0.5
        },
        filter: ['==', 'iso_3166_1', countryCode]
    });
}

// Remove polygon for a country
function clearPolygonForCountry(countryCode) {
    const sourceId = `${countryCode}-boundary-source`;
    const layerId = `${countryCode}-boundary-layer`;

    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
}

// Geocode city name to get coordinates
function geocodeCity(cityName) {
    return fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(cityName)}.json?access_token=${mapboxgl.accessToken}`)
        .then(response => response.json())
        .then(data => {
            if (data.features && data.features.length > 0) {
                return data.features[0].geometry.coordinates;
            }
            console.error("Failed to geocode:", cityName);
            return null;
        });
}

// Fetch cities with ratings when the map loads
map.on('load', () => {
    fetchCitiesWithRatings();
});
