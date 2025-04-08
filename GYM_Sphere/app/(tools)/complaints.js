import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
  Linking,
  Platform,
} from "react-native";
import {
  Ionicons,
  MaterialIcons,
  FontAwesome,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000/api";

import { useNavigation } from "@react-navigation/native";

import * as FileSystem from "expo-file-system";
import * as IntentLauncher from "expo-intent-launcher";

const ComplaintsScreen = () => {
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [members, setMembers] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigation = useNavigation();

  const fetchMembers = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const response = await fetch(`${API_BASE_URL}/user/members`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setMembers(data || []);
        return data || []; // Return the members data
      } else {
        throw new Error(data.message || "Failed to fetch members");
      }
    } catch (error) {
      console.error("Error fetching members:", error);
      Alert.alert("Error", error.message || "Failed to load members");
      throw error; // Re-throw to handle in fetchData
    }
  };

  const fetchComplaints = async (membersList) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const response = await fetch(`${API_BASE_URL}/complaints`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        // Check if data.data exists
        const complaintsData = data.data || [];

        // Get all member phone numbers from either passed membersList or state members
        const memberPhones = (membersList || members).map((m) => m.phone);

        // Filter complaints where complaint.member.phone exists in members list
        const filtered = complaintsData.filter(
          (complaint) =>
            complaint.member?.phone &&
            memberPhones.includes(complaint.member.phone)
        );

        setComplaints(filtered);
        setFilteredComplaints(filtered);
        return filtered; // Return the filtered complaints
      } else {
        throw new Error(data.message || "Failed to fetch complaints");
      }
    } catch (error) {
      console.error("Error fetching complaints:", error);
      Alert.alert("Error", error.message || "Failed to load complaints");
      throw error; // Re-throw to handle in fetchData
    }
  };

  // Enhanced version that fetches both members and complaints
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setRefreshing(true);

      // First fetch members and wait for completion
      const membersData = await fetchMembers();

      // Then fetch complaints using the freshly fetched members data
      await fetchComplaints(membersData);
    } catch (error) {
      console.error("Error fetching data:", error);
      // Error alerts are already shown in the individual functions
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/complaints/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchData();
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to update status");
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const handleDeleteComplaint = async (id) => {
    try {
        console.log(id);
      setIsDeleting(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${API_BASE_URL}/complaints/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      // First check if response is ok
      if (!response.ok) {
        // Try to get error message from response
        let errorMsg = "Failed to delete complaint";
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorMsg;
        } catch (e) {
          console.error("Error parsing error response:", e);
        }
        throw new Error(errorMsg);
      }

      // Only close modal after successful deletion
      setModalVisible(false);

      // Refresh data
      await fetchData();

      // Show success message
      Alert.alert("Success", "Complaint deleted successfully");
    } catch (error) {
      console.error("Delete error:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to delete complaint. Please try again."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDelete = (id) => {
    console.log(id)
    Alert.alert(
      "Delete Complaint",
      "Are you sure you want to permanently delete this complaint?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            try {
              await handleDeleteComplaint(id);
            } catch (error) {
              
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (statusFilter === "all") {
      setFilteredComplaints(complaints);
    } else {
      setFilteredComplaints(
        complaints.filter((item) => item.status === statusFilter)
      );
    }
  }, [statusFilter, complaints]);

  const renderStatusBadge = (status) => {
    let bgColor, iconName, statusText;
    switch (status) {
      case "pending":
        bgColor = "#FFA500";
        iconName = "clock";
        statusText = "Pending";
        break;
      case "in_progress":
        bgColor = "#2196F3";
        iconName = "progress-clock";
        statusText = "In Progress";
        break;
      case "resolved":
        bgColor = "#4CAF50";
        iconName = "check-circle";
        statusText = "Resolved";
        break;
      case "rejected":
        bgColor = "#F44336";
        iconName = "close-circle";
        statusText = "Rejected";
        break;
      default:
        bgColor = "#9E9E9E";
        iconName = "help-circle";
        statusText = "Unknown";
    }

    return (
      <View style={[styles.statusBadge, { backgroundColor: bgColor }]}>
        <MaterialCommunityIcons name={iconName} size={14} color="#fff" />
        <Text style={styles.statusText}>{statusText}</Text>
      </View>
    );
  };

  const openFile = async (file) => {
    try {
      if (Platform.OS === "android") {
        const cachesDirectory = FileSystem.cacheDirectory;
        const localUri = `${cachesDirectory}${file.filename}`;

        // Download the file to cache
        await FileSystem.downloadAsync(
          `${API_BASE_URL}/${file.path}`,
          localUri
        );

        // Open the file with appropriate app
        await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
          data: localUri,
          flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
          type: file.mimetype,
        });
      } else {
        // For iOS, just try to open the URL directly
        await Linking.openURL(`${API_BASE_URL}/${file.path}`);
      }
    } catch (error) {
      console.error("Error opening file:", error);
      Alert.alert(
        "Error",
        "Could not open the file. Make sure you have an app installed that can open this file type."
      );
    }
  };

  const renderComplaintCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        setSelectedComplaint(item);
        setModalVisible(true);
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{item.member.name}</Text>
          <Text style={styles.memberPhone}>{item.member.phone}</Text>
        </View>
        {renderStatusBadge(item.status)}
      </View>

      <View style={styles.complaintInfo}>
        <Text style={styles.complaintCategory}>
          <MaterialIcons name="category" size={16} color="#BB86FC" />{" "}
          {item.complaint.category}
        </Text>
        <Text style={styles.complaintDescription} numberOfLines={2}>
          {item.complaint.description}
        </Text>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.dateText}>
          <MaterialIcons name="date-range" size={14} color="#888" />{" "}
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>

        <View style={styles.actionButtons}>
          {item.evidence?.length > 0 && (
            <Text style={styles.evidenceBadge}>
              <MaterialIcons name="attachment" size={16} color="#BB86FC" />{" "}
              {item.evidence.length}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderComplaintDetails = () => (
    <Modal
      animationType="slide"
      transparent={false}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setModalVisible(false)}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Complaint Details</Text>
        </View>

        <ScrollView contentContainerStyle={styles.modalContent}>
          {/* Member Info Section */}
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Member Information</Text>
            <View style={styles.detailRow}>
              <MaterialIcons name="person" size={20} color="#BB86FC" />
              <Text style={styles.detailText}>
                {selectedComplaint.member.name}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialIcons name="phone" size={20} color="#BB86FC" />
              <Text style={styles.detailText}>
                {selectedComplaint.member.phone}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialIcons name="email" size={20} color="#BB86FC" />
              <Text style={styles.detailText}>
                {selectedComplaint.member.email}
              </Text>
            </View>
          </View>

          {/* Complaint Details Section */}
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Complaint Details</Text>
            <View style={styles.detailRow}>
              <MaterialIcons name="category" size={20} color="#BB86FC" />
              <Text style={styles.detailText}>
                {selectedComplaint.complaint.category}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialIcons name="event" size={20} color="#BB86FC" />
              <Text style={styles.detailText}>
                {new Date(
                  selectedComplaint.complaint.incidentDate
                ).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.detailDescription}>
              <MaterialIcons name="description" size={20} color="#BB86FC" />
              <Text style={styles.detailText}>
                {selectedComplaint.complaint.description}
              </Text>
            </View>
          </View>

          {/* Status Section */}
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Status</Text>
            <View
              style={[
                styles.statusContainer,
                {
                  backgroundColor: getStatusColor(
                    selectedComplaint.status,
                    0.2
                  ),
                },
              ]}
            >
              {renderStatusBadge(selectedComplaint.status)}
              {selectedComplaint.resolutionNotes && (
                <View style={styles.notesContainer}>
                  <Text style={styles.notesTitle}>Resolution Notes:</Text>
                  <Text style={styles.notesText}>
                    {selectedComplaint.resolutionNotes}
                  </Text>
                </View>
              )}
              {selectedComplaint.resolvedDate && (
                <View style={styles.dateContainer}>
                  <MaterialIcons name="date-range" size={16} color="#888" />
                  <Text style={styles.dateText}>
                    Resolved on:{" "}
                    {new Date(
                      selectedComplaint.resolvedDate
                    ).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Evidence Section */}
          {selectedComplaint.evidence?.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>
                Evidence ({selectedComplaint.evidence.length})
              </Text>
              <View style={styles.evidenceContainer}>
                {selectedComplaint.evidence.map((file, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.evidenceItem}
                    onPress={() => openFile(file)}
                  >
                    <MaterialIcons
                      name={
                        file.mimetype.startsWith("image/")
                          ? "image"
                          : file.mimetype.startsWith("video/")
                          ? "videocam"
                          : "insert-drive-file"
                      }
                      size={24}
                      color="#BB86FC"
                    />
                    <Text style={styles.evidenceText} numberOfLines={1}>
                      {file.filename}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            {selectedComplaint.status !== "resolved" && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "#4CAF50" }]}
                onPress={() => {
                  handleStatusChange(selectedComplaint._id, "resolved");
                  setModalVisible(false);
                }}
              >
                <Text style={styles.actionButtonText}>Mark as Resolved</Text>
              </TouchableOpacity>
            )}
            {selectedComplaint.status !== "rejected" && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "#F44336" }]}
                onPress={() => {
                  handleStatusChange(selectedComplaint._id, "rejected");
                  setModalVisible(false);
                }}
              >
                <Text style={styles.actionButtonText}>Reject Complaint</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              disabled={isDeleting}
              style={[
                styles.actionButton,
                {
                  backgroundColor: "#F44336",
                  opacity: isDeleting ? 0.6 : 1,
                },
              ]}
              onPress={() => {
                console.log(selectedComplaint._id);
                confirmDelete(selectedComplaint._id)
              }}
            >
              {isDeleting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.actionButtonText}>Delete Complaint</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  const getStatusColor = (status, opacity = 1) => {
    switch (status) {
      case "pending":
        return `rgba(255, 165, 0, ${opacity})`;
      case "in_progress":
        return `rgba(33, 150, 243, ${opacity})`;
      case "resolved":
        return `rgba(76, 175, 80, ${opacity})`;
      case "rejected":
        return `rgba(244, 67, 54, ${opacity})`;
      default:
        return `rgba(158, 158, 158, ${opacity})`;
    }
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#BB86FC" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Member Complaints</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            statusFilter === "all" && styles.activeFilter,
          ]}
          onPress={() => setStatusFilter("all")}
        >
          <Text style={styles.filterText}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            statusFilter === "pending" && styles.activeFilter,
          ]}
          onPress={() => setStatusFilter("pending")}
        >
          <Text style={styles.filterText}>Pending</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            statusFilter === "in_progress" && styles.activeFilter,
          ]}
          onPress={() => setStatusFilter("in_progress")}
        >
          <Text style={styles.filterText}>In Progress</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            statusFilter === "resolved" && styles.activeFilter,
          ]}
          onPress={() => setStatusFilter("resolved")}
        >
          <Text style={styles.filterText}>Resolved</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredComplaints}
        renderItem={renderComplaintCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#BB86FC"]}
            tintColor="#BB86FC"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="report-problem" size={60} color="#555" />
            <Text style={styles.emptyText}>No complaints found</Text>
          </View>
        }
      />

      {selectedComplaint && renderComplaintDetails()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#1E1E1E",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    backgroundColor: "#1E1E1E",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  activeFilter: {
    backgroundColor: "#BB86FC",
  },
  filterText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 12,
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  memberPhone: {
    color: "#aaa",
    fontSize: 14,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    marginLeft: 4,
  },
  complaintInfo: {
    marginBottom: 12,
  },
  complaintCategory: {
    color: "#BB86FC",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 6,
  },
  complaintDescription: {
    color: "#ddd",
    fontSize: 14,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#333",
    paddingTop: 12,
  },
  dateText: {
    color: "#888",
    fontSize: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  evidenceBadge: {
    color: "#BB86FC",
    fontSize: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    color: "#888",
    fontSize: 18,
    marginTop: 16,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#121212",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#1E1E1E",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  closeButton: {
    marginRight: 16,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
    marginRight: 44, // To balance the close button
  },
  modalContent: {
    padding: 16,
  },
  detailSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#BB86FC",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    paddingBottom: 6,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailDescription: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  detailText: {
    color: "#fff",
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  statusContainer: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  notesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  notesTitle: {
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 4,
  },
  notesText: {
    color: "#ddd",
    fontSize: 14,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  evidenceContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  evidenceItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
    marginBottom: 8,
    maxWidth: "45%",
  },
  evidenceText: {
    color: "#fff",
    fontSize: 12,
    marginLeft: 4,
  },
  actionSection: {
    marginTop: 24,
  },
  actionButton: {
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default ComplaintsScreen;
