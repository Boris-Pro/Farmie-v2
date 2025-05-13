import { Stack } from 'expo-router';

export default function Layout() {
  return (
  <Stack >
  {/* Hide header on the home screen */}
  <Stack.Screen name="index" options={{ headerShown: false }} />
  <Stack.Screen name="Dashboard" options={{ headerBackVisible: false,
          headerStyle: {
            backgroundColor: '#8B4513', // Set the header background to black
          },
          headerTintColor: 'white',}} />
  <Stack.Screen name="Login" options={{
          headerStyle: {
            backgroundColor: '#8B4513', 
          },
          headerTintColor: 'white', 
        }} />
  <Stack.Screen name="Register" options={{
          headerStyle: {
            backgroundColor: '#8B4513', 
          },
          headerTintColor: 'white', 
        }} />
  <Stack.Screen name="ViewFarm" options={{
          headerStyle: {
            backgroundColor: '#8B4513', 
          },
          headerTintColor: 'white', 
        }} />
  <Stack.Screen name="AddCrop" options={{

          headerStyle: {
            backgroundColor: '#8B4513', 
          },
          headerTintColor: 'white', 
        }} />
  <Stack.Screen name="CropIdentifier" options={{  

          headerStyle: {
            backgroundColor: '#8B4513', 
          },
          headerTintColor: 'white', 
        }} />
  <Stack.Screen name="AddFarm" options={{

          headerStyle: {
            backgroundColor: '#8B4513', 
          },
          headerTintColor: 'white', 
        }} />
  </Stack>);
}
