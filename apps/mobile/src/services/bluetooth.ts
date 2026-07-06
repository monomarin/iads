export type BluetoothCommand = "play" | "pause" | "skip" | "volume_up" | "volume_down" | "reboot";

export interface BluetoothState {
  isConnected: boolean;
  deviceName: string | null;
  volume: number;
  isPlaying: boolean;
}

let state: BluetoothState = {
  isConnected: false,
  deviceName: null,
  volume: 50,
  isPlaying: false,
};

const listeners: Array<(state: BluetoothState) => void> = [];

export function addBluetoothListener(listener: (state: BluetoothState) => void) {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

function notify() {
  for (const listener of listeners) {
    listener(state);
  }
}

export function getBluetoothState(): BluetoothState {
  return { ...state };
}

export async function connectA2DP(deviceAddress: string) {
  console.log(`[Bluetooth] Connecting A2DP to ${deviceAddress}`);
  state = { ...state, isConnected: true, deviceName: deviceAddress };
  notify();
}

export async function disconnectA2DP() {
  console.log("[Bluetooth] Disconnecting A2DP");
  state = { ...state, isConnected: false, deviceName: null };
  notify();
}

export async function sendLECommand(command: BluetoothCommand) {
  console.log(`[Bluetooth LE] Sending command: ${command}`);
  switch (command) {
    case "play":
      state = { ...state, isPlaying: true };
      break;
    case "pause":
      state = { ...state, isPlaying: false };
      break;
    case "skip":
      console.log("[Bluetooth] Skipping track");
      break;
    case "volume_up":
      state = { ...state, volume: Math.min(100, state.volume + 10) };
      break;
    case "volume_down":
      state = { ...state, volume: Math.max(0, state.volume - 10) };
      break;
    case "reboot":
      console.log("[Bluetooth] Reboot command received");
      break;
  }
  notify();
}

export function startScan() {
  console.log("[Bluetooth] Scanning for A2DP devices...");
}

export function stopScan() {
  console.log("[Bluetooth] Scan stopped");
}
