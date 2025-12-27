import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";

export default function Navbar() {
  return (
    <View style={styles.nav}>
      <Text style={styles.logo}>Columbinizer</Text>

      <View style={styles.menu}>
        <TouchableOpacity onPress={() => router.push("/")}>
          <Text style={styles.menuText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/dashboard")}>
          <Text style={styles.menuText}>Dashboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  nav: {
    width: "100%",
    height: 70,
    backgroundColor: "#002467ff", 
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  logo: {
    color: "#ffffffff",
    fontSize: 20,
    fontWeight: "bold",
  },
  menu: {
    flexDirection: "row",
    gap: 40,
    alignSelf: "center",
  },
  menuText: {
    color: "white",
    fontSize: 16,
  },
});
