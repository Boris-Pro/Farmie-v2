import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert, Image, TouchableOpacity, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import config from '../config/config';

const RegisterScreen = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');           // New email field
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    if (!username || !email || !password) {
      setErrorMessage("All fields are required");
      return;
    }

    try {
      const response = await fetch(`${config.API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_name: username,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', data.message || 'Registration successful');
        setShowSuccessModal(true);
        setErrorMessage(null);
        setTimeout(() => {
          setShowSuccessModal(false);
          router.push('/Login');
        }, 1000);
      } else {
        setErrorMessage(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage('Unable to connect to the server. Please try again later.');
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
      <Text style={styles.header}>Register</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#ccc"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#ccc"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#ccc"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      {/* Success Modal */}
      <Modal
        transparent={true}
        animationType="fade"
        visible={showSuccessModal}
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.successText}>Welcome Farmer!</Text>
            <TouchableOpacity onPress={() => setShowSuccessModal(false)}>
              <Text style={styles.buttonText}>Okay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#8B4513',
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
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
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
  modalContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    width: 150,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default RegisterScreen;
