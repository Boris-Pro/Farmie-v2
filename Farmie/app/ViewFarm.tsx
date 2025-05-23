import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config/config';
import { useFocusEffect } from '@react-navigation/native';

type Crop = {
  crop_name: string;
  crop_family: string;
  quantity: number;
};

type WeatherStats = {
  avgTemperature: number;
  avgHumidity: number;
  totalRainfall: number;
};

const getYearlyWeatherStats = async (
  latitude: number,
  longitude: number
): Promise<WeatherStats | null> => {
  try {
    const start_date = '2024-01-01';
    const end_date = '2024-12-31';

    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${start_date}&end_date=${end_date}&daily=temperature_2m_mean,precipitation_sum,relative_humidity_2m_mean&timezone=auto`;

    const response = await axios.get(url);
    const data = response.data.daily;

    const avgTemperature =
      data.temperature_2m_mean.reduce((sum: number, val: number) => sum + val, 0) /
      data.temperature_2m_mean.length;

    const avgHumidity =
      data.relative_humidity_2m_mean.reduce((sum: number, val: number) => sum + val, 0) /
      data.relative_humidity_2m_mean.length;

    const totalRainfall = data.precipitation_sum.reduce((sum: number, val: number) => sum + val, 0);

    return {
      avgTemperature: parseFloat(avgTemperature.toFixed(2)),
      avgHumidity: parseFloat(avgHumidity.toFixed(2)),
      totalRainfall: parseFloat(totalRainfall.toFixed(2)),
    };
  } catch (error) {
    console.error('Weather fetch error:', error);
    return null;
  }
};

const ViewFarm = () => {
  const { id, name, latitude, longitude } = useLocalSearchParams<{
    id: string;
    name: string;
    latitude: string;
    longitude: string;
  }>();

  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [weatherStats, setWeatherStats] = useState<WeatherStats | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const router = useRouter();

  const fetchCrops = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${config.API_BASE_URL}/get_crops_for_farm`, {
        params: { farm_id: id },
      });
      setCrops(res.data);
    } catch (error) {
      console.error('Failed to fetch crops', error);
      Alert.alert('Error', 'Failed to fetch crops. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFarm = async () => {
    const token = await AsyncStorage.getItem('jwt_token');
    if (!token) {
      Alert.alert('Error', 'You must be logged in to delete a farm.');
      return;
    }

    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this farm?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await axios.delete(`${config.API_BASE_URL}/delete_farm/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              Alert.alert('Success', 'Farm deleted successfully.');
              router.replace('/Dashboard');
            } catch (error) {
              console.error('Failed to delete farm:', error);
              Alert.alert('Error', 'Could not delete the farm.');
            }
          },
        },
      ]
    );
  };

  // Refresh crop list when the screen gains focus
  useFocusEffect(
    useCallback(() => {
      fetchCrops();
    }, [id])
  );

  useEffect(() => {
    if (latitude && longitude) {
      setWeatherLoading(true);
      getYearlyWeatherStats(parseFloat(latitude), parseFloat(longitude))
        .then((stats) => {
          if (stats) {
            setWeatherStats(stats);
            setWeatherError(null);
          } else {
            setWeatherError('Could not fetch weather data.');
          }
        })
        .catch(() => setWeatherError('Could not fetch weather data.'))
        .finally(() => setWeatherLoading(false));
    }
  }, [latitude, longitude]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{name}</Text>
      <Text style={styles.location}>
        Location: Latitude {latitude}, Longitude {longitude}
      </Text>

      {weatherLoading ? (
        <ActivityIndicator size="small" color="#4682B4" style={{ marginBottom: 10 }} />
      ) : weatherError ? (
        <Text style={[styles.loadingText, { color: 'red' }]}>{weatherError}</Text>
      ) : weatherStats && (
        <View style={styles.weatherCard}>
          <Text style={styles.weatherTitle}>Monthly- Weather Averages</Text>
          <Text style={styles.weatherText}>Avg Temp: {weatherStats.avgTemperature}°C</Text>
          <Text style={styles.weatherText}>Avg Humidity: {weatherStats.avgHumidity}%</Text>
          <Text style={styles.weatherText}>Total Rainfall: {weatherStats.totalRainfall} mm</Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#888" />
      ) : (
        <>
          <Text style={styles.subtitle}>Crops Being Cultivated:</Text>
          {crops.length === 0 ? (
            <Text style={styles.noCropsText}>No crops found for this farm.</Text>
          ) : (
            <FlatList
              data={crops}
              keyExtractor={(item, index) => `${item.crop_name}-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.cropCard}
                  onPress={() =>
                    router.push({
                      pathname: '/CropDetails',
                      params: {
                        cropName: item.crop_name,
                        cropFamily: item.crop_family,
                        quantity: item.quantity.toString(),
                        farmId: id,
                      },
                    } as any)
                  }
                >
                  <Text style={styles.cropName}>Crop: {item.crop_name}</Text>
                  <Text style={styles.cropQuantity}>Quantity: {item.quantity}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </>
      )}

      <TouchableOpacity
        style={styles.addCropButton}
        onPress={() =>
          router.push({
            pathname: '/AddCrop',
            params: { farm_id: String(id), farm_name: String(name) },
          } as any)
        }
      >
        <Text style={styles.buttonText}>Add Crop</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.recommendationButton}
        onPress={() =>
          router.push({
            pathname: '/CropIdentifier',
            params: {
              farmId: String(id),
              farmName: String(name),
            },
          } as any)
        }
      >
        <Text style={styles.buttonText}>Crop Recommendation</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteFarm}>
        <Text style={styles.buttonText}>Delete Farm</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#8B4513', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  location: { fontSize: 16, color: '#fff', marginBottom: 16, textAlign: 'center' },
  loadingText: { textAlign: 'center', fontSize: 16, color: '#888' },
  subtitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  noCropsText: { textAlign: 'center', fontSize: 16, color: '#888' },
  cropCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cropName: { fontSize: 18, fontWeight: 'bold' },
  cropQuantity: { fontSize: 16, color: '#444' },
  weatherCard: {
    backgroundColor: '#E0F7FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  weatherTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  weatherText: { fontSize: 16, color: '#333' },
  addCropButton: {
    backgroundColor: '#4682B4',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  recommendationButton: {
    backgroundColor: '#228B22',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#B22222',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ViewFarm;