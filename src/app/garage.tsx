import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Button, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAppContext } from '../context/AppContext';

// Standard body types and their corresponding Expo icons
const VEHICLE_TYPES = [
    { label: 'Sedan', icon: 'car' },
    { label: 'SUV', icon: 'car-estate' },
    { label: 'Truck', icon: 'truck-pickup' },
    { label: 'Moto', icon: 'motorbike' },
];

// A palette of common car paint colors
const CAR_COLORS = [
    '#FFFFFF', // White
    '#000000', // Black
    '#8E8E93', // Silver/Grey
    '#FF3B30', // Red
    '#007AFF', // Blue
    '#34C759', // Green
    '#FF9500', // Orange
];

export default function GarageScreen() {
    const router = useRouter();
    const { vehicles, activeVehicleId, addVehicle, setActiveVehicle } = useAppContext();

    const [makeModel, setMakeModel] = useState('');
    const [selectedType, setSelectedType] = useState(VEHICLE_TYPES[0].icon);
    const [selectedColor, setSelectedColor] = useState(CAR_COLORS[0]);

    const handleSave = () => {
        if (makeModel.trim().length === 0) return;
        // We save the icon name into the imageUri slot we created earlier
        addVehicle(makeModel, selectedColor, selectedType);
        setMakeModel('');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.headerTitle}>My Garage</Text>

            {/* NEW VEHICLE FORM */}
            <View style={styles.card}>
                <Text style={styles.label}>Make & Model</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g., 2020 Ford F-150"
                    placeholderTextColor="#999"
                    value={makeModel}
                    onChangeText={setMakeModel}
                />

                <Text style={styles.label}>Body Type</Text>
                <View style={styles.row}>
                    {VEHICLE_TYPES.map((type) => (
                        <TouchableOpacity
                            key={type.icon}
                            style={[styles.typeBtn, selectedType === type.icon && styles.typeBtnActive]}
                            onPress={() => setSelectedType(type.icon)}
                        >
                            <MaterialCommunityIcons 
                                name={type.icon as any} 
                                size={28} 
                                color={selectedType === type.icon ? '#fff' : '#666'} 
                            />
                            <Text style={[styles.typeText, selectedType === type.icon && { color: '#fff' }]}>
                                {type.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>Paint Color</Text>
                <View style={styles.colorRow}>
                    {CAR_COLORS.map((color) => (
                        <TouchableOpacity
                            key={color}
                            style={[
                                styles.colorSwatch,
                                { backgroundColor: color },
                                selectedColor === color && styles.colorSwatchActive
                            ]}
                            onPress={() => setSelectedColor(color)}
                        />
                    ))}
                </View>

                <View style={styles.buttonContainer}>
                    <Button title="Add Vehicle" onPress={handleSave} disabled={makeModel.length === 0} />
                </View>
            </View>

            {/* LIST OF SAVED VEHICLES */}
            <Text style={styles.listHeader}>Select Active Vehicle</Text>
            <FlatList
                data={vehicles}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity 
                        style={[styles.vehicleCard, activeVehicleId === item.id && styles.vehicleCardActive]}
                        onPress={() => {
                            setActiveVehicle(item.id);
                            router.back(); // Auto-return to dashboard when a car is picked
                        }}
                    >
                        <MaterialCommunityIcons 
                            name={(item.imageUri || 'car') as any} 
                            size={40} 
                            color={item.color === '#FFFFFF' ? '#ccc' : item.color} // Prevents white car from blending into white background
                        />
                        <View style={styles.vehicleInfo}>
                            <Text style={styles.vehicleName}>{item.makeModel}</Text>
                            {activeVehicleId === item.id && <Text style={styles.activeText}>Currently Tracking</Text>}
                        </View>
                        
                        {/* Checkmark for the active vehicle */}
                        {activeVehicleId === item.id && (
                            <MaterialCommunityIcons name="check-circle" size={24} color="#007AFF" />
                        )}
                    </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>Your garage is empty.</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f2f2f7', paddingTop: 50 },
    headerTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: '#333' },
    
    // Form Card
    card: { backgroundColor: 'white', padding: 20, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, marginBottom: 30 },
    label: { fontSize: 16, fontWeight: 'bold', marginTop: 10, marginBottom: 10, color: '#333' },
    input: { borderWidth: 1, borderColor: '#E5E5EA', padding: 12, borderRadius: 8, fontSize: 16, backgroundColor: '#FAFAFA' },
    buttonContainer: { marginTop: 20 },

    // Body Type Row
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    typeBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, backgroundColor: '#f2f2f7', marginHorizontal: 4, borderRadius: 8 },
    typeBtnActive: { backgroundColor: '#007AFF' },
    typeText: { fontSize: 12, marginTop: 4, color: '#666', fontWeight: '600' },

    // Color Swatches
    colorRow: { flexDirection: 'row', justifyContent: 'flex-start', flexWrap: 'wrap', gap: 15 },
    colorSwatch: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#ccc' },
    colorSwatchActive: { borderWidth: 3, borderColor: '#007AFF', transform: [{ scale: 1.1 }] },

    // List Styles
    listHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#333' },
    vehicleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 2, borderColor: 'transparent' },
    vehicleCardActive: { borderColor: '#007AFF', backgroundColor: '#F0F8FF' },
    vehicleInfo: { flex: 1, marginLeft: 15 },
    vehicleName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    activeText: { fontSize: 13, color: '#007AFF', marginTop: 2, fontWeight: '500' },
    emptyText: { textAlign: 'center', marginTop: 20, color: '#666' }
});
