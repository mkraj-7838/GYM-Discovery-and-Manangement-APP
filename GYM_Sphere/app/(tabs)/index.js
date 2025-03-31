import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { PieChart } from "react-native-chart-kit";
import { useRouter } from "expo-router";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000/api";


const DashboardScreen = () => {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // State for refresh control
  const screenWidth = Dimensions.get("window").width - 40;

  // Razorpay-inspired color palette
  const colors = {
    background: "#0A2540", // Dark blue
    primary: "#1A73E8", // Vibrant blue
    secondary: "#FFFFFF", // White
    accent: "#34A853", // Green for accents
    text: "#FFFFFF", // White text
    cardBackground: "#1E3A5F", // Slightly lighter dark blue for cards
  };

  // Fetch stats function
  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/user/members/member-stats`);
      const data = await res.json();
      console.log("✅ Member stats fetched:", data);
      setStats(data);
    } catch (err) {
      console.error("❌ Error fetching member stats:", err);
      Alert.alert("Error", "Failed to load member stats");
    } finally {
      setIsLoading(false);
      setRefreshing(false); // Stop refreshing animation
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchStats();
  }, []);

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true); // Start refreshing animation
    fetchStats(); // Fetch data again
  }, []);

  // Calculate total members and estimated revenue
  const totalMembers =
    (stats?.memberStatus?.active || 0) +
    (stats?.memberStatus?.inactive || 0) +
    (stats?.memberStatus?.trial || 0);

  const estimatedRevenue =
    (stats?.memberStatus?.active || 0) * 1500 + (stats?.memberStatus?.trial || 0) * 500;

  // Data for pie charts
  const memberStatusData = [
    { name: "Active", population: stats?.memberStatus?.active || 0, color: "#34A853", legendFontColor: colors.text, legendFontSize: 14 },
    { name: "Inactive", population: stats?.memberStatus?.inactive || 0, color: "#EA4335", legendFontColor: colors.text, legendFontSize: 14 },
    { name: "Trial", population: stats?.memberStatus?.trial || 0, color: "#FBBC05", legendFontColor: colors.text, legendFontSize: 14 },
  ];

  const membershipPlansData = [
    { name: "Basic", population: stats?.membershipPlans?.basic || 0, color: "#1A73E8", legendFontColor: colors.text, legendFontSize: 14 },
    { name: "Premium", population: stats?.membershipPlans?.premium || 0, color: "#9B59B6", legendFontColor: colors.text, legendFontSize: 14 },
    { name: "VIP", population: stats?.membershipPlans?.vip || 0, color: "#E67E22", legendFontColor: colors.text, legendFontSize: 14 },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing} // Control the refreshing state
          onRefresh={onRefresh} // Function to call when refreshing
          colors={[colors.primary]} // Customize the spinner color
          tintColor={colors.primary} // Customize the spinner color (iOS)
        />
      }
    >
      <Text style={[styles.title, { color: colors.text }]}>Gym Management Dashboard</Text>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <>
          {/* ✅ Total Members & Revenue Overview */}
          <View style={styles.overviewContainer}>
            <View style={[styles.overviewBox, { backgroundColor: colors.cardBackground }]}>
              <Text style={[styles.overviewTitle, { color: colors.text }]}>Total Members</Text>
              <Text style={[styles.overviewValue, { color: colors.primary }]}>{totalMembers}</Text>
            </View>
            <View style={[styles.overviewBox, { backgroundColor: colors.cardBackground }]}>
              <Text style={[styles.overviewTitle, { color: colors.text }]}>Estimated Revenue</Text>
              <Text style={[styles.overviewValue, { color: colors.primary }]}>₹{estimatedRevenue}</Text>
            </View>
          </View>

          {/* ✅ Member Status Pie Chart */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Member Status Distribution</Text>
          {totalMembers === 0 ? (
            <Text style={[styles.noDataText, { color: colors.text }]}>No Data Available</Text>
          ) : (
            <PieChart
              data={memberStatusData}
              width={screenWidth}
              height={220}
              chartConfig={chartConfig}
              accessor={"population"}
              backgroundColor={"transparent"}
              paddingLeft={"15"}
              absolute
            />
          )}

          {/* ✅ Membership Plans Pie Chart */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Membership Plans Distribution</Text>
          {totalMembers === 0 ? (
            <Text style={[styles.noDataText, { color: colors.text }]}>No Data Available</Text>
          ) : (
            <PieChart
              data={membershipPlansData}
              width={screenWidth}
              height={220}
              chartConfig={chartConfig}
              accessor={"population"}
              backgroundColor={"transparent"}
              paddingLeft={"15"}
              absolute
            />
          )}

          {/* ✅ Quick Actions */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/(tabs)/all-members")}
            >
              <Text style={styles.actionText}>+ Add Member</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/(tabs)/settings")}
            >
              <Text style={styles.actionText}>💰 Update Prices</Text>
            </TouchableOpacity>
          </View>

          {/* ✅ Recent Activities */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activities</Text>
          <View style={[styles.activityBox, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.activityText, { color: colors.text }]}>✅ New Member "John Doe" joined.</Text>
            <Text style={[styles.activityText, { color: colors.text }]}>🔄 Gym prices updated.</Text>
            <Text style={[styles.activityText, { color: colors.text }]}>📊 Monthly report generated.</Text>
          </View>
        </>
      )}
    </ScrollView>
  );
};

const chartConfig = {
  backgroundColor: "#0A2540", // Dark blue background
  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`, // White text
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`, // White labels
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  overviewContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  overviewBox: { width: "48%", padding: 15, borderRadius: 10, borderWidth: 1, borderColor: "#1A73E8" },
  overviewTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 5 },
  overviewValue: { fontSize: 18, fontWeight: "bold" },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginTop: 20, marginBottom: 10 },
  noDataText: { textAlign: "center", fontSize: 16, marginTop: 20 },
  quickActions: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  actionButton: { padding: 12, borderRadius: 8, width: "48%", alignItems: "center" },
  actionText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
  activityBox: { padding: 15, borderRadius: 8, borderWidth: 1, borderColor: "#1A73E8", marginTop: 10 },
  activityText: { fontSize: 14, marginBottom: 5 },
});

export default DashboardScreen;