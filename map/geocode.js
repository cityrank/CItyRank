// Colors based on rating
const ratingColors = {
    5: '#2ecc71',   // Green
    4: '#27ae60',   // Light green
    3: '#f1c40f',   // Yellow
    2: '#e67e22',   // Orange
    1: '#e74c3c'    // Red
};

// Fetch data from CloudKit and plot on the map
function fetchCityRatings() {
    CloudKit.getDefaultContainer().publicCloudDatabase.performQuery({
        recordType: 'CityComment'
    }).then(response => {
        if (response.hasErrors) {
            console.error('CloudKit query failed:', response.errors);
            return;
        }

        const records = response.records;
        const filteredRecords = records.filter(record => {
            const rating = record.fields.rating ? record.fields.rating.value : null;
            return rating !== null && rating !== undefined && !isNaN(rating);
        });

        filteredRecords.forEach(record => {
            const cityName = record.fields.cityName ? record.fields.cityName.value : "Unknown City";
            const comment = record.fields.comment ? record.fields.comment.value : "No comment";
            const rating = record.fields.rating.value;

            geocodeCity(cityName).then(coordinate => {
                if (coordinate) {
                    addCityCircle(coordinate, { cityName, rating, comment });
                }
            });
        });
    }).catch(error => console.error('CloudKit query failed:', error));
}

// Geocode city name to coordinates
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

// Add a circle to the map for each city
function addCityCircle(coordinate, city) {
    const color = ratingColors[Math.round(city.rating)] || '#3498db';

    map.addLayer({
        id: `${city.cityName}-circle`,
        type: 'circle',
        source: {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: [{
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: coordinate },
                    properties: {
                        cityName: city.cityName,
                        rating: city.rating,
                        comment: city.comment
                    }
                }]
            }
        },
        paint: {
            'circle-radius': 10,
            'circle-color': color,
            'circle-opacity': 0.7
        }
    });

    // Add a click event for each city circle
    map.on('click', `${city.cityName}-circle`, (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: [`${city.cityName}-circle`] });
        if (features.length) {
            const cityName = features[0].properties.cityName;
            const rating = features[0].properties.rating;
            const comment = features[0].properties.comment;

            new mapboxgl.Popup()
                .setLngLat(coordinate)
                .setHTML(`
                    <strong>City:</strong> ${cityName}<br>
                    <strong>Rating:</strong> ${rating}<br>
                    <strong>Comment:</strong> ${comment || 'No comment'}
                `)
                .addTo(map);
        }
    });
}

// Fetch and display city ratings initially
fetchCityRatings();
