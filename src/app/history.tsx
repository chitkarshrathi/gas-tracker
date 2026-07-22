import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';

// Helper to sort by date safely
const parseDate = (dateStr: string) => {
    if (dateStr.includes('/')) {
        const [month, day, year] = dateStr.split('/');
        return new Date(Number(year), Number(month) - 1, Number(day));
    }
    return new Date(dateStr);
};

export default function HistoryScreen() {
    const insets = useSafeAreaInsets();
    const { logs, vehicles, unitSystem, deleteLog } = useAppContext();
    const [selectedVehicleId, setSelectedVehicleId] = useState('all');

    const currency = "$";
    const unitLabel = unitSystem === 'Imperial' ? 'gal' : 'L';

    // Filter by vehicle and sort strictly chronologically (newest first)
    const filteredLogs = selectedVehicleId === 'all'
        ? logs
        : logs.filter(log => log.vehicleId === selectedVehicleId);

    const displayLogs = [...filteredLogs].sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime());

    return (
        <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
            
            <Text style={styles.pageTitle}>Log History</Text>

            {/* VEHICLE FILTER PILL-BAR */}
            <View style={styles.filterWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vehicleScroll}>
                    <TouchableOpacity
                        style={[styles.vehicleBtn, selectedVehicleId === 'all' && styles.vehicleBtnActive]}
                        onPress={() => setSelectedVehicleId('all')}
                    >
                        <MaterialCommunityIcons name="garage" size={18} color={selectedVehicleId === 'all' ? '#fff' : '#666'} />
                        <Text style={[styles.vehicleBtnText, selectedVehicleId === 'all' && styles.vehicleBtnTextActive]}>
                            All Vehicles
                        </Text>
                    </TouchableOpacity>

                    {vehicles.map(v => (
                        <TouchableOpacity
                            key={v.id}
                            style={[styles.vehicleBtn, selectedVehicleId === v.id && styles.vehicleBtnActive]}
                            onPress={() => setSelectedVehicleId(v.id)}
                        >
                            <MaterialCommunityIcons name={(v.imageUri || 'car') as any} size={18} color={selectedVehicleId === v.id ? '#fff' : v.color} />
                            <Text style={[styles.vehicleBtnText, selectedVehicleId === v.id && styles.vehicleBtnTextActive]}>
                                {v.makeModel}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <FlatList
                data={displayLogs}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: 130 }}
                renderItem={({ item }) => {
                    const car = vehicles.find(v => v.id === item.vehicleId);
                    
                    return (
                        <View style={styles.logCard}>
                            <View style={styles.logHeader}>
                                <View style={styles.carBadge}>
                                    <MaterialCommunityIcons name={(car?.imageUri || 'car') as any} size={14} color={car?.color || '#007AFF'} />
                                    <Text style={styles.carBadgeText}>{car?.makeModel || 'Unknown Vehicle'}</Text>
                                </View>
                                <Text style={styles.logDate}>{item.date}</Text>
                            </View>

                            <View style={styles.logBody}>
                                <View>
                                    <Text style={styles.metricText}>Cost: {currency}{item.price}</Text>
                                    <Text style={styles.metricText}>Fuel: {item.fuel} {unitLabel}</Text>
                                    <Text style={styles.metricText}>Odo: {item.odometer}</Text>
                                </View>
                                <TouchableOpacity onPress={() => deleteLog(item.id)} style={styles.deleteButton}>
                                    <MaterialCommunityIcons name="trash-can-outline" size={20} color="#ff3b30" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                }}
                ListEmptyComponent={<Text style={styles.emptyText}>No logs found for your selection.</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 20, backgroundColor: '#f2f2f7' },
    pageTitle: { fontSize: 32, fontWeight: 'bold', color: '#333', marginBottom: 20 },
    
    filterWrapper: { marginBottom: 15 },
    vehicleScroll: { flexGrow: 0, paddingRight: 20 },
    vehicleBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, marginRight: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
    vehicleBtnActive: { backgroundColor: '#007AFF' },
    vehicleBtnText: { marginLeft: 6, fontWeight: '600', color: '#666' },
    vehicleBtnTextActive: { color: '#fff' },

    logCard: { backgroundColor: '#fff', padding: 15, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
    logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 10 },
    carBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f2f2f7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    carBadgeText: { fontSize: 12, fontWeight: '600', color: '#444', marginLeft: 4 },
    logDate: { fontSize: 14, fontWeight: 'bold', color: '#8E8E93' },
    
    logBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    metricText: { fontSize: 15, color: '#333', marginBottom: 4, fontWeight: '500' },
    
    deleteButton: { padding: 8, backgroundColor: '#ffe5e5', borderRadius: 8 },
    emptyText: { textAlign: 'center', marginTop: 30, color: '#999', fontSize: 16 }
});
