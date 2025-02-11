import { LONDON_BOUNDS } from "../constants/mapBoundaries"


interface SearchBoxHandlers {
    onSearchBoxLoadA: (ref: google.maps.places.SearchBox) => void
    onSearchBoxLoadB: (ref: google.maps.places.SearchBox) => void
    onPlaceChangedA: () => void
    onPlaceChangedB: () => void
}

export const createSearchBoxHandlers = (
    searchBoxA: React.MutableRefObject<google.maps.places.SearchBox | null>,
    searchBoxB: React.MutableRefObject<google.maps.places.SearchBox | null>,
    setStationA: (station: string) => void,
    setStationB: (station: string) => void
): SearchBoxHandlers => {
    const onSearchBoxLoadA = (ref: google.maps.places.SearchBox): void => {
        searchBoxA.current = ref
        const bounds = new google.maps.LatLngBounds(
            new google.maps.LatLng(LONDON_BOUNDS.SW.lat, LONDON_BOUNDS.SW.lng),
            new google.maps.LatLng(LONDON_BOUNDS.NE.lat, LONDON_BOUNDS.NE.lng)
        )
        ref.setBounds(bounds)
    }

    const onSearchBoxLoadB = (ref: google.maps.places.SearchBox): void => {
        searchBoxB.current = ref
        const bounds = new google.maps.LatLngBounds(
            new google.maps.LatLng(LONDON_BOUNDS.SW.lat, LONDON_BOUNDS.SW.lng),
            new google.maps.LatLng(LONDON_BOUNDS.NE.lat, LONDON_BOUNDS.NE.lng)
        )
        ref.setBounds(bounds)
    }

    const onPlaceChangedA = () => {
        try {
            const places = searchBoxA.current?.getPlaces()
            if (places && places.length > 0) {
                setStationA(places[0].name || '')
            }
        } catch (error) {
            console.log('Station A search error:', error)
        }
    }

    const onPlaceChangedB = () => {
        try {
            const places = searchBoxB.current?.getPlaces()
            if (places && places.length > 0) {
                setStationB(places[0].name || '')
            }
        } catch (error) {
            console.log('Station B search error:', error)
        }
    }

    return {
        onSearchBoxLoadA,
        onSearchBoxLoadB,
        onPlaceChangedA,
        onPlaceChangedB
    }
}
