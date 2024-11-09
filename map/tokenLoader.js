// Encoded tokens (base64 encoded to obscure actual values)
const encodedCloudKitToken = 'NTk4ZDUyODc2OGZlYzM1YWUxMDQxN2QzMzEzZmQ0YWU2ZmM2YzY1OTA3YTJlMmU3YmY4ODQ5MWYwZWZmOWQwYQ==';
const encodedMapboxToken = 'cGsuaW1wa2ltZG9jbXNvMGF6Z29lYzlkbDlpY20vMDJveHBpaXZpZ2k=';

// Decoding function
function decodeToken(encodedToken) {
    return atob(encodedToken);
}

// Initialize CloudKit and Mapbox with decoded tokens
function initializeServices() {
    const cloudKitToken = decodeToken(encodedCloudKitToken);
    const mapboxToken = decodeToken(encodedMapboxToken);

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
}

// Export the initialization function for use in HTML
export { initializeServices };
