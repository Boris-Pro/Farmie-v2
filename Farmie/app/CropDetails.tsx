import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import config from '../config/config';

const CropDetails = () => {
  const { cropName, cropFamily, quantity, farmId } = useLocalSearchParams<{
    cropName: string;
    cropFamily: string;
    quantity: string;
    farmId: string;
  }>();

  const router = useRouter();
  const [newQuantity, setNewQuantity] = useState(quantity || '');

  const handleDeleteCrop = async () => {
    try {
      await axios.delete(`${config.API_BASE_URL}/delete_crop_from_farm`, {
        params: {
          farm_id: farmId,
          crop_name: cropName,
        },
      });
      Alert.alert('Success', 'Crop deleted successfully.');
      router.back(); // Go back to the ViewFarm screen
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to delete crop.');
    }
  };

  const handleUpdateQuantity = async () => {
    try {
      const parsedQuantity = parseInt(newQuantity);
      if (isNaN(parsedQuantity) || parsedQuantity < 0) {
        Alert.alert('Error', 'Please enter a valid quantity.');
        return;
      }

      await axios.put(`${config.API_BASE_URL}/update_crop_quantity`, {
        farm_id: farmId,
        crop_name: cropName,
        new_quantity: parsedQuantity,
      });

      Alert.alert('Success', 'Quantity updated successfully.');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to update quantity.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crop Details</Text>
      <Text style={styles.detail}>Crop Name: {cropName}</Text>
      <Text style={styles.detail}>Crop Family: {cropFamily}</Text>

      <Text style={styles.detail}>Quantity:</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={newQuantity}
        onChangeText={setNewQuantity}
      />

      <TouchableOpacity style={styles.updateButton} onPress={handleUpdateQuantity}>
        <Text style={styles.buttonText}>Update Quantity</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteCrop}>
        <Text style={styles.buttonText}>Delete Crop</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F0F0F0' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
  detail: { fontSize: 18, marginVertical: 6 },
  input: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    borderColor: '#ccc',
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 10,
  },
  updateButton: {
    backgroundColor: '#4682B4',
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#B22222',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default CropDetails;