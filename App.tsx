import React, {useRef, useState, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  PermissionsAndroid,
  Animated,
  Easing,
} from 'react-native';
import MapView, {
  PROVIDER_GOOGLE,
  Circle,
  Marker,
  Polygon,
} from 'react-native-maps';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import Geocoder from 'react-native-geocoding';
import Geolocation from '@react-native-community/geolocation';
import {GooglePlacesAutocomplete} from 'react-native-google-places-autocomplete';
import geolib from 'geolib';
import RippleEffect from './src/components/ripple';

const circleSize = 20;
const App = () => {
  const _mapView = useRef(null);
  const [marker, setMarker] = useState(null);
  const [geofence, setGeofence] = useState(null);
  const [loading, setLoading] = useState(false);

  const [scaleAnim] = useState(new Animated.Value(1)); // Initial scale value

  useEffect(() => {
    const pulse = () => {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 2, // Scale up animation
          duration: 1000, // Duration of the animation
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true, // Use native driver for better performance
        }),
        Animated.timing(scaleAnim, {
          toValue: 1, // Reset animation
          duration: 0, // Instantly
          useNativeDriver: true,
        }),
      ]).start(pulse); // Repeat animation
    };

    pulse(); // Start animation sequence

    return () => {
      scaleAnim.stopAnimation();
    };
  }, [scaleAnim]);

  const circleSize = 20;

  const [region, setRegion] = useState({
    latitude: 43.8012,
    longitude: -79.1902,
    latitudeDelta: 0.025,
    longitudeDelta: 0.025,
  });
  const FOOD = {
    latitude: 43.8112,
    longitude: -79.1902,
    latitudeDelta: 0.025,
    longitudeDelta: 0.025,
  };
  const MOVIE = {
    latitude: 43.9242,
    longitude: -79.1903,
    latitudeDelta: 0.025,
    longitudeDelta: 0.025,
  };
  const LEGO = {
    latitude: 44.0012,
    longitude: -79.1902,
    latitudeDelta: 0.025,
    longitudeDelta: 0.025,
  };
  const circleCenter = {latitude: 30.740925, longitude: 76.778988}; // Circle center coordinates
  const circleRadius = 50;
  const parray = [
    {latitude: 30.744, longitude: 76.784},
    {latitude: 30.7445, longitude: 76.7845},
    {latitude: 30.744, longitude: 76.785},
    {latitude: 30.7435, longitude: 76.7845},
  ];
  const _showLocation = location => {
    _mapView.current.animateToRegion(location, 1500);
  };

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
        if (_mapView.current) {
          _mapView.current.animateToRegion(newRegion, 1000);
        }
      },
      error => {
        console.log(error.code, error.message);
        setLoading(false);
      },
      {
        interval: 10000,
        fastestInterval: 5000,
        distanceFilter: 50,
      },
    );
  };

  const _zoomIn = () => {
    setRegion({
      ...region,
      latitudeDelta: 0.015,
      longitudeDelta: 0.015,
    });
  };

  const _zoomOut = () => {
    setRegion({
      ...region,
      latitudeDelta: 0.35,
      longitudeDelta: 0.35,
    });
  };

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

  console.log('Is inside circle:', isInsideCircle);

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
  console.log('Is inside polygon:', isInsidePolygon);

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        ref={_mapView}
        provider={PROVIDER_GOOGLE}
        region={region}
        style={styles.map}>
        <Marker coordinate={FOOD} />
        <Marker coordinate={MOVIE} />
        <Marker coordinate={LEGO} />
        <Marker coordinate={region}>
          <View
            style={{
              //backgroundColor: 'red',
              height: 20,
              width: 20,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <RippleEffect />
          </View>
        </Marker>
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
      <View style={styles.bottomContainer}>
        <View style={styles.btnContainer}>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => _showLocation(FOOD)}>
            <Text style={styles.btnText}>FOOD</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => _showLocation(MOVIE)}>
            <Text style={styles.btnText}>MOVIE</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => _showLocation(LEGO)}>
            <Text style={styles.btnText}>LEGO</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.btnContainer}>
          <TouchableOpacity style={styles.btn} onPress={_zoomIn}>
            <Text style={styles.btnText}>ZOOMIN</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={_zoomOut}>
            <Text style={styles.btnText}>ZOOMOUT</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => _showLocation(region)}>
            <Text style={styles.btnText}>curent</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
    height: hp('80%'),
  },
  bottomContainer: {
    flexDirection: 'column',
    width: wp('100%'),
    marginTop: hp('82%'),
  },
  btnContainer: {
    flexDirection: 'row',
    marginTop: hp('3%'),
  },
  btn: {
    width: wp('30%'),
    marginLeft: wp('8%'),
  },
  btnText: {
    color: 'red',
  },
  markerContainer: {
    width: 20,
    height: 20,
    borderRadius: 10, // Half of width or height to create a circle
    borderColor: 'blue', // Border color
  },
  circle: {
    position: 'absolute',
    width: circleSize,
    height: circleSize,
    borderRadius: circleSize / 2,
    backgroundColor: 'blue',
    opacity: 0.3, // Adjust the opacity of the expanding circle
  },
  innerCircle: {
    position: 'absolute',
    width: circleSize,
    height: circleSize,
    borderRadius: circleSize / 2,
    backgroundColor: 'blue',
    top: 5,
    left: 5, // Adjust the color of the inner circle
  },
  markerContainer1: {
    position: 'absolute',
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
