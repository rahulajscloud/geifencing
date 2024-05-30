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
} from 'react-native';
import MapView, {Marker} from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import Geocoder from 'react-native-geocoding';
import {GooglePlacesAutocomplete} from 'react-native-google-places-autocomplete';

// Initialize Geocoder with your API key
Geocoder.init('AIzaSyDlnkg_c16HeGFpMk-Ey9l51ZGKIJnLDyA'); // Replace with your actual Geocoding API key

function App(): React.JSX.Element {
  const mapRef = useRef(null);

  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const [marker, setMarker] = useState(null);

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

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      position => {
        const {latitude, longitude} = position.coords;
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
        if (mapRef.current) {
          mapRef.current.animateToRegion(newRegion, 1000);
        }
      },
      error => {
        console.log(error.code, error.message);
      },
      {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
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
      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 1000);
      }
    }
  };

  return (
    <SafeAreaView style={{flex: 1}}>
      <StatusBar barStyle="dark-content" backgroundColor="red" />

      <View style={styles.mapContainer}>
        <GooglePlacesAutocomplete
          placeholder="Enter an address"
          minLength={2}
          autoFocus={false}
          returnKeyType={'default'}
          fetchDetails={true}
          onPress={handlePlaceSelect}
          query={{
            key: 'AIzaSyDlnkg_c16HeGFpMk-Ey9l51ZGKIJnLDyA', // Replace with your actual Places API key
            language: 'en',
          }}
          styles={{
            container: styles.autocompleteContainer,
            textInputContainer: styles.textInputContainer,
            textInput: styles.textInput,
            listView: styles.listView,
          }}
        />
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
        </MapView>
        <View style={styles.buttonContainer}>
          <Button title="Zoom In" onPress={zoomIn} />
          <Button title="Zoom Out" onPress={zoomOut} />
        </View>
      </View>
    </SafeAreaView>
  );
}

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
    zIndex: 2,
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
