import React, {useState, useEffect, useRef} from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  Button,
  Image,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
} from 'react-native';
import MapView, {Circle, Marker, Polygon} from 'react-native-maps';

import Geocoder from 'react-native-geocoding';
import Geolocation from '@react-native-community/geolocation';
import {GooglePlacesAutocomplete} from 'react-native-google-places-autocomplete';
import geolib from 'geolib';

// Initialize Geocoder with your API key
Geocoder.init('AIzaSyDlnkg_c16HeGFpMk-Ey9l51ZGKIJnLDyA'); // Replace with your actual Geocoding API key

const App = () => {
  //  30.740925, 76.778988
  const [marker, setMarker] = useState(null);
  const circleCenter = {latitude: 30.740925, longitude: 76.778988}; // Circle center coordinates
  const circleRadius = 50;
  const parray = [
    {latitude: 30.744, longitude: 76.784},
    {latitude: 30.7445, longitude: 76.7845},
    {latitude: 30.744, longitude: 76.785},
    {latitude: 30.7435, longitude: 76.7845},
  ];
  const mapRef = useRef(null);

  const [region, setRegion] = useState(marker);

  const [geofence, setGeofence] = useState(null);
  const [loading, setLoading] = useState(false);
  //console.log(geofence);

  useEffect(() => {
    const requestLocationPermission = async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getCurrentLocation();
        } else {
          console.log('Location permission denied');
        }
      } else {
        getCurrentLocation();
      }
    };

    requestLocationPermission();
  }, []);

  const getCurrentLocation = async () => {
    setLoading(true);
    Geolocation.watchPosition(
      info => {
        console.log(info);
        const {latitude, longitude} = info.coords;
        console.log('dddd', latitude);
        const newRegion = {
          latitude,
          longitude,
          latitudeDelta: 0.01, // Adjust for better zoom level
          longitudeDelta: 0.01,
        };
        setRegion(newRegion);
        setMarker({
          latitude,
          longitude,
        });
        setGeofence({
          latitude,
          longitude,
          radius: 200,
        });
        setLoading(false);
        if (mapRef.current) {
          mapRef.current.animateToRegion(newRegion, 1000);
        }
      },
      error => {
        console.log(error.code, error.message);
        setLoading(false);
      },
    );
  };

  const zoomIn = () => {
    const newRegion = {
      ...region,
      latitudeDelta: region.latitudeDelta / 2,
      longitudeDelta: region.longitudeDelta / 2,
    };
    setRegion(newRegion);
    if (mapRef.current) {
      mapRef.current.animateToRegion(newRegion, 1000);
    }
  };

  const zoomOut = () => {
    const newRegion = {
      ...region,
      latitudeDelta: region.latitudeDelta * 2,
      longitudeDelta: region.longitudeDelta * 2,
    };
    setRegion(newRegion);
    if (mapRef.current) {
      mapRef.current.animateToRegion(newRegion, 1000);
    }
  };

  const handlePlaceSelect = (data, details) => {
    if (details) {
      const location = details.geometry.location;
      const newRegion = {
        latitude: location.lat,
        longitude: location.lng,
        latitudeDelta: 0.01, // Adjust for better zoom level after selection
        longitudeDelta: 0.01,
      };
      setRegion(newRegion);
      setMarker({
        latitude: location.lat,
        longitude: location.lng,
      });
      setGeofence({
        latitude: location.lat,
        longitude: location.lng,
        radius: 1000,
      });
      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 1000);
      }
    }
  };
  // useEffect(() => {
  //   if (isInsideGeofence()) {
  //     console.log('Inside the geofence');
  //   } else {
  //     console.log('Outside the geofence');
  //   }
  // }, [marker]);

  // const isInsideGeofence = () => {
  //   if (marker) {
  //     const distance = geolib.getDistance(
  //       {latitude: marker.latitude, longitude: marker.longitude},
  //       circleCenter,
  //     );
  //     return distance <= circleRadius;
  //   }
  //   return false;
  // };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180; // Convert latitudes to radians
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180; // Difference in latitudes
    const Δλ = ((lon2 - lon1) * Math.PI) / 180; // Difference in longitudes

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c; // Distance in meters
    return distance;
  };

  // Example usage:
  const lat1 = circleCenter.latitude; // Latitude of circle center
  const lon1 = circleCenter.longitude; // Longitude of circle center
  const radius = circleRadius; // Radius of circle in meters

  const lat2 = marker?.latitude; // Latitude of marker
  const lon2 = marker?.longitude; // Longitude of marker

  const distance = calculateDistance(lat1, lon1, lat2, lon2);

  // Check if the marker is inside the circle
  const isInsideCircle = distance <= radius;

  // console.log('Is inside circle:', isInsideCircle);

  const isPointInPolygon = (point, polygon) => {
    let x = point?.latitude,
      y = point?.longitude;

    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      let xi = polygon[i].latitude,
        yi = polygon[i].longitude;
      let xj = polygon[j].latitude,
        yj = polygon[j].longitude;

      let intersect =
        yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }

    return inside;
  };

  // Example usage:
  const point = marker;
  const polygon = [
    {latitude: 30.744, longitude: 76.784},
    {latitude: 30.7445, longitude: 76.7845},
    {latitude: 30.744, longitude: 76.785},
    {latitude: 30.7435, longitude: 76.7845},
  ];

  const isInsidePolygon = isPointInPolygon(point, polygon);
  //console.log('Is inside polygon:', isInsidePolygon);

  return (
    <SafeAreaView style={{flex: 1}}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" />
      <ActivityIndicator animating={loading} />
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          region={region}
          mapType="standard"
          onRegionChangeComplete={setRegion}>
          {marker && (
            <Marker coordinate={marker}>
              <Image
                source={require('./src/assets/place.png')} // Ensure the path is correct
                style={styles.customMarker}
              />
            </Marker>
          )}
          <Circle
            center={{
              latitude: circleCenter.latitude,
              longitude: circleCenter.longitude,
            }}
            radius={circleRadius}
            fillColor="rgba(255, 0, 0, 0.2)" // Red color with 50% opacity
          />
          <Polygon
            coordinates={parray}
            strokeColor="#000" // Outline color
            fillColor="rgba(0, 200, 0, 0.5)" // Fill color with opacity
            strokeWidth={1}
          />
        </MapView>
        <View style={styles.buttonContainer}>
          <Button title="Zoom In" onPress={zoomIn} />
          <Button title="Zoom Out" onPress={zoomOut} />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    zIndex: 0,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  autocompleteContainer: {
    position: 'absolute',
    top: 10,
    width: '100%',
    zIndex: 1,
  },
  textInputContainer: {
    width: '100%',
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderBottomWidth: 0,
  },
  textInput: {
    height: 40,
    backgroundColor: 'white',
    fontSize: 18,
    paddingLeft: 10,
    borderRadius: 10,
    color: 'black',
  },
  listView: {
    backgroundColor: 'white',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    bottom: 20,
    left: '25%',
    right: '25%',
    backgroundColor: 'rgba(255, 255, 255, 0.7)', // Background color to make buttons more visible
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  customMarker: {
    width: 50,
    height: 50,
  },
});

export default App;
