/**
 * Maps/Location Verification Service
 * Uses OpenStreetMap Nominatim (free, no API key needed)
 */

import config from '../config.js';

export interface LocationData {
  displayName: string;
  country: string;
  countryCode: string;
  state?: string;
  city?: string;
  type: string;
  lat: number;
  lon: number;
}

export interface LocationResult {
  verified: boolean;
  locationData: LocationData | null;
  matchScore: number;
  confidence: number;
  details: {
    countryMatch: boolean;
    regionMatch: boolean;
    typeMatch: boolean;
    distanceKm?: number;
  };
}

export class MapsService {
  private readonly nominatimBaseUrl = 'https://nominatim.openstreetmap.org';
  private readonly userAgent = 'SalvationOracle/1.0';

  /**
   * Verify location exists and matches description
   */
  async verifyLocation(
    lat: number,
    lng: number,
    expectedDescription: string
  ): Promise<LocationResult> {
    console.log(`Verifying location: (${lat}, ${lng}) - ${expectedDescription}`);

    try {
      // Reverse geocode to get location details
      const locationData = await this.reverseGeocode(lat, lng);

      if (!locationData) {
        return {
          verified: false,
          locationData: null,
          matchScore: 0,
          confidence: 0,
          details: {
            countryMatch: false,
            regionMatch: false,
            typeMatch: false,
          },
        };
      }

      // Parse expected description for matching
      const expectedParts = this.parseDescription(expectedDescription);

      // Calculate match score
      const details = this.calculateMatchDetails(locationData, expectedParts);
      const matchScore = this.calculateMatchScore(details);
      const verified = matchScore >= config.verification.locationMatchThreshold;

      return {
        verified,
        locationData,
        matchScore,
        confidence: Math.round(matchScore * 100),
        details,
      };
    } catch (error) {
      console.error('Location verification error:', error);
      return {
        verified: false,
        locationData: null,
        matchScore: 0,
        confidence: 0,
        details: {
          countryMatch: false,
          regionMatch: false,
          typeMatch: false,
        },
      };
    }
  }

  /**
   * Search for a location by name
   */
  async searchLocation(query: string): Promise<LocationData[]> {
    const url = new URL(`${this.nominatimBaseUrl}/search`);
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('limit', '5');

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': this.userAgent,
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim search error: ${response.status}`);
    }

    const data = await response.json() as any[];

    return data.map((item: any) => this.parseNominatimResult(item));
  }

  /**
   * Get distance between two coordinates (Haversine formula)
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Check if location is near water (for water projects)
   */
  async checkNearWater(lat: number, lng: number): Promise<boolean> {
    try {
      // Search for water features nearby
      const searchRadius = 0.1; // ~10km at equator
      const query = `water near ${lat},${lng}`;
      const results = await this.searchLocation(query);

      // Check if any results are water-related
      const waterTypes = ['water', 'river', 'lake', 'stream', 'reservoir', 'well'];
      return results.some(r =>
        waterTypes.some(type => r.type.toLowerCase().includes(type))
      );
    } catch {
      return false;
    }
  }

  /**
   * Reverse geocode coordinates to get location details
   */
  private async reverseGeocode(lat: number, lng: number): Promise<LocationData | null> {
    const url = new URL(`${this.nominatimBaseUrl}/reverse`);
    url.searchParams.set('lat', lat.toString());
    url.searchParams.set('lon', lng.toString());
    url.searchParams.set('format', 'json');
    url.searchParams.set('addressdetails', '1');

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': this.userAgent,
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim reverse error: ${response.status}`);
    }

    const data = await response.json() as any;

    if (data.error) {
      return null;
    }

    return this.parseNominatimResult(data);
  }

  /**
   * Parse Nominatim API result into LocationData
   */
  private parseNominatimResult(result: any): LocationData {
    const address = result.address || {};

    return {
      displayName: result.display_name || '',
      country: address.country || '',
      countryCode: address.country_code?.toUpperCase() || '',
      state: address.state || address.region || address.province || '',
      city: address.city || address.town || address.village || address.municipality || '',
      type: result.type || result.class || '',
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
    };
  }

  /**
   * Parse expected location description
   */
  private parseDescription(description: string): {
    country?: string;
    region?: string;
    city?: string;
    keywords: string[];
  } {
    const lower = description.toLowerCase();
    const keywords: string[] = [];

    // Common African countries
    const countries: Record<string, string[]> = {
      Kenya: ['kenya', 'kenyan'],
      Nigeria: ['nigeria', 'nigerian'],
      Ethiopia: ['ethiopia', 'ethiopian'],
      Ghana: ['ghana', 'ghanaian'],
      Tanzania: ['tanzania', 'tanzanian'],
      Uganda: ['uganda', 'ugandan'],
      Rwanda: ['rwanda', 'rwandan'],
      'South Africa': ['south africa', 'south african'],
      Egypt: ['egypt', 'egyptian'],
      Morocco: ['morocco', 'moroccan'],
    };

    let country: string | undefined;
    for (const [name, patterns] of Object.entries(countries)) {
      if (patterns.some(p => lower.includes(p))) {
        country = name;
        break;
      }
    }

    // Extract region/city (words that might be place names)
    const words = description.split(/[,\s]+/).filter(w => w.length > 2);
    const potentialPlaces = words.filter(w => /^[A-Z]/.test(w));

    return {
      country,
      region: potentialPlaces[0],
      city: potentialPlaces[1],
      keywords: potentialPlaces,
    };
  }

  /**
   * Calculate match details between location data and expected description
   */
  private calculateMatchDetails(
    locationData: LocationData,
    expected: { country?: string; region?: string; city?: string; keywords: string[] }
  ): {
    countryMatch: boolean;
    regionMatch: boolean;
    typeMatch: boolean;
  } {
    const countryMatch =
      !expected.country ||
      locationData.country.toLowerCase().includes(expected.country.toLowerCase()) ||
      expected.country.toLowerCase().includes(locationData.country.toLowerCase());

    const regionMatch = Boolean(
      !expected.region ||
      locationData.displayName.toLowerCase().includes(expected.region.toLowerCase()) ||
      (locationData.state &&
        locationData.state.toLowerCase().includes(expected.region.toLowerCase())) ||
      (locationData.city &&
        locationData.city.toLowerCase().includes(expected.region.toLowerCase()))
    );

    // Type match - check if location type is appropriate
    const validTypes = ['place', 'village', 'town', 'city', 'administrative', 'residential'];
    const typeMatch = validTypes.some(
      t =>
        locationData.type.toLowerCase().includes(t) ||
        t.includes(locationData.type.toLowerCase())
    );

    return {
      countryMatch,
      regionMatch,
      typeMatch,
    };
  }

  /**
   * Calculate overall match score
   */
  private calculateMatchScore(details: {
    countryMatch: boolean;
    regionMatch: boolean;
    typeMatch: boolean;
  }): number {
    let score = 0;

    if (details.countryMatch) score += 0.5;
    if (details.regionMatch) score += 0.3;
    if (details.typeMatch) score += 0.2;

    return score;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

export default MapsService;
