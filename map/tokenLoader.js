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

        // Add Navigation and Geolocation Controls
        map.addControl(new mapboxgl.NavigationControl(), 'top-right');
        map.addControl(new mapboxgl.GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: true,
            showUserHeading: true
        }), 'top-left');

        // Add Map Style and Layer Adjustments
        map.on('style.load', () => {
            map.setFog({
                color: 'rgba(135, 206, 235, 0.5)',
                "high-color": 'rgba(70, 130, 180, 0.8)',
                "space-color": 'rgba(20, 24, 82, 1.0)',
                "horizon-blend": 0.1,
                "star-intensity": 0.1
            });
            map.setMinZoom(2.0);
            map.setMaxZoom(11.0);
        });

        // Further functions to add city circles, polygons, etc., can go here

    } catch (error) {
        console.error("Error initializing services:", error);
    }
}

// Call initializeServices once the file is loaded
initializeServices();
