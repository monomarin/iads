export async function sendPushNotification(fcmToken: string, title: string, body: string, data?: Record<string, string>) {
  const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY;
  if (!FCM_SERVER_KEY) {
    console.warn("FCM_SERVER_KEY not configured, skipping push notification");
    return;
  }
  const message = {
    to: fcmToken,
    notification: { title, body },
    data: data ?? {},
  };
  const res = await fetch("https://fcm.googleapis.com/fcm/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `key=${FCM_SERVER_KEY}`,
    },
    body: JSON.stringify(message),
  });
  if (!res.ok) {
    console.error("FCM push failed:", await res.text());
  }
}
