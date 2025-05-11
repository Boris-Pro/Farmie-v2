import React, { useEffect, useState } from 'react';
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
import config from '../config/config';

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

  useEffect(() => {
    fetchCrops();
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
  }, [id, latitude, longitude]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{name}</Text>
      <Text style={styles.location}>
        Location: Latitude {latitude}, Longitude {longitude}
      </Text>

      {/* Weather Info */}
      {weatherLoading ? (
        <ActivityIndicator size="small" color="#4682B4" style={{ marginBottom: 10 }} />
      ) : weatherError ? (
        <Text style={[styles.loadingText, { color: 'red' }]}>{weatherError}</Text>
      ) : weatherStats && (
        <View style={styles.weatherCard}>
          <Text style={styles.weatherTitle}>Yearly Weather Averages</Text>
          <Text style={styles.weatherText}>Avg Temp: {weatherStats.avgTemperature}°C</Text>
          <Text style={styles.weatherText}>Avg Humidity: {weatherStats.avgHumidity}%</Text>
          <Text style={styles.weatherText}>Total Rainfall: {weatherStats.totalRainfall} mm</Text>
        </View>
      )}

      {/* Crop Info */}
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
                <View style={styles.cropCard}>
                  <Text style={styles.cropName}>Crop: {item.crop_name}</Text>
                  <Text style={styles.cropQuantity}>Quantity: {item.quantity}</Text>
                </View>
              )}
            />
          )}
        </>
      )}

      {/* Add Crop Button */}
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

      {/* Crop Recommendation Button */}
      <TouchableOpacity
        style={styles.recommendationButton}
        onPress={() => router.push({ pathname: '/CropIdentifier' } as any)}
      >
        <Text style={styles.buttonText}>Crop Recommendation</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F0F0', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  location: { fontSize: 16, color: '#444', marginBottom: 16, textAlign: 'center' },
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
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ViewFarm;
