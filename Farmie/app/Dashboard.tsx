import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config/config';

type Farm = {
  id: number;
  name: string;
  longitude: number;
  latitude: number;
};

const Dashboard = () => {
  const router = useRouter();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchFarms = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('jwt_token');
      if (!token) {
        Alert.alert('Session expired', 'Please login again');
        router.push('/Login');
        return;
      }

      const res = await axios.get(`${config.API_BASE_URL}/get_farms_by_user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('API Response:', res.data);

      if (res.data.length === 0) {
        Alert.alert('No Farms', 'You currently have no farms.');
      }

      setFarms(res.data);
    } catch (error) {
      console.error('Failed to fetch farms', error);
      Alert.alert('Error', 'Failed to fetch farms. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('jwt_token');
      router.push('/Login');
    } catch (error) {
      console.error('Logout failed', error);
      Alert.alert('Error', 'Logout failed. Please try again.');
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchFarms();
    }, [])
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <Text style={styles.loadingText}>Loading farms...</Text>
      ) : (
        <FlatList
          data={farms}
          keyExtractor={(item) => item.id ? item.id.toString() : '0'}
          ListEmptyComponent={
            <Text style={styles.noFarmsText}>You have no farms yet.</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push({
                pathname: '/ViewFarm',
                params: {
                  id: item.id,
                  name: item.name,
                  latitude: item.latitude.toString(),
                  longitude: item.longitude.toString(),
                },
              })}
            >
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.location}>Longitude: {item.longitude}</Text>
              <Text style={styles.location}>Latitude: {item.latitude}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity style={styles.addButton} onPress={() => router.push('/AddFarm')}>
        <Icon name="plus-circle" size={32} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Icon name="log-out" size={24} color="#fff" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#8B4513', padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  name: { fontSize: 18, fontWeight: 'bold' },
  location: { color: '#444' },
  addButton: {
    backgroundColor: '#228B22',
    width: 60,
    height: 60,
    borderRadius: 30,
    position: 'absolute',
    bottom: 30,
    right: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButton: {
    backgroundColor: '#d9534f',
    padding: 10,
    borderRadius: 8,
    position: 'absolute',
    top: 670,
    right: 280,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: 'bold',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#888',
  },
  noFarmsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#888',
  },
});

export default Dashboard;
