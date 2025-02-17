// import { LatLngLiteral } from '@react-google-maps/api';

// type LatLngLiteral = google.maps.LatLngLiteral

interface coords {
    lat: number;
    lng: number;
}

export const getTravelTimeVenues = async (stationA: coords, stationB: coords, venues:any[], maxTravelTime:30) => {
    const service = new google.maps.DistanceMatrixService()
    const venueCoords = venues.map((venue) => ({
        lat: venue.latitude,
        lng: venue.longitude,
    }))

    const results = await service.getDistanceMatrix({
        origins: [stationA, stationB],
        destinations: venueCoords,
        travelMode: google.maps.TravelMode.TRANSIT,
        // transitOptions: {modes: ["rail", "train", "subway"]}
    })
    
    const filteredVenues = venues.filter((venue, index) =>{
        const timeFromStationA = results.rows[0].elements[index].duration.value / 60
        const timeFromStationB = results.rows[1].elements[index].duration.value / 60
        return timeFromStationA < maxTravelTime && timeFromStationB < maxTravelTime
    })

    return filteredVenues;
}