import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import config from '../config/config';

const AddFarm = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [name, setName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  useEffect(() => {
    if (params.latitude && params.longitude) {
      setLatitude(params.latitude.toString());
      setLongitude(params.longitude.toString());
    }
  }, [params]);

  const handleSubmit = async () => {
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (!name || isNaN(lat) || isNaN(lon)) {
      Alert.alert('Validation Error', 'Please fill in all fields with valid values.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('jwt_token');
      if (!token) {
        Alert.alert('Session expired', 'Please log in again.');
        router.push('/Login');
        return;
      }

      const res = await axios.post(
        `${config.API_BASE_URL}/add_farm`,
        { name, latitude: lat, longitude: lon },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert('Success', res.data.message);
      router.push('/Dashboard');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to add farm.');
    }
  };

  const handleOpenMap = () => {
    router.push('/SelectLocation');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Farm Name:</Text>
      <TextInput
        placeholder="Enter farm name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />

      <Text style={styles.label}>Latitude:</Text>
      <TextInput
        placeholder="Latitude"
        value={latitude}
        onChangeText={setLatitude}
        keyboardType="decimal-pad"
        style={styles.input}
      />

      <Text style={styles.label}>Longitude:</Text>
      <TextInput
        placeholder="Longitude"
        value={longitude}
        onChangeText={setLongitude}
        keyboardType="decimal-pad"
        style={styles.input}
      />

      <View style={styles.buttonGroup}>
        <Button title="Select on Map" onPress={handleOpenMap} />
        <Button title="Submit" onPress={handleSubmit} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  label: { fontSize: 16, marginVertical: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  buttonGroup: {
    marginTop: 20,
    flexDirection: 'column',
    gap: 10,
  },
});

export default AddFarm;
