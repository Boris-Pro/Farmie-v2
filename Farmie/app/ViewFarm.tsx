import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router'; //  useRouter for navigation
import config from '../config/config';

type Crop = {
  crop_name: string;
  crop_family: string;
  quantity: number;
};

const ViewFarm = () => {
  const { id, name, latitude, longitude } = useLocalSearchParams();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter(); // Correct navigation hook for expo-router

  const fetchCrops = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${config.API_BASE_URL}/get_crops_for_farm/${id}`);
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
  }, [id]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{name}</Text>
      <Text style={styles.location}>Location: Latitude {latitude}, Longitude {longitude}</Text>

      {loading ? (
        <Text style={styles.loadingText}>Loading crops...</Text>
      ) : (
        <>
          <Text style={styles.subtitle}>Crops Being Cultivated:</Text>
          {crops.length === 0 ? (
            <Text style={styles.noCropsText}>No crops found for this farm.</Text>
          ) : (
            <FlatList
              data={crops}
              keyExtractor={(item) => item.crop_name}
              renderItem={({ item }) => (
                <View style={styles.cropCard}>
                  <Text style={styles.cropName}>{item.crop_name}</Text>
                  <Text style={styles.cropFamily}>Family: {item.crop_family}</Text>
                  <Text style={styles.cropQuantity}>Quantity: {item.quantity}</Text>
                </View>
              )}
            />
          )}
        </>
      )}

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
  cropFamily: { fontSize: 16, color: '#444' },
  cropQuantity: { fontSize: 16, color: '#444' },
  recommendationButton: {
    backgroundColor: '#228B22',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ViewFarm;
