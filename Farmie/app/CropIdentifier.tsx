import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config/config';

const CropIdentifier = () => {
  const [image, setImage] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [predictionResult, setPredictionResult] = useState<string>('');
  const [recommendations, setRecommendations] = useState<string[]>([]);
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
    setRecommendations([]);

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

   
      const familyResponse = await axios.get(`${config.API_BASE_URL}/crop_family`, {
        params: { crop_name: predicted_crop },
        headers: { Authorization: `Bearer ${token}` },
      });

      const { crop_family } = familyResponse.data;


      setPredictionResult(`Pioneer Plant: ${predicted_crop}\nPioneer Plant Family: ${crop_family}\nConfidence: ${confidence}`);
    } catch (error) {
      setPredictionResult('Error: Something went wrong. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecommendation = async () => {
    const token = await AsyncStorage.getItem('jwt_token');
    if (!token) {
      Alert.alert('Authentication error', 'Please log in again.');
      return;
    }

    const cropName = predictionResult.split('\n')[0]?.replace('Pioneer Plant: ', '');
    console.log('Sending crop name:', JSON.stringify(cropName));
    console.log('Sending farm id:', JSON.stringify(farmId));
    if (!cropName || !farmId) {
      Alert.alert('Error', 'Make sure the crop is analyzed and farm is selected.');
      return;
    }

    try {
      const response = await axios.get(`${config.API_BASE_URL}/crop_recommendation`, {
  params: {
    crop_name: cropName,
    farm_id: farmId,
  },
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

      setRecommendations(response.data.recommendations);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch recommendations.');
      console.error(error);
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

      {loading && <ActivityIndicator size="large" color="#228B22" style={{ marginTop: 15 }} />}

      {predictionResult ? (
        <View style={styles.resultContainer}>
          {predictionResult.split('\n').map((line, idx) => (
            <Text key={idx} style={styles.resultText}>{line}</Text>
          ))}
        </View>
      ) : null}

      {predictionResult && (
        <TouchableOpacity style={styles.recommendButton} onPress={handleRecommendation}>
          <Text style={styles.recommendText}>Get Recommendation</Text>
        </TouchableOpacity>
      )}

      {recommendations.length > 0 && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>Recommended crops that will thrive in similar environment:</Text>
          {recommendations.map((crop, idx) => (
            <Text key={idx} style={styles.resultText}>• {crop}</Text>
          ))}
        </View>
      )}
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
  recommendButton: {
    backgroundColor: '#556B2F',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  recommendText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  resultContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'left',
  },
  resultText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default CropIdentifier;
