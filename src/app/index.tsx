// app/index.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';

// THE NATIVE OS MENU BRIDGE
import * as DropdownMenu from 'zeego/dropdown-menu';

const parseDate = (dateStr: string) => {
    if (dateStr.includes('/')) {
        const [month, day, year] = dateStr.split('/');
        return new Date(Number(year), Number(month) - 1, Number(day));
    }
    return new Date(dateStr);
};

export default function DashboardScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { logs, unitSystem, deleteLog, vehicles } = useAppContext();

    const [viewMode, setViewMode] = useState('All');
    const [refDate, setRefDate] = useState(new Date());
    const [chartType, setChartType] = useState('price');
    
    const [selectedVehicleId, setSelectedVehicleId] = useState(() =>
        vehicles.length === 1 ? vehicles[0].id : 'all'
    );

    useEffect(() => {
        if (vehicles.length === 1) {
            setSelectedVehicleId(vehicles[0].id);
        } else if (vehicles.length === 0) {
            setSelectedVehicleId('all');
        }
    }, [vehicles.length]);

    const currency = "$";
    const efficiencyLabel = unitSystem === 'Imperial' ? 'MPG' : 'km/L';
    const unitLabel = unitSystem === 'Imperial' ? 'gal' : 'L';

    const activeVehicle = vehicles.find(v => v.id === selectedVehicleId);

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
        if (viewMode === 'Month') return refDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        if (viewMode === 'Week') {
            const start = new Date(refDate);
            start.setDate(start.getDate() - start.getDay());
            const end = new Date(start);
            end.setDate(end.getDate() + 6);
            return `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`;
        }
    };

    const today = new Date();
    let canGoForward = false;
    if (viewMode === 'Year') canGoForward = refDate.getFullYear() < today.getFullYear();
    else if (viewMode === 'Month') canGoForward = (refDate.getFullYear() * 12 + refDate.getMonth()) < (today.getFullYear() * 12 + today.getMonth());

    const vehicleLogs = selectedVehicleId === 'all' ? logs : logs.filter(log => log.vehicleId === selectedVehicleId);
    const processedLogs = vehicleLogs.map((l: any) => ({ ...l, parsedDate: parseDate(l.date) }));

    const filteredLogs = processedLogs.filter((log: any) => {
        if (viewMode === 'All') return true;
        const d = log.parsedDate;
        if (viewMode === 'Year') {
            const oneYearAgo = new Date(refDate);
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            return d >= oneYearAgo && d <= refDate;
        }
        if (viewMode === 'Month') return d.getMonth() === refDate.getMonth() && d.getFullYear() === refDate.getFullYear();
        return true;
    });

    const displayLogs = [...filteredLogs].sort((a, b) => b.parsedDate.getTime() - a.parsedDate.getTime());
    const recentLogs = displayLogs.slice(0, 5);
    const statsLogs = [...filteredLogs].sort((a, b) => Number(a.odometer) - Number(b.odometer));

    let displaySpent = 0, totalVolume = 0, totalDistance = 0;
    const logsByVehicle: any = {};
    
    statsLogs.forEach(log => {
        const vId = log.vehicleId || 'unknown';
        if (!logsByVehicle[vId]) logsByVehicle[vId] = [];
        logsByVehicle[vId].push(log);
    });

    Object.values(logsByVehicle).forEach((vLogs: any) => {
        const sorted = [...vLogs].sort((a: any, b: any) => Number(a.odometer) - Number(b.odometer));
        sorted.forEach(log => { displaySpent += Number(log.price || 0); totalVolume += Number(log.fuelVolume || log.fuel || 0); });
        if (sorted.length > 1) totalDistance += Number(sorted[sorted.length - 1].odometer) - Number(sorted[0].odometer);
    });

    const avgPricePerUnit = totalVolume > 0 ? (displaySpent / totalVolume) : 0;
    const displayEfficiency = totalVolume > 0 && totalDistance > 0 ? (totalDistance / totalVolume) : 0;

    let chartData = { labels: ['Start'], datasets: [{ data: [0] }] };
    let showChart = false;
    const chronoLogs = [...filteredLogs].sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());

    if (chronoLogs.length > 0) {
        const labels: string[] = [];
        const dataPoints: number[] = [];

        if (chartType === 'price') {
            chronoLogs.forEach(log => {
                const currentFuel = Number(log.fuelVolume || log.fuel);
                const currentPrice = Number(log.price || log.totalCost);
                if (currentFuel > 0) {
                    dataPoints.push(currentPrice / currentFuel);
                    labels.push(`${log.parsedDate.getMonth() + 1}/${log.parsedDate.getDate()}`);
                }
            });
        } else if (chartType === 'efficiency') {
            const logsByVehicleForChart: any = {};
            chronoLogs.forEach(log => {
                const vId = log.vehicleId || 'unknown';
                if (!logsByVehicleForChart[vId]) logsByVehicleForChart[vId] = [];
                logsByVehicleForChart[vId].push(log);
            });

            const efficiencyPoints: { date: Date, val: number, label: string }[] = [];

            Object.values(logsByVehicleForChart).forEach((vLogs: any) => {
                const sortedVLogs = [...vLogs].sort((a: any, b: any) => Number(a.odometer) - Number(b.odometer));
                
                if (sortedVLogs.length > 1) {
                    const firstFuel = Number(sortedVLogs[1].fuelVolume || sortedVLogs[1].fuel);
                    const firstDist = Number(sortedVLogs[1].odometer) - Number(sortedVLogs[0].odometer);
                    if (firstFuel > 0 && firstDist > 0) {
                        efficiencyPoints.push({
                            date: sortedVLogs[0].parsedDate,
                            val: firstDist / firstFuel,
                            label: `${sortedVLogs[0].parsedDate.getMonth() + 1}/${sortedVLogs[0].parsedDate.getDate()}`
                        });
                    }
                }

                for (let i = 1; i < sortedVLogs.length; i++) {
                    const currentFuel = Number(sortedVLogs[i].fuelVolume || sortedVLogs[i].fuel);
                    const distance = Number(sortedVLogs[i].odometer) - Number(sortedVLogs[i-1].odometer);
                    if (currentFuel > 0 && distance > 0) {
                        efficiencyPoints.push({
                            date: sortedVLogs[i].parsedDate,
                            val: distance / currentFuel,
                            label: `${sortedVLogs[i].parsedDate.getMonth() + 1}/${sortedVLogs[i].parsedDate.getDate()}`
                        });
                    }
                }
            });

            efficiencyPoints.sort((a, b) => a.date.getTime() - b.date.getTime());
            efficiencyPoints.forEach(pt => {
                dataPoints.push(pt.val);
                labels.push(pt.label);
            });
        }

        if (dataPoints.length === 1) {
            dataPoints.unshift(dataPoints[0]);
            labels.unshift('Start');
        }

        if (dataPoints.length > 0) {
            chartData = { labels, datasets: [{ data: dataPoints }] };
            showChart = true;
        }
    }

    const renderGlassButton = () => {
        if (Platform.OS === 'ios' && isLiquidGlassAvailable()) {
            return (
                <GlassView intensity={0.8} tint="light" style={styles.glassBtn}>
                    <MaterialCommunityIcons name="plus" size={24} color="#007AFF" />
                </GlassView>
            );
        }
        return (
            <BlurView tint="light" intensity={80} style={styles.glassBtn}>
                <MaterialCommunityIcons name="plus" size={24} color="#007AFF" />
            </BlurView>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
            
            <View style={styles.headerRow}>
                {/* ZEEGO NATIVE DROPDOWN ROOT */}
                <DropdownMenu.Root>
                    <DropdownMenu.Trigger>
                        <View style={[styles.garageSelector, vehicles.length <= 1 && { opacity: 1 }]}>
                            <MaterialCommunityIcons
                                name={selectedVehicleId === 'all' ? 'garage' : (activeVehicle?.imageUri || 'car') as any}
                                size={22}
                                color={selectedVehicleId === 'all' ? '#007AFF' : (activeVehicle?.color || '#007AFF')}
                            />
                            <Text style={styles.garageSelectorText}>
                                {vehicles.length === 0
                                    ? 'No Vehicles'
                                    : (selectedVehicleId === 'all'
                                        ? 'All Vehicles'
                                        : (activeVehicle?.makeModel || activeVehicle?.name || 'My Vehicle'))}
                            </Text>
                            {vehicles.length > 1 && (
                                <MaterialCommunityIcons name="chevron-down" size={18} color="#666" />
                            )}
                        </View>
                    </DropdownMenu.Trigger>

                    {/* THIS RENDERS AS THE ACTUAL NATIVE APPLE MENU */}
                    <DropdownMenu.Content>
                        {vehicles.length > 1 && (
                            <>
                                <DropdownMenu.CheckboxItem
                                    key="all"
                                    value={selectedVehicleId === 'all'}
                                    onValueChange={() => setSelectedVehicleId('all')}
                                >
                                    <DropdownMenu.ItemIndicator />
                                    <DropdownMenu.ItemTitle>All Vehicles</DropdownMenu.ItemTitle>
                                </DropdownMenu.CheckboxItem>

                                <DropdownMenu.Group>
                                    {vehicles.map((v) => (
                                        <DropdownMenu.CheckboxItem
                                            key={v.id}
                                            value={selectedVehicleId === v.id}
                                            onValueChange={() => setSelectedVehicleId(v.id)}
                                        >
                                            <DropdownMenu.ItemIndicator />
                                            <DropdownMenu.ItemTitle>{v.makeModel || v.name || 'Unnamed Vehicle'}</DropdownMenu.ItemTitle>
                                        </DropdownMenu.CheckboxItem>
                                    ))}
                                </DropdownMenu.Group>
                            </>
                        )}
                    </DropdownMenu.Content>
                </DropdownMenu.Root>

                <TouchableOpacity style={styles.glassBtnWrapper} onPress={() => router.push('/add' as any)}>
                    {renderGlassButton()}
                </TouchableOpacity>
            </View>

            <View style={styles.filterContainer}>
                {['Week', 'Month', 'Year', 'All'].map((mode) => (
                    <TouchableOpacity key={mode} style={[styles.filterBtn, viewMode === mode && styles.filterBtnActive]} onPress={() => { setViewMode(mode); setRefDate(new Date()); }}>
                        <Text style={[styles.filterText, viewMode === mode && styles.filterTextActive]}>{mode}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.paginator}>
                <TouchableOpacity onPress={() => changePeriod(-1)} disabled={viewMode === 'All'} style={styles.pageBtn}><Text style={styles.pageArrow}>{viewMode === 'All' ? '' : '◀'}</Text></TouchableOpacity>
                <Text style={styles.pageLabel}>{getPeriodLabel()}</Text>
                <TouchableOpacity onPress={() => changePeriod(1)} disabled={viewMode === 'All' || !canGoForward} style={styles.pageBtn}><Text style={[styles.pageArrow, (!canGoForward || viewMode === 'All') && { opacity: 0.3 }]}>{viewMode === 'All' ? '' : '▶'}</Text></TouchableOpacity>
            </View>

            <FlatList
                data={recentLogs}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: 130 }}
                ListHeaderComponent={
                    <View>
                        <View style={styles.statsCard}>
                            <Text style={styles.statText}>Total Spent: {currency}{displaySpent.toFixed(2)}</Text>
                            <Text style={styles.statText}>Avg Price: {currency}{avgPricePerUnit.toFixed(2)}/{unitLabel}</Text>
                            <Text style={styles.statText}>Avg Efficiency: {displayEfficiency.toFixed(2)} {efficiencyLabel}</Text>
                            <Text style={styles.statText}>Fill-ups: {displayLogs.length}</Text>
                        </View>
                        
                        <View style={styles.chartContainer}>
                            <View style={styles.chartToggleContainer}>
                                <TouchableOpacity style={[styles.chartToggleBtn, chartType === 'efficiency' && styles.chartToggleBtnActive]} onPress={() => setChartType('efficiency')}><Text style={[styles.chartToggleText, chartType === 'efficiency' && styles.chartToggleTextActive]}>Efficiency</Text></TouchableOpacity>
                                <TouchableOpacity style={[styles.chartToggleBtn, chartType === 'price' && styles.chartToggleBtnActive]} onPress={() => setChartType('price')}><Text style={[styles.chartToggleText, chartType === 'price' && styles.chartToggleTextActive]}>Price per {unitLabel}</Text></TouchableOpacity>
                            </View>
                            
                            {showChart ? (
                                <LineChart
                                    data={chartData}
                                    width={Dimensions.get('window').width - 70}
                                    height={180}
                                    yAxisLabel={chartType === 'price' ? currency : ""}
                                    yAxisSuffix={chartType === 'efficiency' ? ` ${efficiencyLabel}` : ""}
                                    yAxisInterval={1}
                                    fromZero={true}
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
                                    style={{ marginVertical: 10, borderRadius: 12 }}
                                />
                            ) : (
                                <View style={styles.emptyChartBlock}>
                                    <MaterialCommunityIcons name="chart-line-variant" size={40} color="#E5E5EA" />
                                    <Text style={styles.emptyChartText}>Log your next fill-up to unlock this chart</Text>
                                </View>
                            )}
                        </View>
                        
                        <Text style={styles.listHeader}>Recent Fill-ups</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <View style={styles.logItem}>
                        <View>
                            <Text style={styles.logDate}>{item.date}</Text>
                            <Text style={styles.logSubText}>Odo: {item.odometer} | Cost: {currency}{item.price || item.totalCost}</Text>
                        </View>
                        <TouchableOpacity onPress={() => deleteLog(item.id)} style={styles.deleteButton}><Text style={styles.deleteText}>Delete</Text></TouchableOpacity>
                    </View>
                )}
                ListFooterComponent={
                    displayLogs.length > 5 ? (
                        <TouchableOpacity style={styles.historyBridgeBtn} onPress={() => router.navigate('/history')}>
                            <Text style={styles.historyBridgeText}>See Full History</Text>
                            <MaterialCommunityIcons name="chevron-right" size={20} color="#007AFF" />
                        </TouchableOpacity>
                    ) : null
                }
                ListEmptyComponent={<Text style={styles.emptyText}>No logs found for this period.</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f2f2f7' },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, zIndex: 10 },
    garageSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    garageSelectorText: { fontSize: 16, fontWeight: 'bold', color: '#333', marginHorizontal: 8 },
    glassBtnWrapper: { borderRadius: 25, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
    glassBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.4)' },
    filterContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    filterBtn: { flex: 1, paddingVertical: 8, marginHorizontal: 4, backgroundColor: '#e5e5ea', borderRadius: 20, alignItems: 'center' },
    filterBtnActive: { backgroundColor: '#007AFF' },
    filterText: { color: '#333', fontWeight: 'bold', fontSize: 13 },
    filterTextActive: { color: '#fff' },
    paginator: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingHorizontal: 10 },
    pageBtn: { padding: 10 },
    pageArrow: { fontSize: 20, color: '#007AFF' },
    pageLabel: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    statsCard: { backgroundColor: 'white', padding: 20, borderRadius: 12, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    statText: { fontSize: 16, marginTop: 5, color: '#444' },
    chartContainer: { backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 15 },
    chartToggleContainer: { flexDirection: 'row', backgroundColor: '#E5E5EA', borderRadius: 8, padding: 3, marginBottom: 15 },
    chartToggleBtn: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 6 },
    chartToggleBtnActive: { backgroundColor: '#FFFFFF', elevation: 2 },
    chartToggleText: { fontSize: 13, color: '#666666', fontWeight: '500' },
    chartToggleTextActive: { color: '#000000', fontWeight: '600' },
    emptyChartBlock: { height: 180, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
    emptyChartText: { color: '#999', marginTop: 10, textAlign: 'center', fontSize: 14, fontWeight: '500' },
    listHeader: { fontSize: 18, fontWeight: 'bold', marginTop: 10, marginBottom: 10, color: '#333' },
    logItem: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 5, elevation: 1 },
    logDate: { fontWeight: 'bold', marginBottom: 5, fontSize: 16, color: '#333' },
    logSubText: { color: '#666', fontSize: 14 },
    emptyText: { textAlign: 'center', marginTop: 20, color: '#666' },
    deleteButton: { backgroundColor: '#ff3b30', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
    deleteText: { color: 'white', fontWeight: '600', fontSize: 13 },
    historyBridgeBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 15, marginTop: 5, backgroundColor: '#e5e5ea', borderRadius: 12 },
    historyBridgeText: { color: '#007AFF', fontWeight: 'bold', fontSize: 16, marginRight: 5 }
});
