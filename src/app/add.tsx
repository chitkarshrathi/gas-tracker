import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Button, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAppContext } from '../context/AppContext';

export default function AddLogScreen() {
    const router = useRouter();

    const {addLog, unitSystem} = useAppContext();

    const [odometer, setOdometer] = useState('');
    const [fuel, setFuel] = useState('');
    const [price, setPrice] = useState('');
    const [fuelType, setFuelType] = useState('Regular');
    const [date, setDate] = useState(new Date());
    const distLabel = unitSystem === 'Imperial' ? 'miles' : 'km';
    const fuelLabel = unitSystem === 'Imperial' ? 'gallons' : 'liters';

    const handleSave = () => {
        const formattedDate = date.toLocaleDateString('en-US', {month: 'numeric', day: 'numeric', year: 'numeric'});
        addLog(parseFloat(odometer), parseFloat(fuel), parseFloat(price), fuelType, formattedDate);
        router.back();
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Odometer ({distLabel}):</Text>
            <TextInput
                style={styles.input} keyboardType="numeric"
                value={odometer} onChangeText={setOdometer}
            />

            <Text style={styles.label}>Date:</Text>
            <DateTimePicker
                value={date}
                mode="date"
                display="compact"
                onValueChange={(event, selectedDate) => {
                    if (selectedDate) {
                        setDate(selectedDate);
                    }
                }}
                style={{alignSelf: 'flex-start', marginBottom: 15, marginTop: 5}}
            />

            <Text style={styles.label}>Fuel Added ({fuelLabel}):</Text>
            <TextInput
                style={styles.input} keyboardType="numeric"
                value={fuel} onChangeText={setFuel}
            />

            <Text style={styles.label}>Total Cost ($)</Text>
            <TextInput
                style={styles.input} keyboardType="numeric"
                value={price} onChangeText={setPrice}
            />

            <Text style={styles.label}>Fuel Type:</Text>
            <View style={styles.fuelTypeContainer}>
                {['Regular', 'Midgrade', 'Premium'].map((type) => (
                    <TouchableOpacity
                        key={type}
                        onPress={() => setFuelType(type)}
                        style={[styles.typeButton, fuelType === type && styles.typeButtonActive]}
                    >
                        <Text style={[styles.typeText, fuelType === type && styles.typeTextActive]}>{type}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.buttonContainer}>
                <Button title="Save" onPress={handleSave} />
                </View>
        </View>
    );
}


const styles = StyleSheet.create({
    container: {flex: 1, padding: 20, backgroundColor: '#ffffff'},
    label: {fontSize: 16, marginBottom: 5, fontWeight: 'bold', marginTop: 15},
    input: {borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8, fontSize: 16},
    buttonContainer: {marginTop: 30},
    fuelTypeContainer: {
        flexDirection: 'row', // THIS is what forces them side-by-side
        justifyContent: 'space-between',
        marginTop: 10,
        marginBottom: 20,
    },
    typeButton: {
        flex: 1, // Makes all 3 buttons take up exactly 1/3 of the screen width
        marginHorizontal: 5, // Adds a little gap between the buttons
        paddingVertical: 15, // Makes the buttons taller and easier to tap
        borderWidth: 2, 
        borderColor: '#ccc', 
        borderRadius: 8, 
        alignItems: 'center', // Centers text horizontally
        justifyContent: 'center', // Centers text vertically
        backgroundColor: '#f8f8f8',
    },
    typeButtonActive: {
        backgroundColor: '#007AFF', // Lights up blue when tapped
        borderColor: '#007AFF',
    },
    typeText: {
        color: '#333', 
        fontSize: 15, 
        fontWeight: 'bold' // Makes the unselected text easier to read
    },
    typeTextActive: {
        color: '#fff', 
        fontWeight: 'bold'
    },
});