import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Button, Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useAppContext } from '../context/AppContext';

// 1. HELPER: Bulletproof Date Parser
const parseDate = (dateStr: string) => {
    if (dateStr.includes('/')) {
        const [month, day, year] = dateStr.split('/');
        return new Date(Number(year), Number(month) - 1, Number(day));
    }
    return new Date(dateStr);
};

export default function DashboardScreen() {
    const router = useRouter();
    const { logs, unitSystem, deleteLog } = useAppContext();

    // 2. NEW SCREEN TIME STATE
    const [viewMode, setViewMode] = useState('Month'); // 'Week', 'Month', 'Year', 'All'
    const [refDate, setRefDate] = useState(new Date());

    const currency = "$";
    const efficiencyLabel = unitSystem === 'Imperial' ? 'MPG' : 'km/L';

    // 3. NAVIGATION CONTROLS
    const changePeriod = (direction: number) => {
        const newDate = new Date(refDate);
        if (viewMode === 'Week') newDate.setDate(newDate.getDate() + (direction * 7));
        if (viewMode === 'Month') newDate.setMonth(newDate.getMonth() + direction);
        if (viewMode === 'Year') newDate.setFullYear(newDate.getFullYear() + direction);
        setRefDate(newDate);
    };

    const getPeriodLabel = () => {
        if (viewMode === 'All') return 'Lifetime Stats';
        if (viewMode === 'Year') return refDate.getFullYear().toString();
        if (viewMode === 'Month') {
            return refDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        }
        if (viewMode === 'Week') {
            const start = new Date(refDate);
            start.setDate(start.getDate() - start.getDay()); // Sunday
            const end = new Date(start);
            end.setDate(end.getDate() + 6); // Saturday
            return `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`;
        }
    };

    // 4. FILTER & SORT LOGIC
    const processedLogs = logs.map((l: any) => ({ ...l, parsedDate: parseDate(l.date) }));

    const filteredLogs = processedLogs.filter((log: any) => {
        if (viewMode === 'All') return true;
        const d = log.parsedDate;
        
        if (viewMode === 'Year') return d.getFullYear() === refDate.getFullYear();
        if (viewMode === 'Month') return d.getMonth() === refDate.getMonth() && d.getFullYear() === refDate.getFullYear();
        if (viewMode === 'Week') {
            const start = new Date(refDate);
            start.setDate(start.getDate() - start.getDay());
            start.setHours(0, 0, 0, 0);
            const end = new Date(start);
            end.setDate(end.getDate() + 6);
            end.setHours(23, 59, 59, 999);
            return d >= start && d <= end;
        }
        return true;
    });

    // SORT DESCENDING FOR THE LIST (Newest Top, Oldest Bottom)
    const displayLogs = [...filteredLogs].sort((a, b) => b.parsedDate.getTime() - a.parsedDate.getTime());

    // SORT ASCENDING FOR MATH & CHARTS (Chronological)
    const statsLogs = [...filteredLogs].sort((a, b) => Number(a.odometer) - Number(b.odometer));

    // 5. CALCULATE STATS
    const displaySpent = statsLogs.reduce((sum: number, log: any) => sum + Number(log.price), 0);
    
    let displayEfficiency = 0;
    let chartData = { labels: ['Start'], datasets: [{ data: [0] }] };
    let showChart = false;

    if (statsLogs.length > 1) {
        const totalDistance = Number(statsLogs[statsLogs.length - 1].odometer) - Number(statsLogs[0].odometer);
        const totalFuel = statsLogs.slice(1).reduce((sum: number, log: any) => sum + Number(log.fuel), 0);
        
        if (totalFuel > 0) {
            displayEfficiency = totalDistance / totalFuel;
        }

        // GENERATE CHART DATA
        const labels = [];
        const dataPoints = [];
        for (let i = 1; i < statsLogs.length; i++) {
            const distance = Number(statsLogs[i].odometer) - Number(statsLogs[i-1].odometer);
            const currentFuel = Number(statsLogs[i].fuel);
            
            if (currentFuel > 0) {
                dataPoints.push(distance / currentFuel);
                labels.push(`${statsLogs[i].parsedDate.getMonth() + 1}/${statsLogs[i].parsedDate.getDate()}`);
            }
        }
        
        if (dataPoints.length > 0) {
            chartData = { labels, datasets: [{ data: dataPoints }] };
            showChart = true;
        }
    }

    return (
        <View style={styles.container}>
            
            {/* TOP BAR: View Mode Selector */}
            <View style={styles.filterContainer}>
                {['Week', 'Month', 'Year', 'All'].map((mode) => (
                    <TouchableOpacity 
                        key={mode} 
                        style={[styles.filterBtn, viewMode === mode && styles.filterBtnActive]}
                        onPress={() => {
                            setViewMode(mode);
                            setRefDate(new Date()); // Reset to today when switching modes
                        }}
                    >
                        <Text style={[styles.filterText, viewMode === mode && styles.filterTextActive]}>
                            {mode}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* SECOND BAR: Screen Time Paginator */}
            <View style={styles.paginator}>
                <TouchableOpacity onPress={() => changePeriod(-1)} disabled={viewMode === 'All'} style={styles.pageBtn}>
                    <Text style={styles.pageArrow}>{viewMode === 'All' ? '' : '◀'}</Text>
                </TouchableOpacity>
                
                <Text style={styles.pageLabel}>{getPeriodLabel()}</Text>

                <TouchableOpacity onPress={() => changePeriod(1)} disabled={viewMode === 'All'} style={styles.pageBtn}>
                    <Text style={styles.pageArrow}>{viewMode === 'All' ? '' : '▶'}</Text>
                </TouchableOpacity>
            </View>

            {/* STATS & CHART DASHBOARD */}
            <FlatList
                data={displayLogs}
                keyExtractor={(item) => item.id}
                ListHeaderComponent={
                    <View>
                        <View style={styles.statsCard}>
                            <Text style={styles.statText}>Total Spent: {currency}{displaySpent.toFixed(2)}</Text>
                            <Text style={styles.statText}>
                                Avg Efficiency: {displayEfficiency.toFixed(2)} {efficiencyLabel}
                            </Text>
                            <Text style={styles.statText}>Fill-ups this period: {displayLogs.length}</Text>
                        </View>

                        {showChart && (
                            <View style={styles.chartContainer}>
                                <Text style={styles.chartTitle}>Efficiency Trend ({efficiencyLabel})</Text>
                                <LineChart
                                    data={chartData}
                                    width={Dimensions.get('window').width - 40}
                                    height={180}
                                    yAxisLabel=""
                                    yAxisSuffix=""
                                    yAxisInterval={1}
                                    chartConfig={{
                                        backgroundColor: '#ffffff',
                                        backgroundGradientFrom: '#ffffff',
                                        backgroundGradientTo: '#ffffff',
                                        decimalPlaces: 1,
                                        color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
                                        labelColor: (opacity = 1) => `rgba(100, 100, 100, ${opacity})`,
                                        style: { borderRadius: 12 },
                                        propsForDots: { r: "5", strokeWidth: "2", stroke: "#007AFF" }
                                    }}
                                    bezier
                                    style={{ marginVertical: 10, borderRadius: 12 }}
                                />
                            </View>
                        )}

                        <Button title="Log a Fill-up" onPress={() => router.push('/add' as any)} />
                        <Text style={styles.listHeader}>Recent Fill-ups</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <View style={styles.logItem}>
                        <View>
                            <Text style={styles.logDate}>{item.date}</Text>
                            <Text>Odo: {item.odometer} | Cost: {currency}{item.price}</Text>
                            <Text style={styles.fuelTypeBadge}>{item.fuelType || 'Regular'} Gas: {item.fuel} {unitSystem === 'Imperial' ? 'gal' : 'L'}</Text>
                        </View>

                        <TouchableOpacity onPress={() => deleteLog(item.id)} style={styles.deleteButton}>
                            <Text style={styles.deleteText}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>No logs found for this period.</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f2f2f7', paddingTop: 50 },
    
    // View Mode Filters
    filterContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    filterBtn: { flex: 1, paddingVertical: 8, marginHorizontal: 4, backgroundColor: '#e5e5ea', borderRadius: 20, alignItems: 'center' },
    filterBtnActive: { backgroundColor: '#007AFF' },
    filterText: { color: '#333', fontWeight: 'bold', fontSize: 13 },
    filterTextActive: { color: '#fff' },

    // Paginator Styles
    paginator: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingHorizontal: 10 },
    pageBtn: { padding: 10 },
    pageArrow: { fontSize: 20, color: '#007AFF' },
    pageLabel: { fontSize: 18, fontWeight: 'bold', color: '#333' },

    // Card Styles
    statsCard: { backgroundColor: 'white', padding: 20, borderRadius: 12, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    statText: { fontSize: 16, marginTop: 5, color: '#444' },
    
    // Chart Styles
    chartContainer: { backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    chartTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 5, color: '#333' },

    // List Styles
    listHeader: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10, color: '#333' },
    logItem: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
    logDate: { fontWeight: 'bold', marginBottom: 5, fontSize: 16 },
    fuelTypeBadge: { color: '#666', fontStyle: 'italic', marginTop: 4, fontWeight: '500' },
    emptyText: { textAlign: 'center', marginTop: 20, color: '#666' },
    
    // Delete Button
    deleteButton: { backgroundColor: '#ff4444', padding: 8, borderRadius: 5 },
    deleteText: { color: 'white', fontWeight: 'bold' }
});