import React, { useState, useRef } from 'react'
import { GoogleMap, LoadScript, Marker, StandaloneSearchBox } from '@react-google-maps/api'
import './App.css'
import { PlaceResult } from './types/Place'
import { scrollToPubCard } from './navigation'
import { createSearchBoxHandlers } from './components/searchbox'
import { findPlacesBetweenStations } from './services/findplaces'
import { getTravelTimeVenues, testTravelTime } from './services/public_transport'
import { useEffect } from 'react'


interface MapErrorBoundaryState {
  hasError: boolean
}

interface MapErrorBoundaryProps {
  children: React.ReactNode
}

class MapErrorBoundary extends React.Component<MapErrorBoundaryProps, MapErrorBoundaryState> {
  state: MapErrorBoundaryState = { hasError: false }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return <h2>Something went wrong with the map. Please try again.</h2>
    }
    return this.props.children
  }
}


function App(){


    // Add this at the top level of your App component
    useEffect(() => {
        (window as any).testTravelTime = testTravelTime
    }, [])

    const mapsApiKey: string = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || ''
    const [location, setLocation] = useState<google.maps.LatLngLiteral>({ lat: 51.5074, lng: -0.1278 })
    const [stationA, setStationA] = useState<string>('')
    const [stationB, setStationB] = useState<string>('')
    const [, setMiddleStation] = useState<string | null>(null)
    const [pubs, setPubs] = useState<PlaceResult[]>([])
    const [, setSelectedPlace] = useState<PlaceResult | null>(null)
    const [searchRestaurants, setSearchRestaurants] = useState<boolean>(false)
    const [searchPubs, setSearchPubs] = useState<boolean>(false)
    const [, setIsLoading] = useState<boolean>(false)
    const searchBoxA = useRef<google.maps.places.SearchBox | null>(null)
    const searchBoxB = useRef<google.maps.places.SearchBox | null>(null)
    const mapRef = useRef<google.maps.Map | null>(null)
    const mapStyles: React.CSSProperties = {
        height: "40vh",
        width: "100%",
        margin: "0 auto"
    }
    

    const onMapLoad = (map: google.maps.Map): void => {
        mapRef.current = map
    }

    const {
        onSearchBoxLoadA,
        onSearchBoxLoadB,
        onPlaceChangedA,
        onPlaceChangedB
    } = createSearchBoxHandlers(searchBoxA, searchBoxB, setStationA, setStationB)

    const findplaces = () => {
        findPlacesBetweenStations(
            mapRef,
            searchBoxA,
            searchBoxB,
            searchPubs,
            searchRestaurants,
            setLocation,
            setMiddleStation,
            setIsLoading,
            setPubs
        )
    }

        
    return (
        <div className="App">
            <h1>Somewhere In-Between 📍</h1>
            <MapErrorBoundary>
                <LoadScript
                    googleMapsApiKey={mapsApiKey}
                    libraries={["places"]}
                >
                    <div className="station-inputs">
                        <div className="station-inputs-row">
                            <StandaloneSearchBox
                                onLoad={onSearchBoxLoadA}
                                onPlacesChanged={onPlaceChangedA}
                            >
                                <input
                                    type="text"
                                    placeholder="Tube Station A"
                                    value={stationA}
                                    onChange={(e) => setStationA(e.target.value)}
                                    className="station-input"
                                />
                            </StandaloneSearchBox>

                            <StandaloneSearchBox
                                onLoad={onSearchBoxLoadB}
                                onPlacesChanged={onPlaceChangedB}
                            >
                                <input
                                    type="text"
                                    placeholder="Tube Station B"
                                    value={stationB}
                                    onChange={(e) => setStationB(e.target.value)}
                                    className="station-input"
                                />
                            </StandaloneSearchBox>
                        </div>

                        <div className="search-options">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={searchPubs}
                                    onChange={(e) => setSearchPubs(e.target.checked)}
                                />
                                Pubs
                            </label>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={searchRestaurants}
                                    onChange={(e) => setSearchRestaurants(e.target.checked)}
                                />
                                Restaurants
                            </label>
                        </div>

                        <button
                            onClick={findplaces}
                            disabled={!stationA || !stationB || (!searchPubs && !searchRestaurants)}
                            className="find-pubs-button"
                        >
                            Find Places
                        </button>
                    </div>                    
                    <GoogleMap
                        mapContainerStyle={mapStyles}
                        zoom={15}
                        center={location}
                        onLoad={onMapLoad}
                    >
                        {pubs.map((pub, index) => (
                            <Marker
                                key={index}
                                position={{
                                    lat: pub.geometry.location.lat(),
                                    lng: pub.geometry.location.lng()
                                }}
                                onClick={() => {
                                    setSelectedPlace(pub)
                                    scrollToPubCard(pub.place_id)
                                    mapRef.current?.panTo({
                                        lat: pub.geometry.location.lat(),
                                        lng: pub.geometry.location.lng()
                                    })
                                }}
                                title={pub.name}
                            />
                        ))}
                    </GoogleMap>
                </LoadScript>
            </MapErrorBoundary>
            {pubs.length > 0 && (
                <div className="pub-list">
                    <div className="central-station">
                        <h3>Places between: {stationA} ↔️ {stationB}</h3>
                    </div>
                    <div className="pub-grid">
                        {pubs.map((pub, index) => (
                            <div 
                                key={index} 
                                className="pub-card" 
                                id={`pub-card-${pub.place_id}`}
                                data-place-id={pub.place_id}
                            >
                                {pub.photos && (
                                    <img
                                        src={pub.photos[0].getUrl()}
                                        alt={pub.name}
                                        className="pub-image"
                                    />
                                )}
                                <h3>
                                    <a
                                        href={`https://www.google.com/maps/place/?q=place_id:${pub.place_id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className='pub-name'
                                    >
                                        {pub.name}
                                    </a>
                                </h3>
                                <p>{pub.rating || ''} ⭐</p>
                                <p>{pub.vicinity}</p>
                                <p>{pub.price_level ? '£'.repeat(pub.price_level) : ''}</p>
                                <div
                                    className="location-pin"
                                    onClick={() => {
                                        setSelectedPlace(pub)
                                        mapRef.current?.panTo({
                                            lat: pub.geometry.location.lat(),
                                            lng: pub.geometry.location.lng()
                                        })
                                        mapRef.current?.setZoom(16)
                                    }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    📍
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default App
