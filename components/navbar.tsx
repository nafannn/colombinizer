import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { router } from "expo-router";
import { supabase } from "../lib/supabase";

export default function Navbar() {
  const [email, setEmail] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setEmail(user.email ?? "User");
    } else {
      setEmail(null);
    }
  };

  useEffect(() => {
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setEmail(session.user.email ?? "User");
      } else {
        setEmail(null);
        setShowDropdown(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert("Error", error.message);
    } else {
      setEmail(null);
      setShowDropdown(false);
      router.replace("/(tabs)/home"); 
    }
  };

  return (
    <View style={styles.nav}>
      <Text style={styles.logo}>Colombinizer</Text>

      <View style={styles.menu}>
        <TouchableOpacity onPress={() => router.push("/(tabs)/home")}>
          <Text style={styles.menuText}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => router.push("/(tabs)/learn")}>
          <Text style={styles.menuText}>Learn</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/(tabs)/lab")}>
          <Text style={styles.menuText}>Virtual Lab</Text>
        </TouchableOpacity>

        {email && (
          <TouchableOpacity onPress={() => router.push("/(tabs)/history")}>
            <Text style={styles.menuText}>History</Text>
          </TouchableOpacity>
        )}

        {email ? (
          <View>
            <TouchableOpacity 
              onPress={() => setShowDropdown(!showDropdown)}
              style={styles.userButton}
            >
              <Text style={styles.menuText}>{email} ▾</Text>
            </TouchableOpacity>

            {showDropdown && (
              <View style={styles.dropdown}>
                <TouchableOpacity onPress={handleLogout} style={styles.dropdownItem}>
                  <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <TouchableOpacity 
            onPress={() => router.push("/(auth)/login")}
            style={[styles.userButton, { backgroundColor: "#4CAF50" }]}
          >
            <Text style={[styles.menuText, { fontWeight: "bold" }]}>Login</Text>
          </TouchableOpacity>
        )}
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
    zIndex: 10,
  },
  logo: { color: "white", fontSize: 20, fontWeight: "bold" },
  menu: { flexDirection: "row", gap: 20, alignItems: "center" },
  menuText: { color: "white", fontSize: 16 },
  userButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  dropdown: {
    position: "absolute",
    top: 40,
    right: 0,
    backgroundColor: "white",
    borderRadius: 8,
    width: 120,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dropdownItem: {
    padding: 12,
    alignItems: "center",
  },
  logoutText: {
    color: "#ff4444",
    fontWeight: "bold",
  },
});