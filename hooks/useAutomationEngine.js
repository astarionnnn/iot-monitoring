"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, onSnapshot, updateDoc } from "firebase/firestore";

const DEFAULT_RULES = {
    fan: {
        enabled: true,
        mode: "auto",
        condition: "temperature",
        operator: ">",
        value: 32,
        autoOff: true,
        autoOffValue: 28,
    },
    pump: {
        enabled: true,
        mode: "auto",
        condition: "soil_moisture",
        operator: "<",
        value: 30,
        autoOff: true,
        autoOffValue: 50,
        duration: 30
    },
    light: {
        enabled: false,
        mode: "auto",
        condition: "humidity",
        operator: "<",
        value: 40,
        autoOff: true,
        autoOffValue: 60
    }
};

const COOLDOWN_MS = 10000; // 10 seconds

export default function useAutomationEngine(sensorData, onRuleTriggered) {
    const [rules, setRules] = useState(null);
    const [loading, setLoading] = useState(true);
    const lastExecution = useRef({ fan: 0, pump: 0, light: 0 });
    const pumpTimeout = useRef(null);

    // Subscribe to rules from Firebase
    useEffect(() => {
        const docRef = doc(db, "automation", "rules");
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                setRules(docSnap.data());
            } else {
                setDoc(docRef, DEFAULT_RULES);
                setRules(DEFAULT_RULES);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const getUnit = useCallback((condition) => {
        if (condition === "temperature") return "°C";
        return "%";
    }, []);

    const toggleDevice = useCallback(async (device, status, triggerReason) => {
        try {
            const docRef = doc(db, "devices", "controls");
            const deviceSnap = await getDoc(docRef);
            const currentStatus = deviceSnap.exists() ? deviceSnap.data()[device] : false;

            if (currentStatus !== status) {
                await updateDoc(docRef, { [device]: status });
                if (onRuleTriggered) {
                    onRuleTriggered(device, status, triggerReason);
                }
            }
        } catch (error) {
            console.error(`Error toggling ${device}:`, error);
        }
    }, [onRuleTriggered]);

    const updateRule = useCallback(async (device, updates) => {
        try {
            const docRef = doc(db, "automation", "rules");
            const currentRules = rules || {};
            await updateDoc(docRef, {
                [`${device}`]: { ...currentRules[device], ...updates }
            });
        } catch (error) {
            console.error(`Error updating ${device} rule:`, error);
        }
    }, [rules]);

    // Automation Logic - runs whenever sensorData or rules change
    useEffect(() => {
        if (!rules || !sensorData || loading) return;

        const now = Date.now();

        const processRule = (device, sensorValue) => {
            const rule = rules[device];
            if (!rule || !rule.enabled || rule.mode === "manual") return;

            // Check cooldown
            if (now - lastExecution.current[device] < COOLDOWN_MS) return;

            const shouldTurnOn = rule.operator === ">"
                ? sensorValue > rule.value
                : sensorValue < rule.value;

            const shouldTurnOff = rule.autoOff && (
                rule.operator === ">"
                    ? sensorValue <= rule.autoOffValue
                    : sensorValue >= rule.autoOffValue
            );

            if (shouldTurnOn) {
                lastExecution.current[device] = now;
                toggleDevice(device, true, `${rule.condition}: ${sensorValue.toFixed(1)}${getUnit(rule.condition)}`);

                // Handle Pump Duration
                if (device === "pump" && rule.duration > 0) {
                    if (pumpTimeout.current) clearTimeout(pumpTimeout.current);
                    pumpTimeout.current = setTimeout(async () => {
                        const latestDoc = await getDoc(doc(db, "automation", "rules"));
                        if (latestDoc.exists() && latestDoc.data().pump.mode === "auto") {
                            toggleDevice("pump", false, `Timer ${rule.duration}s selesai`);
                        }
                    }, rule.duration * 1000);
                }
            } else if (shouldTurnOff) {
                lastExecution.current[device] = now;
                toggleDevice(device, false, `${rule.condition}: ${sensorValue.toFixed(1)}${getUnit(rule.condition)}`);
            }
        };

        processRule("fan", sensorData.temperature);
        processRule("pump", sensorData.soil_moisture);
        processRule("light", sensorData.humidity);

    }, [sensorData, rules, loading, toggleDevice, getUnit]);

    // Cleanup pump timeout on unmount
    useEffect(() => {
        return () => {
            if (pumpTimeout.current) clearTimeout(pumpTimeout.current);
        };
    }, []);

    return { rules, loading, updateRule };
}
