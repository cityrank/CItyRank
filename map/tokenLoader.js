// Encoded tokens (encoded as Base64)
const encodedCloudKitToken = 'NTk4ZDUyODc2OGZlYzM1YWUxMDQxN2QzMzEzZmQ0YWU2ZmM2YzY1OTA3YTJlMmU3YmY4ODQ5MWYwZWZmOWQwYQ==';
const encodedMapboxToken = 'cGsuZXlKMUlqb2liV2xyYVhScmJ6RWlMQ0poSWpvaVkyMHdlbUp4YURWek1EVmhlREpxY3pnME5uVjNNRzFqYnlKOS44TU5TMDdjc2dJSmtVWFRHalppYVlB'; // New encoded value

function decodeToken(encodedToken) {
    try {
        return atob(encodedToken);
    } catch (error) {
        console.error("Error decoding token:", error);
        throw error;
    }
}

// Initialize CloudKit and Mapbox with decoded tokens
export function initializeServices() {
    return new Promise((resolve, reject) => {
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

            map.on('load', () => resolve(map));
        } catch (error) {
            console.error("Error initializing services:", error);
            reject(error);
        }
    });
}
