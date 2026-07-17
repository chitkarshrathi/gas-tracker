import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Button, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppContext } from '../context/AppContext';

export default function DashboardScreen() {
    const router = useRouter();
    // We only need the raw logs from Context now, we will do the math here based on the filter
    const { logs, unitSystem, deleteLog } = useAppContext();

    const [timeFilter, setTimeFilter] = useState('All'); // 'All', 'Week', 'Month', 'YTD'

    const currency = "$";
    const efficiencyLabel = unitSystem === 'Imperial' ? 'MPG' : 'km/L';

    // 1. FILTER THE LOGS BASED ON TIME
    const getFilteredLogs = () => {
        const now = new Date();
        return logs.filter((log: any) => {
            if (timeFilter === 'All') return true;
            
            // Bulletproof date parsing: Split "7/16/2026" into parts manually
            let logDate;
            if (log.date.includes('/')) {
                const [month, day, year] = log.date.split('/');
                logDate = new Date(Number(year), Number(month) - 1, Number(day));
            } else {
                logDate = new Date(log.date); // Fallback for older formats
            }
            
            if (timeFilter === 'Week') {
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(now.getDate() - 7);
                return logDate >= oneWeekAgo;
            }
            if (timeFilter === 'Month') {
                return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
            }
            if (timeFilter === 'YTD') {
                return logDate.getFullYear() === now.getFullYear();
            }
            return true;
        });
    };

    const filteredLogs = getFilteredLogs();

    // 2. CALCULATE STATS FOR THE FILTERED LOGS
    const displaySpent = filteredLogs.reduce((sum: number, log: any) => sum + Number(log.price), 0);
    
    let displayEfficiency = 0;
    if (filteredLogs.length > 1) {
        const sorted = [...filteredLogs].sort((a: any, b: any) => Number(a.odometer) - Number(b.odometer));
        const totalDistance = Number(sorted[sorted.length - 1].odometer) - Number(sorted[0].odometer);
        const totalFuel = sorted.slice(1).reduce((sum: number, log: any) => sum + Number(log.fuel), 0);
        if (totalFuel > 0) {
            displayEfficiency = totalDistance / totalFuel;
        }
    }

    return (
        <View style={styles.container}>
            
            {/* The Timeframe Filters */}
            <View style={styles.filterContainer}>
                {['All', 'Week', 'Month', 'YTD'].map((filter) => (
                    <TouchableOpacity 
                        key={filter} 
                        style={[styles.filterBtn, timeFilter === filter && styles.filterBtnActive]}
                        onPress={() => setTimeFilter(filter)}
                    >
                        <Text style={[styles.filterText, timeFilter === filter && styles.filterTextActive]}>
                            {filter}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* The Stats Dashboard */}
            <View style={styles.statsCard}>
                <Text style={styles.title}>{timeFilter === 'All' ? 'Lifetime' : timeFilter} Stats</Text>
                <Text style={styles.statText}>Total Spent: {currency}{displaySpent.toFixed(2)}</Text>
                <Text style={styles.statText}>
                    Avg Efficiency: {displayEfficiency.toFixed(2)} {efficiencyLabel}
                </Text>
                <Text style={styles.statText}>Total Logs: {filteredLogs.length}</Text>
            </View>

            <Button title="Log a Fill-up" onPress={() => router.push('/add' as any)} />

            {/* The Filtered Logs List */}
            <FlatList
                data={filteredLogs}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.logItem}>
                        <View>
                            <Text style={styles.logDate}>{item.date}</Text>
                            <Text>Odo: {item.odometer} | Fuel: {item.fuel} {unitSystem === 'Imperial' ? 'gal' : 'L'} | Cost: {currency}{item.price}</Text>
                            <Text style={styles.fuelTypeBadge}>{item.fuelType || 'Regular'} </Text>
                        </View>

                        <TouchableOpacity
                            onPress={() => deleteLog(item.id)}
                            style={styles.deleteButton}
                        >
                            <Text style={styles.deleteText}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                )}
                ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: 20}}>No logs for this timeframe.</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f2f2f7', paddingTop: 50 },
    
    // Filter Styles
    filterContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    filterBtn: { flex: 1, paddingVertical: 8, marginHorizontal: 4, backgroundColor: '#e5e5ea', borderRadius: 20, alignItems: 'center' },
    filterBtnActive: { backgroundColor: '#007AFF' },
    filterText: { color: '#333', fontWeight: 'bold', fontSize: 13 },
    filterTextActive: { color: '#fff' },

    // Card Styles
    statsCard: { backgroundColor: 'white', padding: 20, borderRadius: 12, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
    statText: { fontSize: 16, marginTop: 5, color: '#444' },
    
    // Log Styles
    logItem: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    logDate: { fontWeight: 'bold', marginBottom: 5, fontSize: 16 },
    fuelTypeBadge: { color: '#666', fontStyle: 'italic', marginTop: 4, fontWeight: '500' },
    
    // Delete Button Styles
    deleteButton: { backgroundColor: '#ff4444', padding: 8, borderRadius: 5 },
    deleteText: { color: 'white', fontWeight: 'bold' }
});