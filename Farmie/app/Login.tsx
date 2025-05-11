import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
import config from '../config/config';

const LoginScreen = () => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const router = useRouter();

  const handleLogin = async () => {
    if (!username || !password) {
      setErrorMessage('Username and password are required!');
      return;
    }

    try {
      const response = await axios.post(`${config.API_BASE_URL}/login`, {
        user_name: username,
        password,
      });

      if (response.status === 200) {
        const { access_token } = response.data; // Retrieve the token from the response
        await AsyncStorage.setItem('jwt_token', access_token); // Store the token securely

        console.log('Login successful');
        router.push('/Dashboard'); // Navigate to Dashboard
      }
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Invalid credentials');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.centerContent}>
        <Image
          source={require('../assets/images/farmie.png')}
          style={styles.image}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.header}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        placeholderTextColor="#ccc"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        placeholderTextColor="#ccc"
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#8B4513',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  centerContent: {
    alignItems: 'center',
    marginBottom: 20,
  },
  image: {
    width: 200,
    height: 200,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    height: 45,
    borderColor: '#ccc',
    borderWidth: 1,
    backgroundColor: '#fff',
    marginBottom: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  button: {
    backgroundColor: '#D2691E',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default LoginScreen;
