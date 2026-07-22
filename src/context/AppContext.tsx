import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Vehicle = {
    id: string;
    makeModel: string;
    color: string;
    imageUri: string | null;
    vehicleType: 'gas' | 'diesel' | 'electric'; // Add this field
};

export type Log = { id: string; vehicleId: string; odometer: string; fuel: string; price: string; fuelType: string; date: string };

type AppContextType = {
    vehicles: Vehicle[];
    activeVehicleId: string | null;
    logs: Log[];
    unitSystem: 'Imperial' | 'Metric';
    addVehicle: (makeModel: string, color: string, imageUri: string | null) => void;
    setActiveVehicle: (id: string) => void;
    addLog: (vehicleId: string, odometer: number, totalFuel: number, price: number, fuelType: string, date: string) => void;
    deleteLog: (id: string) => void;
    toggleUnitSystem: () => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [activeVehicleId, setActiveVehicleId] = useState<string | null>(null);
    const [logs, setLogs] = useState<Log[]>([]);
    const [unitSystem, setUnitSystem] = useState<'Imperial' | 'Metric'>('Imperial');

    useEffect(() => {
        const loadData = async () => {
            const storedVehicles = await AsyncStorage.getItem('@vehicles');
            const storedLogs = await AsyncStorage.getItem('@logs');
            const storedUnits = await AsyncStorage.getItem('@unitSystem');
            if (storedVehicles) setVehicles(JSON.parse(storedVehicles));
            if (storedLogs) setLogs(JSON.parse(storedLogs));
            if (storedUnits) setUnitSystem(storedUnits as 'Imperial' | 'Metric');
        };
        loadData();
    }, []);

    const toggleUnitSystem = async () => {
            const newSystem = unitSystem === 'Imperial' ? 'Metric' : 'Imperial';
            const isToMetric = newSystem === 'Metric';
            
            const convertedLogs = logs.map(log => {
                const oldFuel = Number(log.fuel);
                const oldOdo = Number(log.odometer);
                const oldPrice = Number(log.price); // Price stays static!

                // Conversion factors
                const fuelFactor = 3.78541; // Gal <-> L
                const distFactor = 1.60934; // Mi <-> Km

                return {
                    ...log,
                    // Fuel: Convert volume, Price: keep same
                    fuel: (isToMetric ? oldFuel * fuelFactor : oldFuel / fuelFactor).toFixed(2),
                    odometer: Math.round(isToMetric ? oldOdo * distFactor : oldOdo / distFactor).toString(),
                    price: oldPrice.toFixed(2)
                };
            });

            setUnitSystem(newSystem);
            setLogs(convertedLogs);
            await AsyncStorage.setItem('@unitSystem', newSystem);
            await AsyncStorage.setItem('@logs', JSON.stringify(convertedLogs));
        };

    const addVehicle = async (makeModel: string, color: string, imageUri: string | null) => {
        const newVehicle = { id: Date.now().toString(), makeModel, color, imageUri };
        const updated = [...vehicles, newVehicle];
        setVehicles(updated);
        await AsyncStorage.setItem('@vehicles', JSON.stringify(updated));
    };

    const addLog = async (vehicleId: string, odometer: number, totalFuel: number, price: number, fuelType: string, date: string) => {
        const newLog = { id: Date.now().toString(), vehicleId, odometer: odometer.toString(), fuel: totalFuel.toString(), price: price.toString(), fuelType, date };
        const updated = [...logs, newLog];
        setLogs(updated);
        await AsyncStorage.setItem('@logs', JSON.stringify(updated));
    };

    const deleteLog = async (id: string) => {
        const updated = logs.filter(l => l.id !== id);
        setLogs(updated);
        await AsyncStorage.setItem('@logs', JSON.stringify(updated));
    };

    return (
        <AppContext.Provider value={{ vehicles, activeVehicleId, logs, unitSystem, addVehicle, setActiveVehicle: setActiveVehicleId, addLog, deleteLog, toggleUnitSystem }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useAppContext must be used within AppProvider');
    return context;
};
