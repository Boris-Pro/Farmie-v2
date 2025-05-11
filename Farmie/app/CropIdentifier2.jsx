import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Camera } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';
import config from '../config/config';

const CropIdentifier = () => {
  const cameraRef = useRef(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const isFocused = useIsFocused();

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      setImageUri(photo.uri);
    }
  };

  const uploadImage = async () => {
    if (!imageUri) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      name: 'crop.jpg',
      type: 'image/jpeg',
    });

    try {
      const response = await fetch(`${config.API_BASE_URL}/predict_crop`, {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const result = await response.json();
      if (response.ok) {
        Alert.alert('Prediction', `Crop: ${result.predicted_crop}\nConfidence: ${(result.confidence * 100).toFixed(2)}%`);
      } else {
        throw new Error(result.error || 'Prediction failed');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (hasPermission === null) {
    return <View style={styles.center}><Text>Requesting camera permission...</Text></View>;
  }

  if (hasPermission === false) {
    return <View style={styles.center}><Text>No access to camera.</Text></View>;
  }

  return (
    <View style={styles.container}>
      {isFocused && !imageUri && (
        <Camera
          ref={cameraRef}
          style={styles.camera}
          type={Camera.Constants.Type.back}
          ratio="16:9"
        />
      )}

      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.preview} />
      ) : null}

      <View style={styles.controls}>
        {imageUri ? (
          <>
            <TouchableOpacity style={styles.button} onPress={() => setImageUri(null)}>
              <Text style={styles.buttonText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={uploadImage}>
              <Text style={styles.buttonText}>Predict</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.button} onPress={takePicture}>
            <Text style={styles.buttonText}>Capture</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading && <ActivityIndicator size="large" color="#228B22" style={styles.loader} />}
    </View>
  );
};

export default CropIdentifier;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  camera: { flex: 1 },
  preview: {
    flex: 1,
    width: '100%',
    resizeMode: 'cover',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
  button: {
    backgroundColor: '#228B22',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
  },
});
