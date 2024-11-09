// Encoded tokens (encoded as Base64)
const encodedCloudKitToken = 'NTk4ZDUyODc2OGZlYzM1YWUxMDQxN2QzMzEzZmQ0YWU2ZmM2YzY1OTA3YTJlMmU3YmY4ODQ5MWYwZWZmOWQwYQ==';
const encodedMapboxToken = 'cGsuaWlraXRrbzEiLCJhIjoiY20wemJxaDVzMDVheDJqczg0NnV3MG1jbyJ9.8MNS07csgIJkUXTGjZiaYA=='; // New encoded value

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

        // Expose map variable to global scope for `addControl`
        window.map = map;

        // Add controls
        const navControl = new mapboxgl.NavigationControl();
        map.addControl(navControl, 'top-right');

        const geoLocateControl = new mapboxgl.GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: true,
            showUserHeading: true
        });
        map.addControl(geoLocateControl, 'top-left');
    } catch (error) {
        console.error("Error initializing services:", error);
    }
}

export { initializeServices };
