// app/add.tsx
import { useState, useEffect } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  Switch
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';

export default function AddLogScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { addLog, unitSystem, vehicles, activeVehicleId } = useAppContext();

    const selectedVehicle = vehicles.find(v => v.id === (activeVehicleId || vehicles[0]?.id));
    
    const [fuelType, setFuelType] = useState('Regular');
    const [odometer, setOdometer] = useState('');
    const [totalFuel, setTotalFuel] = useState('');
    const [price, setPrice] = useState('');
    
    const [isFullTank, setIsFullTank] = useState(true);
    const [drivingContext, setDrivingContext] = useState('mixed');

    useEffect(() => {
        if (selectedVehicle?.fuelType === 'diesel') {
            setFuelType('Diesel');
        } else if (selectedVehicle?.fuelType === 'electric') {
            setFuelType('Electric (kWh)');
        } else {
            setFuelType('Regular');
        }
    }, [selectedVehicle]);

    const getFuelOptions = () => {
        if (selectedVehicle?.fuelType === 'diesel') return ['Diesel'];
        if (selectedVehicle?.fuelType === 'electric') return ['Electric (kWh)'];
        return ['Regular', 'Midgrade', 'Premium'];
    };

    const handleSave = () => {
        if (!odometer || !totalFuel || !price) {
            Alert.alert("Missing Info", "Please fill in all fields to log this fill-up.");
            return;
        }
        
        addLog({
            vehicleId: selectedVehicle?.id || '',
            date: new Date().toISOString(),
            odometer: Number(odometer),
            fuelVolume: Number(totalFuel),
            totalCost: Number(price),
            fuelType,
            isFullTank,
            context: drivingContext
        });
        
        router.back();
    };

    return (
        <View style={styles.container}>
            {/* Main Content Area */}
            <ScrollView
                contentContainerStyle={{
                    paddingTop: insets.top + 20,
                    paddingBottom: insets.bottom + 100, // Extra clearance so inputs aren't hidden by glass bar
                    paddingHorizontal: 20
                }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.pageTitle}>New Log</Text>

                {/* Form Inputs */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Odometer ({unitSystem === 'metric' ? 'km' : 'mi'})</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={odometer}
                        onChangeText={setOdometer}
                        placeholder="e.g. 45000"
                        placeholderTextColor="#C7C7CC"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Fuel Added ({unitSystem === 'metric' ? 'L' : 'gal'})</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={totalFuel}
                        onChangeText={setTotalFuel}
                        placeholder="e.g. 40.5"
                        placeholderTextColor="#C7C7CC"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Total Cost ($)</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={price}
                        onChangeText={setPrice}
                        placeholder="e.g. 55.00"
                        placeholderTextColor="#C7C7CC"
                    />
                </View>

                {/* Partial-Fill Toggle */}
                <View style={styles.switchRow}>
                    <View>
                        <Text style={styles.label}>Filled to Full?</Text>
                        <Text style={styles.subLabel}>Turn off for partial fills to keep efficiency math accurate.</Text>
                    </View>
                    <Switch
                        value={isFullTank}
                        onValueChange={setIsFullTank}
                        trackColor={{ true: '#007AFF', false: '#E5E5EA' }}
                    />
                </View>

                {/* Driving Context Tags */}
                <Text style={styles.label}>Driving Context</Text>
                <View style={styles.chipRow}>
                    {['city', 'highway', 'mountain', 'mixed'].map(ctx => (
                        <TouchableOpacity
                            key={ctx}
                            style={[styles.chip, drivingContext === ctx && styles.chipActive]}
                            onPress={() => setDrivingContext(ctx)}
                        >
                            <Text style={[styles.chipText, drivingContext === ctx && styles.chipTextActive]}>
                                {ctx.charAt(0).toUpperCase() + ctx.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Fuel Type Options */}
                <Text style={styles.label}>Fuel Type</Text>
                <View style={styles.chipRow}>
                    {getFuelOptions().map(type => (
                        <TouchableOpacity
                            key={type}
                            style={[styles.chip, fuelType === type && styles.chipActive]}
                            onPress={() => setFuelType(type)}
                        >
                            <Text style={[styles.chipText, fuelType === type && styles.chipTextActive]}>{type}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Main Action Button */}
                <TouchableOpacity style={styles.iosButton} onPress={handleSave}>
                    <Text style={styles.iosButtonText}>Save Log</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Liquid Glass Bottom Floating Bar */}
            <View style={[styles.glassBarContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                <BlurView intensity={80} tint="systemChromeMaterialLight" style={styles.glassBar}>
                    <TouchableOpacity
                        style={styles.glassBarItem}
                        onPress={() => router.back()}
                        activeOpacity={0.7}
                    >
                        <MaterialCommunityIcons name="chevron-down" size={24} color="#007AFF" />
                        <Text style={styles.glassBarLabel}>Dismiss</Text>
                    </TouchableOpacity>

                    <View style={styles.glassDivider} />

                    <TouchableOpacity
                        style={styles.glassBarItem}
                        onPress={() => router.replace('/')}
                        activeOpacity={0.7}
                    >
                        <MaterialCommunityIcons name="garage" size={22} color="#007AFF" />
                        <Text style={styles.glassBarLabel}>Garage</Text>
                    </TouchableOpacity>
                </BlurView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F2F2F7' },
    pageTitle: { fontSize: 32, fontWeight: '700', marginBottom: 20, color: '#000' },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 6 },
    subLabel: { fontSize: 12, color: '#8E8E93', maxWidth: '80%' },
    input: { backgroundColor: '#fff', padding: 14, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: '#E5E5EA' },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingVertical: 10 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
    chip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E5EA' },
    chipActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
    chipText: { fontWeight: '600', color: '#333' },
    chipTextActive: { color: '#fff' },
    iosButton: { backgroundColor: '#007AFF', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 10, shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 6 },
    iosButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
    
    /* Liquid Glass Bar Styles */
    glassBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    glassBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-evenly',
        width: '100%',
        maxWidth: 340,
        height: 60,
        borderRadius: 30,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
    },
    glassBarItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        height: '100%',
    },
    glassBarLabel: {
        color: '#007AFF',
        fontSize: 15,
        fontWeight: '600',
    },
    glassDivider: {
        width: 1,
        height: 24,
        backgroundColor: 'rgba(60, 60, 67, 0.18)',
    },
});
