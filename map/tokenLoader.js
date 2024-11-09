// Encoded tokens (ensure these are the correct Base64-encoded values)
const encodedCloudKitToken = 'NTk4ZDUyODc2OGZlYzM1YWUxMDQxN2QzMzEzZmQ0YWU2ZmM2YzY1OTA3YTJlMmU3YmY4ODQ5MWYwZWZmOWQwYQ==';
const encodedMapboxToken = 'cGsucnlramlhYXBwa29rYQ==';  // Replace with correct encoded Mapbox token

// Decoding function
function decodeToken(encodedToken) {
    try {
        return atob(encodedToken);
    } catch (error) {
        console.error("Error decoding token:", error);
        throw error;
    }
}

// Initialize CloudKit and Mapbox with decoded tokens
function initializeServices() {
    try {
        const cloudKitToken = decodeToken(encodedCloudKitToken);
        const mapboxToken = decodeToken(encodedMapboxToken);

        console.log("Decoded CloudKit Token:", cloudKitToken);
        console.log("Decoded Mapbox Token:", mapboxToken);

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
    } catch (error) {
        console.error("Error initializing services:", error);
    }
}

// Export the initialization function for use in HTML
export { initializeServices };
