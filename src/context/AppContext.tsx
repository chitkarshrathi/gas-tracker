import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';


const AppContext = createContext<any>(null);

export function AppProvider({children}: {children: React.ReactNode}) {
    const[unitSystem, setUnitSystem] = useState('Imperial');
    const[logs, setLogs] = useState<any[]>([]);
    const[isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
    const loadLogs = async () => {
        try {
            const storedLogs = await AsyncStorage.getItem('@gas_logs');
            if (storedLogs !== null) {
                setLogs(JSON.parse(storedLogs));
            }
        } catch (e) {
            console.error("Failed to load logs.", e);
        }
    };
    loadLogs();
}, []);


    const addLog = async (odometer:number, fuel: number, price: number, fuelType: string) => {
        const date = new Date().toLocaleDateString('en-US', {month: 'numeric', day: 'numeric', year: 'numeric'});

        const newLog = {
            id: Date.now().toString(),
            date,
            odometer,
            fuel,
            price,
            fuelType,
        }
    

        const updatedLogs = [newLog, ...logs];

        setLogs(updatedLogs);

        try {
            await AsyncStorage.setItem('@gas_logs', JSON.stringify(updatedLogs));
        } catch (e) {
            console.error("Failed to save log.", e);
        }
    
    }

        const deleteLog = async (id: string) => {
            const updatedLogs = logs.filter(log => log.id !== id);
            setLogs(updatedLogs);
            try {
                await AsyncStorage.setItem('@gas_logs', JSON.stringify(updatedLogs));
            } catch (e) {
                console.error("Failed to delete log.", e);
            }
        }


        const totalSpent = logs.reduce((sum, log) => sum + Number(log.price), 0);

        let avgEfficiency = 0;
        if (logs.length > 1) {
            const sorted = [...logs].sort((a, b) => Number(a.odometer) - Number(b.odometer));
            const totalDistance = Number(sorted[sorted.length - 1].odometer) - Number(sorted[0].odometer);
            const totalFuel = logs.reduce((sum, log) => sum + Number(log.fuel), 0);
            if (totalFuel > 0) {
                avgEfficiency = totalDistance / totalFuel;
            }
        }

        return (
            <AppContext.Provider value={{unitSystem, setUnitSystem, logs, addLog, deleteLog, totalSpent, avgEfficiency}}>
                {children}
            </AppContext.Provider>
        );
    }

    export const useAppContext = () => useContext(AppContext);