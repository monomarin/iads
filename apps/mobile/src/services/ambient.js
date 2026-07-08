const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:4000";
let deviceId = null;
let intervalId = null;
let telemetryIntervalId = null;
let currentVolume = 70;
let config = { enabled: true, thresholds: [40, 65], nightCap: 50, manualOverrideUntil: null };
export function setDeviceId(id) {
    deviceId = id;
}
function mapDbToVolume(db) {
    const [low, high] = config.thresholds;
    if (db < low)
        return 40;
    if (db > high)
        return 100;
    return 70;
}
function isNighttime() {
    const hour = new Date().getHours();
    return hour >= 23 || hour < 7;
}
let fadeInterval = null;
function applyFade(targetVolume) {
    if (fadeInterval)
        clearInterval(fadeInterval);
    const steps = 6;
    const increment = (targetVolume - currentVolume) / steps;
    let step = 0;
    fadeInterval = setInterval(() => {
        step++;
        if (step >= steps) {
            currentVolume = targetVolume;
            if (fadeInterval)
                clearInterval(fadeInterval);
            fadeInterval = null;
            return;
        }
        currentVolume = Math.round(currentVolume + increment);
    }, 500);
}
export function simulateAmbientReading(db) {
    if (!config.enabled)
        return;
    let volume = mapDbToVolume(db);
    if (isNighttime())
        volume = Math.min(volume, config.nightCap);
    if (config.manualOverrideUntil && new Date(config.manualOverrideUntil) > new Date()) {
        return;
    }
    applyFade(volume);
}
export function getCurrentVolume() {
    return currentVolume;
}
export function updateConfig(newConfig) {
    config = newConfig;
}
export function startAmbientMonitoring(cfg, devId) {
    config = cfg;
    deviceId = devId;
    if (intervalId)
        clearInterval(intervalId);
    intervalId = setInterval(() => {
        const simulatedDb = Math.floor(Math.random() * 60) + 20;
        simulateAmbientReading(simulatedDb);
    }, 5000);
    if (telemetryIntervalId)
        clearInterval(telemetryIntervalId);
    telemetryIntervalId = setInterval(async () => {
        if (!deviceId)
            return;
        try {
            await fetch(`${API_URL}/api/edge-nodes/${deviceId}/ambient-telemetry`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: "Bearer edge-node" },
                body: JSON.stringify({ volume: currentVolume, timestamp: new Date().toISOString() }),
            });
        }
        catch {
            console.warn("[Ambient] Telemetry send failed");
        }
    }, 3600000);
}
export function stopAmbientMonitoring() {
    if (intervalId)
        clearInterval(intervalId);
    if (telemetryIntervalId)
        clearInterval(telemetryIntervalId);
}
