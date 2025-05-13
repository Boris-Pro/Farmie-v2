import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config/config';

type Crop = {
  crop_name: string;
  crop_family: string;
};

const AddCrop = () => {
  const { farm_id, farm_name } = useLocalSearchParams<{ farm_id: string; farm_name?: string }>();
  const [availableCrops, setAvailableCrops] = useState<Crop[]>([]);
  const [selectedCrop, setSelectedCrop] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const router = useRouter();

  useEffect(() => {
    const fetchCrops = async () => {
      try {
        const res = await axios.get(`${config.API_BASE_URL}/get_all_crops`);
        setAvailableCrops(res.data);
      } catch (err) {
        console.error(err);
        Alert.alert('Error', 'Failed to fetch crop list.');
      } finally {
        setLoading(false);
      }
    };
    fetchCrops();
  }, []);

  const handleAddCrop = async () => {
    if (!selectedCrop || !quantity) {
      Alert.alert('Missing Info', 'Please select a crop and enter quantity.');
      return;
    }

    const cropExists = availableCrops.some(c => c.crop_name === selectedCrop);
    if (!cropExists) {
      Alert.alert('Invalid Crop', 'Selected crop is not in the list.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('jwt_token');
      if (!token) {
        Alert.alert('Session expired', 'Please log in again.');
        router.push('/Login');
        return;
      }

      await axios.post(
        `${config.API_BASE_URL}/add_crop_to_farm`,
        {
          crop_name: selectedCrop,
          quantity: parseInt(quantity),
          farm_id: parseInt(farm_id),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Alert.alert('Success', 'Crop added to the farm.');
      router.back();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not add crop to the farm.');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Crop to {farm_name || 'Farm'}</Text>

      <Text style={styles.label}>Select a Crop:</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedCrop}
          onValueChange={(itemValue) => setSelectedCrop(itemValue)}
        >
          <Picker.Item label="-- Choose a crop --" value="" />
          {availableCrops.map((crop) => (
            <Picker.Item key={crop.crop_name} label={crop.crop_name} value={crop.crop_name} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Quantity (lbs per month yield):</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="Enter quantity"
        value={quantity}
        onChangeText={setQuantity}
      />

      <TouchableOpacity style={styles.addButton} onPress={handleAddCrop}>
        <Text style={styles.buttonText}>Add Crop</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F9F9F9' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 16, marginBottom: 8 },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  addButton: {
    backgroundColor: '#228B22',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default AddCrop;
