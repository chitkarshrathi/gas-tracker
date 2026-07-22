import { Tabs } from 'expo-router';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { BlurView } from 'expo-blur';
import { StyleSheet, Platform } from 'react-native';
import { AppProvider } from '../context/AppContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function RootLayout() {
    return (
        <AppProvider>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: {
                        position: 'absolute',
                        bottom: 30,
                        left: 20,
                        right: 20,
                        height: 70,
                        borderRadius: 35,
                        borderWidth: 1,
                        borderColor: 'rgba(255, 255, 255, 0.4)',
                        backgroundColor: 'transparent',
                        elevation: 0,
                        shadowOpacity: 0,
                        overflow: 'hidden',
                    },
                    tabBarBackground: () => {
                        if (Platform.OS === 'ios' && isLiquidGlassAvailable()) {
                            return <GlassView intensity={0.8} tint="light" style={StyleSheet.absoluteFill} />;
                        }
                        return <BlurView tint="light" intensity={80} style={StyleSheet.absoluteFill} />;
                    },
                    tabBarActiveTintColor: '#007AFF',
                    tabBarInactiveTintColor: '#8E8E93',
                    tabBarShowLabel: true,
                    tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginBottom: 8 },
                    tabBarIconStyle: { marginTop: 6 }
                }}
            >
                <Tabs.Screen
                    name="index"
                    options={{ title: 'Dashboard', tabBarIcon: ({ color }) => <MaterialCommunityIcons name="home-variant" size={26} color={color} /> }}
                />
                <Tabs.Screen
                    name="garage"
                    options={{ title: 'Garage', tabBarIcon: ({ color }) => <MaterialCommunityIcons name="garage-variant" size={26} color={color} /> }}
                />
                <Tabs.Screen
                    name="history"
                    options={{ title: 'History', tabBarIcon: ({ color }) => <MaterialCommunityIcons name="history" size={26} color={color} /> }}
                />
                <Tabs.Screen
                    name="settings"
                    options={{ title: 'Settings', tabBarIcon: ({ color }) => <MaterialCommunityIcons name="cog-outline" size={26} color={color} /> }}
                />

                {/* Hides the Add Screen from the bottom bar entirely */}
                <Tabs.Screen name="add" options={{ href: null, tabBarStyle: { display: 'none' } }} />
            
            </Tabs>
            
        </AppProvider>
    );
}
