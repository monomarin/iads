import { Platform } from "react-native";
let Notifications = null;
try {
    Notifications = require("expo-notifications");
}
catch {
    console.warn("[FCM] expo-notifications not available");
}
export async function registerForPushNotifications() {
    if (!Notifications) {
        console.warn("[FCM] Notifications not available");
        return null;
    }
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }
    if (finalStatus !== "granted") {
        console.warn("[FCM] Push notification permission not granted");
        return null;
    }
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;
    if (Platform.OS === "android") {
        await Notifications?.setNotificationChannelAsync?.("default", {
            name: "default",
            importance: 5,
        });
    }
    return token;
}
export function setupNotificationHandler(onCommand) {
    if (!Notifications) {
        console.warn("[FCM] Notifications not available, returning noop subscription");
        return { remove: () => { } };
    }
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        if (data?.command) {
            onCommand(data.command, data);
        }
    });
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: false,
            shouldSetBadge: false,
        }),
    });
    return subscription;
}
