import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Easing,
} from "react-native";
import { TextInput, Button, Divider, Chip } from "react-native-paper";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSelector } from "react-redux";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000/api";

// Enhanced Dark Theme Colors
const themeColors = {
  primary: "#6366F1",       // Indigo-500
  primaryDark: "#4338CA",   // Indigo-700
  background: "#111827",    // Gray-900
  surface: "#1F2937",       // Gray-800
  surfaceLight: "#374151",  // Gray-700
  accent: "#818CF8",        // Indigo-400
  text: "#F3F4F6",         // Gray-100
  secondaryText: "#9CA3AF", // Gray-400
  error: "#EF4444",        // Red-500
  success: "#10B981",      // Emerald-500
  warning: "#F59E0B",      // Amber-500
  info: "#3B82F6",        // Blue-500
};

// API Service Functions (same as before)
const createMaintenanceReport = async (reportData, token) => {
  const response = await axios.post(`${API_BASE_URL}/user/maintenance`, reportData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  return response.data;
};

const fetchMaintenanceReports = async (userId, token) => {
  const response = await axios.get(`${API_BASE_URL}/user/maintenance`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { userId, sort: "-createdAt" },
  });
  return response.data;
};

const deleteMaintenanceReport = async (reportId, token) => {
  const response = await axios.delete(`${API_BASE_URL}/user/maintenance/${reportId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Date Formatter with relative time
const formatMaintenanceDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
  
  if (diffInHours < 24) {
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } else {
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
};

export default function MaintenanceScreen() {
  const navigation = useNavigation();
  const [formData, setFormData] = useState({
    description: "",
    cost: "",
    priority: "medium", // Added priority field
  });
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedReportId, setExpandedReportId] = useState(null);
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideUpAnim = useState(new Animated.Value(30))[0];
  
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    // Animation on mount
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
    
    fetchReports();
  }, []);

  const fetchReports = async () => {
    const token = await AsyncStorage.getItem("token");
    try {
      setLoading(true);
      const data = await fetchMaintenanceReports(user.id, token);
      setReports(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch reports");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
    Haptics.selectionAsync();
  };

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleReportExpand = (reportId) => {
    setExpandedReportId(expandedReportId === reportId ? null : reportId);
    Haptics.selectionAsync();
  };

  const handleSubmit = async () => {
    const token = await AsyncStorage.getItem("token");
    if (!formData.description) {
      Alert.alert("Error", "Please enter a description");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    if (formData.cost && isNaN(parseFloat(formData.cost))) {
      Alert.alert("Error", "Cost must be a number");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    try {
      setSubmitting(true);
      await createMaintenanceReport(
        {
          userId: user.id,
          description: formData.description,
          cost: parseFloat(formData.cost) || 0,
          priority: formData.priority,
        },
        token
      );

      await fetchReports();
      setFormData({ description: "", cost: "", priority: "medium" });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Report submitted successfully");
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", err.response?.data?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reportId) => {
    const token = await AsyncStorage.getItem("token");
    try {
      Alert.alert(
        "Confirm Delete",
        "Are you sure you want to delete this report?",
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => Haptics.selectionAsync(),
          },
          {
            text: "Delete",
            onPress: async () => {
              await deleteMaintenanceReport(reportId, token);
              await fetchReports();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert("Success", "Report deleted successfully");
            },
            style: "destructive",
          },
        ]
      );
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", err.response?.data?.message || "Deletion failed");
    }
  };

  const clearError = () => {
    setError(null);
    Haptics.selectionAsync();
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high": return themeColors.error;
      case "medium": return themeColors.warning;
      case "low": return themeColors.success;
      default: return themeColors.secondaryText;
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "high": return "alert-circle";
      case "medium": return "alert";
      case "low": return "chevron-up";
      default: return "information";
    }
  };

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          backgroundColor: themeColors.background,
          opacity: fadeAnim,
          transform: [{ translateY: slideUpAnim }],
        }
      ]}
    >
      {/* Enhanced Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            Haptics.selectionAsync();
            navigation.goBack();
          }}
          style={styles.backButton}
        >
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={themeColors.accent} 
          />
        </TouchableOpacity>
        <Text style={[styles.title, { color: themeColors.text }]}>
          Maintenance Reports
        </Text>
        <TouchableOpacity
          onPress={() => {
            Haptics.selectionAsync();
            navigation.navigate("MaintenanceStats");
          }}
          style={styles.statsButton}
        >
          <MaterialCommunityIcons 
            name="chart-box" 
            size={24} 
            color={themeColors.accent} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[themeColors.accent]}
            tintColor={themeColors.accent}
            progressBackgroundColor={themeColors.surface}
          />
        }
      >
        {/* Enhanced Maintenance Form */}
        <Animated.View 
          style={[
            styles.card, 
            { 
              backgroundColor: themeColors.surface,
              shadowColor: themeColors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 10,
              elevation: 8,
            }
          ]}
        >
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons 
              name="toolbox" 
              size={24} 
              color={themeColors.accent} 
            />
            <Text style={[styles.cardTitle, { color: themeColors.text }]}>
              New Maintenance Report
            </Text>
          </View>

          <TextInput
            label="Description"
            value={formData.description}
            onChangeText={(text) => handleChange("description", text)}
            placeholder="What needs maintenance?"
            placeholderTextColor={themeColors.secondaryText}
            multiline
            numberOfLines={3}
            style={[styles.input, { textAlignVertical: "top" }]}
            theme={{
              colors: {
                primary: themeColors.accent,
                background: themeColors.surface,
                text: themeColors.text,
                placeholder: themeColors.secondaryText,
                label: themeColors.secondaryText,
              },
              roundness: 8,
            }}
            left={<TextInput.Icon name="text" color={themeColors.secondaryText} />}
          />

          <TextInput
            label="Estimated Cost (₹)"
            value={formData.cost}
            onChangeText={(text) => handleChange("cost", text)}
            placeholder="0.00"
            placeholderTextColor={themeColors.secondaryText}
            keyboardType="numeric"
            style={styles.input}
            theme={{
              colors: {
                primary: themeColors.accent,
                background: themeColors.surface,
                text: themeColors.text,
                placeholder: themeColors.secondaryText,
                label: themeColors.secondaryText,
              },
              roundness: 8,
            }}
            left={<TextInput.Icon name="currency-inr" color={themeColors.secondaryText} />}
          />

          <View style={styles.priorityContainer}>
            <Text style={[styles.priorityLabel, { color: themeColors.secondaryText }]}>
              Priority:
            </Text>
            <View style={styles.priorityButtons}>
              {["high", "medium", "low"].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.priorityButton,
                    formData.priority === level && {
                      backgroundColor: getPriorityColor(level),
                      borderColor: getPriorityColor(level),
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    handleChange("priority", level);
                  }}
                >
                  <MaterialCommunityIcons
                    name={getPriorityIcon(level)}
                    size={16}
                    color={
                      formData.priority === level 
                        ? themeColors.text 
                        : getPriorityColor(level)
                    }
                  />
                  <Text 
                    style={[
                      styles.priorityButtonText,
                      { 
                        color: formData.priority === level 
                          ? themeColors.text 
                          : getPriorityColor(level),
                      }
                    ]}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={submitting}
            disabled={submitting}
            style={[
              styles.button, 
              { 
                backgroundColor: themeColors.primary,
                borderRadius: 8,
              }
            ]}
            labelStyle={{ 
              color: themeColors.text, 
              fontWeight: "bold",
              fontSize: 16,
            }}
            contentStyle={{ height: 48 }}
            icon="send"
          >
            {submitting ? "Submitting..." : "Submit Report"}
          </Button>
        </Animated.View>

        {/* Reports List Section */}
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons 
            name="history" 
            size={20} 
            color={themeColors.accent} 
          />
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Maintenance History
          </Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons 
              name="alert-circle" 
              size={20} 
              color={themeColors.error} 
            />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={clearError}>
              <Ionicons 
                name="close" 
                size={20} 
                color={themeColors.error} 
              />
            </TouchableOpacity>
          </View>
        )}

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator 
              size="large" 
              color={themeColors.accent} 
            />
            <Text style={{ color: themeColors.secondaryText, marginTop: 10 }}>
              Loading your maintenance reports...
            </Text>
          </View>
        ) : reports.length > 0 ? (
          reports.map((report) => (
            <TouchableOpacity
              key={report._id}
              activeOpacity={0.9}
              onPress={() => toggleReportExpand(report._id)}
            >
              <Animated.View
                style={[
                  styles.reportCard, 
                  { 
                    backgroundColor: themeColors.surface,
                    borderLeftWidth: 4,
                    borderLeftColor: getPriorityColor(report.priority || "medium"),
                  }
                ]}
              >
                <View style={styles.reportHeader}>
                  <View style={styles.reportDateContainer}>
                    <MaterialCommunityIcons
                      name="calendar"
                      size={16}
                      color={themeColors.secondaryText}
                    />
                    <Text style={[styles.reportDate, { color: themeColors.secondaryText }]}>
                      {formatMaintenanceDate(report.createdAt)}
                    </Text>
                  </View>
                  
                  <View style={styles.reportHeaderRight}>
                    <View style={styles.costBadge}>
                      <Text style={[styles.reportCost, { color: themeColors.text }]}>
                        ₹{report.cost || "0"}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDelete(report._id);
                      }}
                      style={styles.deleteButton}
                    >
                      <Ionicons 
                        name="trash-outline" 
                        size={18} 
                        color={themeColors.error} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text 
                  style={[styles.reportDescription, { color: themeColors.text }]}
                  numberOfLines={expandedReportId === report._id ? undefined : 2}
                >
                  {report.description}
                </Text>

                {expandedReportId === report._id && (
                  <Animated.View style={styles.reportDetails}>
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons
                        name={getPriorityIcon(report.priority || "medium")}
                        size={16}
                        color={getPriorityColor(report.priority || "medium")}
                      />
                      <Text style={[styles.detailText, { color: themeColors.secondaryText }]}>
                        Priority:{" "}
                        <Text style={{ color: getPriorityColor(report.priority || "medium") }}>
                          {report.priority || "medium"}
                        </Text>
                      </Text>
                    </View>
                    
                    {report.status && (
                      <View style={styles.detailRow}>
                        <MaterialCommunityIcons
                          name={
                            report.status === "completed" 
                              ? "check-circle" 
                              : "progress-clock"
                          }
                          size={16}
                          color={
                            report.status === "completed" 
                              ? themeColors.success 
                              : themeColors.warning
                          }
                        />
                        <Text style={[styles.detailText, { color: themeColors.secondaryText }]}>
                          Status:{" "}
                          <Text 
                            style={{ 
                              color: report.status === "completed" 
                                ? themeColors.success 
                                : themeColors.warning 
                            }}
                          >
                            {report.status}
                          </Text>
                        </Text>
                      </View>
                    )}
                    
                    {report.notes && (
                      <View style={styles.detailRow}>
                        <MaterialCommunityIcons
                          name="note-text"
                          size={16}
                          color={themeColors.info}
                        />
                        <Text style={[styles.detailText, { color: themeColors.secondaryText }]}>
                          Notes: {report.notes}
                        </Text>
                      </View>
                    )}
                  </Animated.View>
                )}

                <View style={styles.reportFooter}>
                  <Ionicons
                    name={expandedReportId === report._id ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={themeColors.secondaryText}
                  />
                </View>
              </Animated.View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="toolbox-outline"
              size={48}
              color={themeColors.secondaryText}
            />
            <Text style={[styles.emptyText, { color: themeColors.secondaryText }]}>
              No maintenance reports found
            </Text>
            <Text style={[styles.emptySubtext, { color: themeColors.secondaryText }]}>
              Add your first maintenance report above
            </Text>
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 16,
    backgroundColor: themeColors.background,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.surfaceLight,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  statsButton: {
    marginLeft: "auto",
    padding: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  card: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  input: {
    marginBottom: 16,
    backgroundColor: themeColors.surfaceLight,
    borderRadius: 8,
    fontSize: 16,
  },
  button: {
    marginTop: 8,
    borderRadius: 8,
    shadowColor: themeColors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  reportCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  reportDateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  reportDate: {
    fontSize: 13,
    marginLeft: 6,
  },
  reportHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  costBadge: {
    backgroundColor: themeColors.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reportCost: {
    fontWeight: "bold",
    fontSize: 14,
  },
  deleteButton: {
    padding: 4,
  },
  reportDescription: {
    marginBottom: 8,
    lineHeight: 22,
    fontSize: 15,
  },
  reportDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: themeColors.surfaceLight,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
  },
  reportFooter: {
    alignItems: "center",
    marginTop: 8,
  },
  loadingContainer: {
    padding: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    backgroundColor: themeColors.surfaceLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  errorText: {
    color: themeColors.error,
    flex: 1,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: "center",
    padding: 40,
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "500",
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: 14,
  },
  priorityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  priorityLabel: {
    marginRight: 12,
    fontSize: 14,
  },
  priorityButtons: {
    flexDirection: "row",
    gap: 8,
    flex: 1,
  },
  priorityButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: themeColors.surfaceLight,
    gap: 6,
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
});