import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';

export default function SettingsScreen() {
    const insets = useSafeAreaInsets();
    const { unitSystem, toggleUnitSystem } = useAppContext();

    const isMetric = unitSystem === 'Metric';

    return (
        <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
            <Text style={styles.pageTitle}>Settings</Text>

            <Text style={styles.sectionHeader}>PREFERENCES</Text>
            <View style={styles.card}>
                <View style={styles.settingRow}>
                    <View style={styles.settingLabelRow}>
                        <View style={[styles.iconBox, { backgroundColor: '#007AFF' }]}>
                            <MaterialCommunityIcons name="ruler" size={18} color="#fff" />
                        </View>
                        <Text style={styles.settingText}>Use Metric System</Text>
                    </View>
                    <Switch
                        value={isMetric}
                        onValueChange={toggleUnitSystem}
                        trackColor={{ false: '#e5e5ea', true: '#34C759' }}
                    />
                </View>
                <Text style={styles.helperText}>
                    {isMetric ? 'Using Liters (L) and Kilometers (km)' : 'Using Gallons (gal) and Miles (mi)'}
                </Text>
            </View>

            <Text style={styles.sectionHeader}>DATA & PRIVACY</Text>
            <View style={styles.card}>
                <TouchableOpacity style={styles.settingRowAction}>
                    <View style={styles.settingLabelRow}>
                        <View style={[styles.iconBox, { backgroundColor: '#34C759' }]}>
                            <MaterialCommunityIcons name="export" size={18} color="#fff" />
                        </View>
                        <Text style={styles.settingText}>Export CSV Data</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color="#c7c7cc" />
                </TouchableOpacity>
                <View style={styles.divider} />
                <TouchableOpacity style={styles.settingRowAction}>
                    <View style={styles.settingLabelRow}>
                        <View style={[styles.iconBox, { backgroundColor: '#ff3b30' }]}>
                            <MaterialCommunityIcons name="delete-empty" size={18} color="#fff" />
                        </View>
                        <Text style={[styles.settingText, { color: '#ff3b30' }]}>Erase All Data</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color="#c7c7cc" />
                </TouchableOpacity>
            </View>

            <Text style={styles.footerText}>Gas Tracker v1.0.0</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 20, backgroundColor: '#f2f2f7' },
    pageTitle: { fontSize: 32, fontWeight: 'bold', color: '#333', marginBottom: 20 },
    
    sectionHeader: { fontSize: 13, fontWeight: '600', color: '#8E8E93', marginLeft: 15, marginBottom: 8, marginTop: 25, letterSpacing: 0.5 },
    card: { backgroundColor: '#fff', borderRadius: 12, paddingVertical: 5, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 5, elevation: 1 },
    
    settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12 },
    settingRowAction: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12 },
    
    settingLabelRow: { flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    settingText: { fontSize: 16, color: '#333', fontWeight: '500' },
    
    helperText: { fontSize: 13, color: '#8E8E93', paddingHorizontal: 15, paddingBottom: 12, marginTop: -5 },
    divider: { height: 1, backgroundColor: '#f0f0f0', marginLeft: 60 },
    
    footerText: { textAlign: 'center', marginTop: 40, color: '#999', fontSize: 14 }
});
