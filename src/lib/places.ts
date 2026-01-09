/**
 * Google Places API wrapper for restaurant search
 */

import type { PlacePrediction, PlaceDetails } from '../types'

const PLACES_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY

let autocompleteService: google.maps.places.AutocompleteService | null = null
let placesService: google.maps.places.PlacesService | null = null
let sessionToken: google.maps.places.AutocompleteSessionToken | null = null

/**
 * Initialize Google Places services
 * Must be called after Google Maps script is loaded
 */
export function initPlacesServices(): void {
  if (typeof google === 'undefined' || !google.maps?.places) {
    console.warn('Google Maps Places API not loaded')
    return
  }

  autocompleteService = new google.maps.places.AutocompleteService()

  // Create a hidden div for PlacesService (required by API)
  const div = document.createElement('div')
  div.style.display = 'none'
  document.body.appendChild(div)

  // PlacesService requires a map or div element
  placesService = new google.maps.places.PlacesService(div)

  // Create session token for billing optimization
  sessionToken = new google.maps.places.AutocompleteSessionToken()
}

/**
 * Reset session token (call after place selection)
 */
export function resetSessionToken(): void {
  if (typeof google !== 'undefined' && google.maps?.places) {
    sessionToken = new google.maps.places.AutocompleteSessionToken()
  }
}

/**
 * Search for restaurants using Places Autocomplete
 */
export async function searchRestaurants(query: string): Promise<PlacePrediction[]> {
  if (!autocompleteService) {
    initPlacesServices()
  }

  if (!autocompleteService || !query.trim()) {
    return []
  }

  return new Promise((resolve) => {
    autocompleteService!.getPlacePredictions(
      {
        input: query,
        types: ['restaurant', 'food', 'cafe', 'bar'],
        sessionToken: sessionToken || undefined,
      },
      (
        predictions: google.maps.places.AutocompletePrediction[] | null,
        status: google.maps.places.PlacesServiceStatus
      ) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !predictions) {
          resolve([])
          return
        }

        resolve(
          predictions.map((p: google.maps.places.AutocompletePrediction) => ({
            place_id: p.place_id,
            description: p.description,
            structured_formatting: {
              main_text: p.structured_formatting?.main_text || '',
              secondary_text: p.structured_formatting?.secondary_text || '',
            },
          }))
        )
      }
    )
  })
}

/**
 * Get place details by place_id
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  if (!placesService) {
    initPlacesServices()
  }

  if (!placesService) {
    return null
  }

  return new Promise((resolve) => {
    placesService!.getDetails(
      {
        placeId,
        fields: ['place_id', 'name', 'formatted_address', 'address_components'],
        sessionToken: sessionToken || undefined,
      },
      (
        place: google.maps.places.PlaceResult | null,
        status: google.maps.places.PlacesServiceStatus
      ) => {
        // Reset session token after place selection
        resetSessionToken()

        if (status !== google.maps.places.PlacesServiceStatus.OK || !place) {
          resolve(null)
          return
        }

        resolve({
          place_id: place.place_id || placeId,
          name: place.name || '',
          formatted_address: place.formatted_address || '',
          address_components: (place.address_components || []).map(
            (c: google.maps.GeocoderAddressComponent) => ({
              long_name: c.long_name,
              short_name: c.short_name,
              types: c.types,
            })
          ),
        })
      }
    )
  })
}

/**
 * Extract city from place details address components
 */
export function extractCityFromPlace(place: PlaceDetails): string {
  const cityComponent = place.address_components.find(
    (c) => c.types.includes('locality') || c.types.includes('sublocality')
  )

  if (cityComponent) {
    return cityComponent.long_name
  }

  // Fallback to administrative area
  const adminComponent = place.address_components.find((c) =>
    c.types.includes('administrative_area_level_1')
  )

  return adminComponent?.long_name || 'Unknown'
}

/**
 * Check if Google Places API is available
 */
export function isPlacesApiAvailable(): boolean {
  return typeof google !== 'undefined' && !!google.maps?.places && !!PLACES_API_KEY
}

/**
 * Load Google Maps script dynamically
 */
export function loadGoogleMapsScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof google !== 'undefined' && google.maps?.places) {
      resolve()
      return
    }

    if (!PLACES_API_KEY) {
      reject(new Error('Google Places API key not configured'))
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${PLACES_API_KEY}&libraries=places`
    script.async = true
    script.defer = true

    script.onload = () => {
      initPlacesServices()
      resolve()
    }

    script.onerror = () => {
      reject(new Error('Failed to load Google Maps script'))
    }

    document.head.appendChild(script)
  })
}
