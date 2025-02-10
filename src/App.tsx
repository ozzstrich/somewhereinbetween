import React, { useState, useRef } from 'react';
import { GoogleMap, LoadScript, Marker, StandaloneSearchBox } from '@react-google-maps/api';
import './App.css';
import { PlaceResult } from './types/Place';

interface MapErrorBoundaryState {
  hasError: boolean;
}

interface MapErrorBoundaryProps {
  children: React.ReactNode;
}

class MapErrorBoundary extends React.Component<MapErrorBoundaryProps, MapErrorBoundaryState> {
  state: MapErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): MapErrorBoundaryState {
    return { hasError: true };
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return <h2>Something went wrong with the map. Please try again.</h2>;
    }
    return this.props.children;
  }
}

function App(){
    const mapsApiKey: string = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';
    const [location, setLocation] = useState<google.maps.LatLngLiteral>({ lat: 51.5074, lng: -0.1278 });
    const [stationA, setStationA] = useState<string>('');
    const [stationB, setStationB] = useState<string>('');
    const [, setMiddleStation] = useState<string | null>(null);
    const [pubs, setPubs] = useState<PlaceResult[]>([]);
    const [, setSelectedPlace] = useState<PlaceResult | null>(null);
    const [searchRestaurants, setSearchRestaurants] = useState<boolean>(false);
    const [searchPubs, setSearchPubs] = useState<boolean>(false);
    const [, setIsLoading] = useState<boolean>(false);
    const searchBoxA = useRef<google.maps.places.SearchBox | null>(null);
    const searchBoxB = useRef<google.maps.places.SearchBox | null>(null);
    const mapRef = useRef<google.maps.Map | null>(null);
    const mapStyles: React.CSSProperties = {
        height: "40vh",
        width: "100%",
        margin: "0 auto"
    };

    const onMapLoad = (map: google.maps.Map): void => {
        mapRef.current = map;
    };

    const onSearchBoxLoadA = (ref: google.maps.places.SearchBox): void => {
        searchBoxA.current = ref;
        const bounds = new google.maps.LatLngBounds(
            new google.maps.LatLng(51.3, -0.5), // SW corner of London
            new google.maps.LatLng(51.7, 0.2)   // NE corner of London
        );

        const options: google.maps.places.SearchBoxOptions = {
            bounds: bounds
        };

        ref.setBounds(bounds);
    };

    const onSearchBoxLoadB = (ref: google.maps.places.SearchBox): void => {
        searchBoxB.current = ref;
        const bounds = new google.maps.LatLngBounds(
            new google.maps.LatLng(51.3, -0.5), // SW corner of London
            new google.maps.LatLng(51.7, 0.2)   // NE corner of London
        );

        const options: google.maps.places.SearchBoxOptions = {
            bounds: bounds
        };

        ref.setBounds(bounds);
    };


    const onPlaceChangedA = () => {
        try {
            const places = searchBoxA.current?.getPlaces();
            if (places && places.length > 0) {
                setStationA(places[0].name || '');
            }
        } catch (error) {
            console.log('Station A search error:', error);
        }
    };

    const onPlaceChangedB = () => {
        try {
            const places = searchBoxB.current?.getPlaces();
            if (places && places.length > 0) {
                setStationB(places[0].name || '');
            }
        } catch (error) {
            console.log('Station B search error:', error);
        }
    };

    const findPlacesBetweenStations = () => {
        if (!mapRef.current) return;

        setPubs([]);

        const placeA = searchBoxA.current?.getPlaces()?.[0];
        const placeB = searchBoxB.current?.getPlaces()?.[0];

        if (placeA && placeB) {
            setIsLoading(true);
            const latA = placeA.geometry?.location?.lat();
            const lngA = placeA.geometry?.location?.lng();
            const latB = placeB.geometry?.location?.lat();
            const lngB = placeB.geometry?.location?.lng();

            if (latA && lngA && latB && lngB) {
                const midLat = (latA + latB) / 2;
                const midLng = (lngA + lngB) / 2;

                setLocation({ lat: midLat, lng: midLng });
                setMiddleStation(`${placeA.name} ↔ ${placeB.name}`);
                mapRef.current.panTo({ lat: midLat, lng: midLng });

                const service = new window.google.maps.places.PlacesService(mapRef.current);
                
                let keywords = [];
                if (searchPubs) keywords.push('pub');
                if (searchRestaurants) keywords.push('restaurant', 'bistro', 'food');
                
                const request: google.maps.places.PlaceSearchRequest = {
                    location: { lat: midLat, lng: midLng },
                    radius: 800,
                    keyword: keywords.join('|'),
                };

                service.nearbySearch(request, (results, status, pagination) => {
                    if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                        setIsLoading(false);
                        
                        const bounds = new window.google.maps.LatLngBounds();    
                        bounds.extend({ lat: midLat, lng: midLng });
                    
                        results.forEach(place => {
                            if (place.geometry?.location) {
                                bounds.extend(place.geometry.location);
                            }
                        });
                        
                        mapRef.current?.fitBounds(bounds);
                        setPubs(results as PlaceResult[]);                        
                    }
                });
            }
        }
    };           
    const scrollToPubCard = (pubId: string) => {
        const element = document.getElementById(`pub-card-${pubId}`);
        if (element) {
            element.scrollIntoView({ 
                behavior: 'smooth',
                block: 'center'
            });
            element.classList.add('highlighted');
            setTimeout(() => element.classList.remove('highlighted'), 2000);
        }
    };

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
                            onClick={() => findPlacesBetweenStations()}
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
                                    });
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
                                        setSelectedPlace(pub);
                                        mapRef.current?.panTo({
                                            lat: pub.geometry.location.lat(),
                                            lng: pub.geometry.location.lng()
                                        });
                                        mapRef.current?.setZoom(16);
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
    );
}

export default App;