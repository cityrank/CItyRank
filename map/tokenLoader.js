// Encoded tokens (replace with fully encoded tokens)
const encodedCloudKitToken = 'NTk4ZDUyODc2OGZlYzM1YWUxMDQxN2QzMzEzZmQ0YWU2ZmM2YzY1OTA3YTJlMmU3YmY4ODQ5MWYwZWZmOWQwYQ==';
const encodedMapboxToken = 'cGsuaWlraXRrbzEiLCJhIjoiY20wemJxaDVzMDVheDJqczg0NnV3MG1jbyJ9.8MNS07csgIJkUXTGjZiaYA=='; // New encoded value

// Decoding function
function decodeToken(encodedToken) {
    return atob(encodedToken);
}

// Initialize CloudKit and Mapbox with decoded tokens
function initializeServices() {
    const cloudKitToken = decodeToken(encodedCloudKitToken);
    const mapboxToken = decodeToken(encodedMapboxToken);

    console.log("Decoded CloudKit Token:", cloudKitToken);
    console.log("Decoded Mapbox Token:", mapboxToken);  // Confirm this is the full, correct token

    // Initialize CloudKit
    CloudKit.configure({
        containers: [{
            containerIdentifier: 'iCloud.com.mikita.mapapp',
            apiTokenAuth: { apiToken: cloudKitToken, persist: true },
            environment: 'production'
        }]
    });

    // Initialize Mapbox
    mapboxgl.accessToken = mapboxToken;
    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [0, 0],
        zoom: 2,
        projection: 'globe'
    });

    // Add controls to map
    map.addControl(new mapboxgl.NavigationControl());
}

// Export the initialization function for use in HTML
export { initializeServices };
