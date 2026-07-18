import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

// 1. DEFINE OUR DATA STRUCTURES
type Vehicle = {
    id: string;
    makeModel: string; // e.g., "Ford Figo Aspire"
    color: string;     // Hex code for UI tinting
    imageUri: string | null; // Local camera roll path
};

type Log = {
    id: string;
    vehicleId: string; // Ties the log to a specific car
    odometer: string;
    fuel: string; // using your preferred totalFuel naming convention
    price: string;
    fuelType: string;
    date: string;
};

type AppContextType = {
    vehicles: Vehicle[];
    activeVehicleId: string | null;
    logs: Log[];
    unitSystem: string;
    addVehicle: (makeModel: string, color: string, imageUri: string | null) => void;
    setActiveVehicle: (id: string) => void;
    addLog: (odometer: number, totalFuel: number, price: number, fuelType: string, date: string) => void;
    deleteLog: (id: string) => void;
    toggleUnitSystem: () => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [activeVehicleId, setActiveVehicleId] = useState<string | null>(null);
    const [logs, setLogs] = useState<Log[]>([]);
    const [unitSystem, setUnitSystem] = useState('Imperial');

// 2. LOAD DATA ON BOOT
    useEffect(() => {
        const loadData = async () => {
            try {
                const storedVehicles = await AsyncStorage.getItem('@vehicles');
                const storedActive = await AsyncStorage.getItem('@activeVehicle');
                const storedLogs = await AsyncStorage.getItem('@logs');
                const storedUnit = await AsyncStorage.getItem('@unitSystem');

                let parsedVehicles = storedVehicles ? JSON.parse(storedVehicles) : [];
                let parsedLogs = storedLogs ? JSON.parse(storedLogs) : [];

                // MIGRATION GUARD: Ensure there is ALWAYS at least one vehicle
                if (parsedVehicles.length === 0) {
                    const defaultCar = { id: Date.now().toString(), makeModel: 'My Vehicle', color: '#007AFF', imageUri: 'car' };
                    parsedVehicles = [defaultCar];
                    
                    // If you have old logs, attach them to this default car
                    if (parsedLogs.length > 0) {
                        parsedLogs = parsedLogs.map((log: any) => ({ ...log, vehicleId: defaultCar.id }));
                    }
                    
                    await AsyncStorage.setItem('@vehicles', JSON.stringify(parsedVehicles));
                    await AsyncStorage.setItem('@logs', JSON.stringify(parsedLogs));
                    await AsyncStorage.setItem('@activeVehicle', defaultCar.id);
                }

                setVehicles(parsedVehicles);
                if (storedActive) setActiveVehicleId(storedActive);
                else if (parsedVehicles.length > 0) setActiveVehicleId(parsedVehicles[0].id);
                
                setLogs(parsedLogs);
                if (storedUnit) setUnitSystem(storedUnit);
                
            } catch (error) {
                console.error("Error loading data", error);
            }
        };
        loadData();
    }, []);

    // 3. VEHICLE FUNCTIONS
    const addVehicle = async (makeModel: string, color: string, imageUri: string | null) => {
        const newVehicle = { id: Date.now().toString(), makeModel, color, imageUri };
        const updatedVehicles = [...vehicles, newVehicle];
        setVehicles(updatedVehicles);
        await AsyncStorage.setItem('@vehicles', JSON.stringify(updatedVehicles));
        
        // Auto-select the newly added vehicle
        setActiveVehicleId(newVehicle.id);
        await AsyncStorage.setItem('@activeVehicle', newVehicle.id);
    };

    const setActiveVehicle = async (id: string) => {
        setActiveVehicleId(id);
        await AsyncStorage.setItem('@activeVehicle', id);
    };

    // 4. LOG FUNCTIONS
    const addLog = async (odometer: number, totalFuel: number, price: number, fuelType: string, date: string) => {
        if (!activeVehicleId) return; // Guard against saving a log without a car
        
        const newLog: Log = {
            id: Date.now().toString(),
            vehicleId: activeVehicleId,
            odometer: odometer.toString(),
            fuel: totalFuel.toString(),
            price: price.toString(),
            fuelType,
            date
        };
        const updatedLogs = [...logs, newLog];
        setLogs(updatedLogs);
        await AsyncStorage.setItem('@logs', JSON.stringify(updatedLogs));
    };

    const deleteLog = async (id: string) => {
        const updatedLogs = logs.filter(log => log.id !== id);
        setLogs(updatedLogs);
        await AsyncStorage.setItem('@logs', JSON.stringify(updatedLogs));
    };

    // 5. SETTINGS
    const toggleUnitSystem = async () => {
        const newSystem = unitSystem === 'Imperial' ? 'Metric' : 'Imperial';
        setUnitSystem(newSystem);
        await AsyncStorage.setItem('@unitSystem', newSystem);
    };

    return (
        <AppContext.Provider value={{ 
            vehicles, activeVehicleId, logs, unitSystem, 
            addVehicle, setActiveVehicle, addLog, deleteLog, toggleUnitSystem 
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useAppContext must be used within an AppProvider');
    return context;
};