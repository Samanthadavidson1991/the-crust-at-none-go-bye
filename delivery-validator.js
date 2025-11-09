// Delivery Radius Validation System

class DeliveryValidator {
    constructor() {
        this.basePostcode = 'LS18 5HZ';
        this.maxDeliveryDistance = 4; // miles
        this.baseCoords = null;
        this.settingsLoaded = false;
        this.init();
    }

    async fetchSettings() {
        try {
            const res = await fetch('/delivery-settings.json');
            if (!res.ok) throw new Error('Settings not found');
            const data = await res.json();
            if (data.basePostcode) this.basePostcode = data.basePostcode;
            if (data.deliveryRadius) this.maxDeliveryDistance = Number(data.deliveryRadius);
            this.settingsLoaded = true;
        } catch (e) {
            // Use defaults if fetch fails
            this.basePostcode = 'LS18 5HZ';
            this.maxDeliveryDistance = 4;
            this.settingsLoaded = true;
        }
    }

    async init() {
        await this.fetchSettings();
        try {
            // Get coordinates for base postcode
            this.baseCoords = await this.getPostcodeCoordinates(this.basePostcode);
            console.log('Delivery base set:', this.basePostcode, this.baseCoords, 'Radius:', this.maxDeliveryDistance);
        } catch (error) {
            console.error('Failed to initialize delivery validator:', error);
            // Fallback coordinates for LS18 5HZ (Leeds)
            this.baseCoords = { lat: 53.8321, lng: -1.5733 };
        }
    }

    async getPostcodeCoordinates(postcode) {
        // Clean postcode format
        const cleanPostcode = postcode.replace(/\s+/g, '').toUpperCase();
        
        try {
            // Using free UK postcode API
            const response = await fetch(`https://api.postcodes.io/postcodes/${cleanPostcode}`);
            
            if (!response.ok) {
                throw new Error(`Postcode lookup failed: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.status === 200 && data.result) {
                return {
                    lat: data.result.latitude,
                    lng: data.result.longitude
                };
            } else {
                throw new Error('Invalid postcode');
            }
        } catch (error) {
            console.error('Postcode API error:', error);
            throw error;
        }
    }

    // Calculate distance between two coordinates using Haversine formula
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 3959; // Earth's radius in miles
        const dLat = this.toRadians(lat2 - lat1);
        const dLng = this.toRadians(lng2 - lng1);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        
        return Math.round(distance * 10) / 10; // Round to 1 decimal place
    }

    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    async validateDeliveryPostcode(postcode) {
        if (!postcode || !this.baseCoords) {
            return {
                valid: false,
                message: 'Please enter a valid postcode',
                distance: null
            };
        }

        try {
            const customerCoords = await this.getPostcodeCoordinates(postcode);
            const distance = this.calculateDistance(
                this.baseCoords.lat,
                this.baseCoords.lng,
                customerCoords.lat,
                customerCoords.lng
            );

            const isWithinRange = distance <= this.maxDeliveryDistance;

            return {
                valid: isWithinRange,
                distance: distance,
                message: isWithinRange 
                    ? `✅ Delivery available (${distance} miles from our location)`
                    : `❌ Sorry, we only deliver within ${this.maxDeliveryDistance} miles. You are ${distance} miles away.`,
                coords: customerCoords
            };

        } catch (error) {
            console.error('Delivery validation error:', error);
            return {
                valid: false,
                message: 'Invalid postcode. Please check and try again.',
                distance: null
            };
        }
    }

    // Format postcode to standard UK format
    formatPostcode(postcode) {
        if (!postcode) return '';
        
        const clean = postcode.replace(/\s+/g, '').toUpperCase();
        
        // UK postcode regex patterns
        const patterns = [
            /^([A-Z]{1,2}\d{1,2}[A-Z]?)(\d[A-Z]{2})$/, // Standard format
            /^([A-Z]{1,2}\d[A-Z])(\d[A-Z]{2})$/        // London format
        ];

        for (const pattern of patterns) {
            const match = clean.match(pattern);
            if (match) {
                return `${match[1]} ${match[2]}`;
            }
        }

        return postcode; // Return original if no match
    }

    // Get Leeds area postcodes for suggestions
    getLeedsAreaPostcodes() {
        return [
            'LS1', 'LS2', 'LS3', 'LS4', 'LS5', 'LS6', 'LS7', 'LS8', 'LS9', 'LS10',
            'LS11', 'LS12', 'LS13', 'LS14', 'LS15', 'LS16', 'LS17', 'LS18', 'LS19', 'LS20',
            'LS21', 'LS22', 'LS23', 'LS24', 'LS25', 'LS26', 'LS27', 'LS28', 'LS29'
        ];
    }
}

// Initialize delivery validator
const deliveryValidator = new DeliveryValidator();