import { StatusBar } from "expo-status-bar";
import { View, Text, StyleSheet } from "react-native";

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Retail Audio Engine</Text>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#F8FAFC",
    fontSize: 24,
    fontWeight: "600",
  },
});
