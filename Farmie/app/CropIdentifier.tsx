import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config/config';

const CropIdentifier = () => {
  const [image, setImage] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [predictionResult, setPredictionResult] = useState<string>(''); // State for prediction result
  const router = useRouter();
  const { farmId, farmName } = useLocalSearchParams();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
    });
    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const takeImage = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      base64: true,
    });
    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (!image) {
      setPredictionResult("Error: Please select an image first.");
      return;
    }

    const formData = new FormData();
    formData.append('image', {
      uri: image.uri,
      name: 'crop.jpg',
      type: 'image/jpeg',
    } as any);

    setLoading(true);
    setPredictionResult('');

    try {
      const token = await AsyncStorage.getItem('jwt_token');
      if (!token) {
        setPredictionResult('Authentication error: Please log in again.');
        return;
      }

      const response = await axios.post(`${config.API_BASE_URL}/predict_crop`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      const { predicted_crop, confidence } = response.data;
      setPredictionResult(`Crop: ${predicted_crop}\nConfidence: ${confidence}`);
    } catch (error) {
      setPredictionResult('Error: Something went wrong. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image.uri }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text>Pick an Image</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={takeImage} style={styles.cameraButton}>
        <Text style={styles.cameraButtonText}>Take a Photo</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.submit} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.submitText}>Analyze Crop</Text>
      </TouchableOpacity>

      {/* Loading Spinner */}
      {loading && <ActivityIndicator size="large" color="#228B22" style={{ marginTop: 15 }} />}

      {/* Display the prediction result */}
      {predictionResult ? (
        <View style={styles.resultContainer}>
          {predictionResult.split('\n').map((line, idx) => (
            <Text key={idx} style={styles.resultText}>{line}</Text>
          ))}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1 },
  image: { width: '100%', height: 200, borderRadius: 8, marginBottom: 10 },
  imagePlaceholder: {
    height: 200, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center', marginBottom: 10, borderRadius: 8,
  },
  cameraButton: {
    backgroundColor: '#4682B4',
    padding: 10,
    marginBottom: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cameraButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  submit: {
    backgroundColor: '#228B22',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitText: { color: '#fff', fontWeight: 'bold' },
  resultContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  resultText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default CropIdentifier;
