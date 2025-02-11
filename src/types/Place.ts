export interface PlaceGeometry {
  location: google.maps.LatLng
  viewport?: google.maps.LatLngBounds
}

export interface PlaceResult {
  geometry: PlaceGeometry
  name: string
  place_id: string
  rating?: number
  formatted_address?: string
  photos?: google.maps.places.PlacePhoto[]
  opening_hours?: {
    isOpen: () => boolean
    periods: any[]
    weekday_text: string[]
  }
  types?: string[]
  vicinity?: string
  price_level?: number
}
