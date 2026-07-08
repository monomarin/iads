import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { registerNode, sendHeartbeat } from "./src/services/api";
import { addBluetoothListener, sendLECommand } from "./src/services/bluetooth";
import { registerForPushNotifications, setupNotificationHandler } from "./src/services/notifications";
import { startAmbientMonitoring, stopAmbientMonitoring, getCurrentVolume } from "./src/services/ambient";
const STORE_ID = process.env.EXPO_PUBLIC_STORE_ID ?? "00000000-0000-0000-0000-000000000003";
const HEARTBEAT_INTERVAL = 30000;
export default function App() {
    const [bluetooth, setBluetooth] = useState({
        isConnected: false, deviceName: null, volume: 50, isPlaying: false,
    });
    const [ambientVolume, setAmbientVolume] = useState(70);
    const [status, setStatus] = useState("initializing");
    const [log, setLog] = useState([]);
    function addLog(msg) {
        setLog((prev) => [...prev.slice(-50), `${new Date().toLocaleTimeString()} ${msg}`]);
    }
    useEffect(() => {
        async function init() {
            try {
                addLog("Registering edge node...");
                const node = await registerNode({
                    storeId: STORE_ID,
                    name: `Edge-${Math.random().toString(36).slice(2, 8)}`,
                    platform: "android",
                    firmwareVersion: "1.0.0",
                });
                addLog(`Registered: ${node.name} (${node.id})`);
                setStatus("registered");
                const token = await registerForPushNotifications();
                if (token) {
                    addLog(`Push token: ${token.slice(0, 20)}...`);
                }
                const sub = setupNotificationHandler((command, _payload) => {
                    addLog(`Push command: ${command}`);
                    sendLECommand(command).catch(() => { });
                });
                const unsusbBluetooth = addBluetoothListener(setBluetooth);
                startAmbientMonitoring({
                    enabled: true, thresholds: [40, 65], nightCap: 50, manualOverrideUntil: null,
                }, node.id);
                const ambientInterval = setInterval(() => {
                    setAmbientVolume(getCurrentVolume());
                }, 1000);
                const interval = setInterval(async () => {
                    try {
                        await sendHeartbeat();
                    }
                    catch {
                        addLog("Heartbeat failed");
                    }
                }, HEARTBEAT_INTERVAL);
                return () => {
                    clearInterval(interval);
                    clearInterval(ambientInterval);
                    stopAmbientMonitoring();
                    sub.remove();
                    unsusbBluetooth();
                };
            }
            catch (err) {
                addLog(`Init error: ${err}`);
                setStatus("error");
            }
        }
        const cleanup = init();
        return () => { cleanup.then((fn) => fn?.()); };
    }, []);
    return (<View style={styles.container}>
      <Text style={styles.title}>Retail Audio Engine</Text>
      <Text style={styles.subtitle}>Edge Node</Text>

      <View style={styles.statusContainer}>
        <View style={[styles.dot, { backgroundColor: status === "registered" ? "#22C55E" : "#EF4444" }]}/>
        <Text style={styles.statusText}>{status}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.label}>Bluetooth:</Text>
        <Text style={styles.value}>{bluetooth.isConnected ? `Connected to ${bluetooth.deviceName}` : "Disconnected"}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.label}>Volume:</Text>
        <Text style={styles.value}>{bluetooth.volume}%</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.label}>Playing:</Text>
        <Text style={styles.value}>{bluetooth.isPlaying ? "Yes" : "No"}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.label}>Ambient Volume:</Text>
        <Text style={styles.value}>{ambientVolume}%</Text>
      </View>

      <View style={styles.logContainer}>
        <Text style={styles.logTitle}>Log</Text>
        {log.map((entry, i) => (<Text key={i} style={styles.logEntry}>{entry}</Text>))}
      </View>

      <StatusBar style="light"/>
    </View>);
}
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0F172A", padding: 20, paddingTop: 60 },
    title: { color: "#F8FAFC", fontSize: 24, fontWeight: "600" },
    subtitle: { color: "#6366F1", fontSize: 14, marginBottom: 20 },
    statusContainer: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
    dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
    statusText: { color: "#94A3B8", fontSize: 14, textTransform: "capitalize" },
    infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
    label: { color: "#94A3B8", fontSize: 14 },
    value: { color: "#F8FAFC", fontSize: 14 },
    logContainer: { flex: 1, marginTop: 20, backgroundColor: "#1E293B", borderRadius: 8, padding: 12 },
    logTitle: { color: "#6366F1", fontSize: 12, fontWeight: "600", marginBottom: 8 },
    logEntry: { color: "#94A3B8", fontSize: 11, fontFamily: "monospace", marginBottom: 2 },
});
