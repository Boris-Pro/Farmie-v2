import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Button,
  Alert,
  ActivityIndicator,
  Text,
} from 'react-native';
import MapView, { Marker, MapPressEvent, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';

const SelectLocation = () => {
  const router = useRouter();
  const [marker, setMarker] = useState<{ latitude: number; longitude: number } | null>(null);
  const [initialRegion, setInitialRegion] = useState<Region | null>(null);

  useEffect(() => {
    const fetchLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to select a farm location.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setInitialRegion({
        latitude,
        longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    };

    fetchLocation();
  }, []);

  const handleMapPress = (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setMarker({ latitude, longitude });
  };

  const handleConfirm = () => {
    if (marker) {
      router.push({
        pathname: '/AddFarm',
        params: {
          latitude: marker.latitude.toString(),
          longitude: marker.longitude.toString(),
        },
      });
    }
  };

  if (!initialRegion) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#228B22" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        onPress={handleMapPress}
        initialRegion={initialRegion}
      >
        {marker && <Marker coordinate={marker} />}
      </MapView>

      {marker && (
        <View style={styles.infoContainer}>
          <Text style={styles.coordsText}>Latitude: {marker.latitude.toFixed(6)}</Text>
          <Text style={styles.coordsText}>Longitude: {marker.longitude.toFixed(6)}</Text>
          <Button title="Confirm Location" onPress={handleConfirm} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.75,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    padding: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  coordsText: {
    fontSize: 16,
    marginBottom: 8,
  },
});

export default SelectLocation;
