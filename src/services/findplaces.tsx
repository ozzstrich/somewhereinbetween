import { PlaceResult } from "../types/Place"

export const findPlacesBetweenStations = (
    mapRef: React.MutableRefObject<google.maps.Map | null>,
    searchBoxA: React.MutableRefObject<google.maps.places.SearchBox | null>,
    searchBoxB: React.MutableRefObject<google.maps.places.SearchBox | null>,
    searchPubs: boolean,
    searchRestaurants: boolean,
    setLocation: (location: google.maps.LatLngLiteral) => void,
    setMiddleStation: (station: string) => void,
    setIsLoading: (loading: boolean) => void,
    setPubs: (pubs: PlaceResult[]) => void
) => {
    if (!mapRef.current) return

    setPubs([])

    const placeA = searchBoxA.current?.getPlaces()?.[0]
    const placeB = searchBoxB.current?.getPlaces()?.[0]

    if (placeA && placeB) {
        setIsLoading(true)
        const latA = placeA.geometry?.location?.lat()
        const lngA = placeA.geometry?.location?.lng()
        const latB = placeB.geometry?.location?.lat()
        const lngB = placeB.geometry?.location?.lng()

        if (latA && lngA && latB && lngB) {
            const midLat = (latA + latB) / 2
            const midLng = (lngA + lngB) / 2

            setLocation({ lat: midLat, lng: midLng })
            setMiddleStation(`${placeA.name} ↔ ${placeB.name}`)
            mapRef.current.panTo({ lat: midLat, lng: midLng })

            const service = new window.google.maps.places.PlacesService(mapRef.current)

            let keywords = []
            if (searchPubs) keywords.push('pub')
            if (searchRestaurants) keywords.push('restaurant', 'bistro', 'food')

            const request: google.maps.places.PlaceSearchRequest = {
                location: { lat: midLat, lng: midLng },
                radius: 800,
                keyword: keywords.join('|'),
            }

            service.nearbySearch(request, (results, status, pagination) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                    setIsLoading(false)

                    const bounds = new window.google.maps.LatLngBounds()
                    bounds.extend({ lat: midLat, lng: midLng })

                    results.forEach(place => {
                        if (place.geometry?.location) {
                            bounds.extend(place.geometry.location)
                        }
                    })

                    mapRef.current?.fitBounds(bounds)
                    setPubs(results as PlaceResult[])
                }
            })
        }
    }
}
