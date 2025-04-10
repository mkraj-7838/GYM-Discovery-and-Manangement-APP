import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
} from "react-native";
import { useRouter } from "expo-router";
import * as Animatable from "react-native-animatable";
import { 
  MaterialCommunityIcons,
  Ionicons,
  FontAwesome,
  MaterialIcons,
  Feather,
  AntDesign
} from "@expo/vector-icons";

const DashboardScreen = () => {
  const router = useRouter();
  const [animation] = useState(new Animated.Value(0));

  // Enhanced dark theme colors
  const colors = {
    background: "#121212", // True dark background
    primary: "#1E88E5", // Vibrant blue
    secondary: "#FFFFFF", // White
    accent: "#00C853", // Green accent
    text: "#E0E0E0", // Light gray text
    textSecondary: "#9E9E9E", // Secondary text
    cardBackground: "#1E1E1E", // Dark card background
    border: "#333333", // Border color
    highlight: "#1E88E5", // Highlight color
  };

  // Box data with proper icons
  const boxes = [
    {
      id: "1",
      title: "Mark Attendance",
      icon: <MaterialCommunityIcons name="calendar-check" size={32} color={colors.primary} />,
      color: colors.cardBackground,
      route: "/(tools)/MarkAttendance",
    },
    {
      id: "2",
      title: "Maintenance",
      icon: <MaterialCommunityIcons name="tools" size={32} color="#FF9800" />,
      color: colors.cardBackground,
      route: "/(tools)/Maintenance",
    },
    {
      id: "3",
      title: "Gym Notices",
      icon: <Ionicons name="megaphone" size={32} color="#FF5252" />,
      color: colors.cardBackground,
      route: "/(tools)/GymNotice",
    },
    {
      id: "4",
      title: "Gym Analytics",
      icon: <MaterialCommunityIcons name="chart-areaspline" size={32} color="#9C27B0" />,
      color: colors.cardBackground,
      route: "/(tools)/gymAnalysis",
    },
    {
      id: "5",
      title: "Feedback",
      icon: <MaterialIcons name="feedback" size={32} color="#01BC04" />,
      color: colors.cardBackground,
      route: "/(tools)/FeedbackScreen",
    },
    {
      id: "6",
      title: "Membership Plans",
      icon: <MaterialCommunityIcons name="card-account-details" size={32} color="#4bAF50" />,
      color: colors.cardBackground,
      route: "/(tools)/MemberShipPlans",
    },
    {
      id: "7",
      title: "Stats",
      icon: <MaterialCommunityIcons name="chart-scatter-plot" size={32} color="#0cc2f5" />,
      color: colors.cardBackground,
      route: "/(tools)/GymStats",
    },
    {
      id: "8",
      title: "Certifications",
      icon: <FontAwesome name="graduation-cap" size={32} color="#FFD700" />,
      color: colors.cardBackground,
      route: "/(tools)/certifications",
    },
    {
      id: "9",
      title: "Complaints",
      icon: <FontAwesome name="envelope" size={32} color="#FF0000" />,
      color: colors.cardBackground,
      route: "/(tools)/complaints",
    }
  ];

  useEffect(() => {
    Animated.timing(animation, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);

  const renderBox = (box) => (
    <Animatable.View
      key={box.id}
      animation="fadeInUp"
      duration={400}
      delay={parseInt(box.id) * 150}
      style={styles.boxContainer}
    >
      <TouchableOpacity
        style={[styles.box, { backgroundColor: box.color }]}
        onPress={() => router.push(box.route)}
        activeOpacity={0.8}
      >
        <View style={styles.boxIconContainer}>
          {box.icon}
        </View>
        <Text style={styles.boxTitle}>{box.title}</Text>
        <View style={styles.boxArrow}>
          <AntDesign name="arrowright" size={18} color={colors.textSecondary} />
        </View>
      </TouchableOpacity>
    </Animatable.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={[styles.title, { color: colors.text }]}>
          <MaterialCommunityIcons name="tools" size={28} color={colors.primary} /> Gym Management
        </Text>
        
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Select a tool to manage your gym operations
        </Text>

        <View style={styles.grid}>
          {boxes.map((box) => renderBox(box))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  boxContainer: {
    width: Dimensions.get("window").width / 2 - 25,
    marginBottom: 20,
  },
  box: {
    height: 160,
    borderRadius: 16,
    padding: 16,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#2D2D2D",
  },
  boxIconContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  boxTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
  },
  boxArrow: {
    alignSelf: "flex-end",
  },
});

export default DashboardScreen;