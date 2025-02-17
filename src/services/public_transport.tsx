interface coords {
    lat: number
    lng: number
}


export const findNearbyVenues = async (station: coords) => {
    const service = new google.maps.places.PlacesService(document.createElement('div'))
    
    const request = {
        location: station,
        radius: 500,
        type: ['bar', 'restaurant', 'cafe']
    }
    
    return new Promise((resolve, reject) => {
        service.nearbySearch({
            ...request,
            type: request.type[0]
        }, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                const venues = results.map(place => ({
                    latitude: place.geometry?.location?.lat() ?? 0,
                    longitude: place.geometry?.location?.lng() ?? 0,
                    name: place.name ?? '',
                }))
                resolve(venues)
            } else {
                reject(status)
            }
        })
    })}

    
export const getTravelTimeVenues = async (stationA: coords, stationB: coords) => {
    const nearbyVenuesA = await findNearbyVenues(stationA)
    const nearbyVenuesB = await findNearbyVenues(stationB)
    
    const allNearbyVenues = Array.from(new Set([...nearbyVenuesA as any[], ...nearbyVenuesB as any[]])).slice(0, 10)  // temp limit to 10 venues
    
    const service = new google.maps.DistanceMatrixService()
    const venueCoords = allNearbyVenues.map((venue: any) => ({
        lat: venue.latitude,
        lng: venue.longitude,
    }))

    console.log(venueCoords)

    const results = await service.getDistanceMatrix({
        origins: [stationA, stationB],
        destinations: venueCoords,
        travelMode: google.maps.TravelMode.TRANSIT
    })

    const filteredVenues = allNearbyVenues.filter((venue: any, index: number) => {
        const timeFromStationA = results.rows[0].elements[index].duration.value / 60
        const timeFromStationB = results.rows[1].elements[index].duration.value / 60
        return timeFromStationA < 30 && timeFromStationB < 30
    })
    console.log("filteredVenues: ", filteredVenues)
    return filteredVenues
}


export const testTravelTime = () => {
    const testStationA = { lat: 51.5007, lng: -0.1246 }
    const testStationB = { lat: 51.5074, lng: -0.1278 }
    getTravelTimeVenues(testStationA, testStationB)
        .then(results => console.log('Filtered venues:', results))
}

     (window as any).testTravelTime = testTravelTime
