export interface LocationData {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
}

export interface GeolocationError {
    code: number;
    message: string;
}

/**
 * Get user's current GPS location
 */
export const getCurrentLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject({
                code: 0,
                message: 'Geolocation is not supported by your browser'
            });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => resolve(position),
            (error) => {
                let message = 'Unable to retrieve your location';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        message = 'Location permission denied. Please enable location access in your browser settings.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message = 'Location information is unavailable.';
                        break;
                    case error.TIMEOUT:
                        message = 'Location request timed out.';
                        break;
                }
                reject({ code: error.code, message });
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });
};

/**
 * Reverse geocode coordinates to address using Nominatim (OpenStreetMap)
 * Free API, no key required
 */
export const reverseGeocode = async (latitude: number, longitude: number): Promise<LocationData> => {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'PulpFiction-App' // Required by Nominatim
                }
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch address');
        }

        const data = await response.json();
        const address = data.address || {};

        return {
            latitude,
            longitude,
            address: data.display_name || '',
            city: address.city || address.town || address.village || '',
            state: address.state || '',
            postalCode: address.postcode || '',
            country: address.country || 'India'
        };
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        // Return basic location data without address
        return {
            latitude,
            longitude,
            address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
        };
    }
};

/**
 * Get user location with address
 */
export const getUserLocationWithAddress = async (): Promise<LocationData> => {
    const position = await getCurrentLocation();
    const { latitude, longitude } = position.coords;

    const locationData = await reverseGeocode(latitude, longitude);
    return locationData;
};
