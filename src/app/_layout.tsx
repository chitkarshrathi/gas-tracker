import { Stack } from 'expo-router';
import { AppProvider } from '../context/AppContext';

export default function RootLayout() {
  return (

    <AppProvider>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'My Garage' }} />
        <Stack.Screen name="add" options={{ title: 'Log Fill-up', presentation: 'modal' }} />
      </Stack>
    </AppProvider>
  );
}