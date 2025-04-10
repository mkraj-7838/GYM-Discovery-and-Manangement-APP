import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import AddMemberScreen from "../../components/add-member";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Animatable from "react-native-animatable";
import {
  Ionicons,
  MaterialIcons,
  FontAwesome,
  Feather,
  MaterialCommunityIcons,
  AntDesign,
} from "@expo/vector-icons";
import SearchMemberScreen from "../../components/FormSearch";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000/api";

const AllMembersScreen = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedMember, setExpandedMember] = useState(null);

  const [showAddOptions, setShowAddOptions] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);

  // Enhanced dark theme color palette
  const colors = {
    background: "#121212",
    primary: "#1E88E5",
    secondary: "#FFFFFF",
    accent: "#00C853",
    text: "#E0E0E0",
    textSecondary: "#9E9E9E",
    cardBackground: "#1E1E1E",
    inputBackground: "#2D2D2D",
    active: "#4CAF50", // Green for active
    warning: "#FFC107", // Yellow for warning
    inactive: "#F44336", // Red for inactive
    trial: "#9C27B0", // Purple for trial
    selectedFilter: "#1E88E5", // Blue for selected filter
    border: "#333333",
    shadow: "#000000",
  };

  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found. Please log in again.");
      }
      const response = await fetch(`${API_BASE_URL}/user/members`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!Array.isArray(data)) {
        console.error("API Response is not an array:", data);
        throw new Error(data.message || "Invalid data format");
      }
      setMembers(data);
    } catch (err) {
      console.error("Error fetching members:", err);
      Alert.alert("Error", err.message || "Failed to load members");
      setMembers([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMembers();
  };

  const getRemainingDays = (member) => {
    if (
      !member.joiningDate ||
      !member.monthsOfSubscription ||
      member.status !== "active"
    ) {
      return null;
    }

    const joinDate = new Date(member.joiningDate);
    const endDate = new Date(joinDate);
    endDate.setMonth(joinDate.getMonth() + member.monthsOfSubscription);
    const today = new Date();
    const diffTime = endDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (member) => {
    if (member.status === "inactive") return colors.inactive;
    if (member.status === "trial") return colors.trial;

    const remainingDays = getRemainingDays(member);
    if (remainingDays !== null && remainingDays <= 10) {
      return colors.warning;
    }
    return colors.active;
  };

  const getStatusIcon = (member) => {
    if (member.status === "inactive") return "close-circle";
    if (member.status === "trial") return "timer";

    const remainingDays = getRemainingDays(member);
    if (remainingDays !== null && remainingDays <= 10) {
      return "alert-circle";
    }
    return "checkmark-circle";
  };

  const filteredMembers = members.filter(
    (member) =>
      (member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.phone?.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (filterType === "all" || member.status === filterType)
  );

  const toggleMemberExpand = (memberId) => {
    setExpandedMember(expandedMember === memberId ? null : memberId);
  };

  if (showAddMember) {
    return <AddMemberScreen onClose={() => setShowAddMember(false)} />;
  }
  if (showQRScanner) {
    return <SearchMemberScreen onClose={() => setShowQRScanner(false)} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with search */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          <MaterialCommunityIcons
            name="account-group"
            size={24}
            color={colors.primary}
          />{" "}
          Member Directory
        </Text>
        <View
          style={[
            styles.searchContainer,
            { backgroundColor: colors.inputBackground },
          ]}
        >
          <Feather
            name="search"
            size={20}
            color={colors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.input, { color: "#ffffff" }]}
            placeholder="Search members..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons
                name="close-circle"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterContainer}>
        {[
          { type: "all", label: "All", icon: "people" },
          { type: "active", label: "Active", icon: "checkmark-circle" },
          { type: "inactive", label: "Inactive", icon: "close-circle" },
          { type: "trial", label: "Trial", icon: "timer" },
        ].map((filter) => (
          <TouchableOpacity
            key={filter.type}
            style={[
              styles.filterButton,
              filterType === filter.type
                ? {
                    backgroundColor: colors.selectedFilter,
                    borderColor: colors.primary,
                  }
                : {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border,
                  },
            ]}
            onPress={() => setFilterType(filter.type)}
          >
            <Ionicons
              name={filter.icon}
              size={18}
              color={
                filterType === filter.type ? colors.secondary : colors.text
              }
              style={styles.filterIcon}
            />
            <Text
              style={[
                styles.filterText,
                {
                  color:
                    filterType === filter.type ? colors.secondary : colors.text,
                },
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Add member button */}
      <TouchableOpacity
        style={[
          styles.addButton,
          { backgroundColor: "#1E88E5", borderColor: "#444" },
        ]}
        onPress={() => setShowAddOptions(true)}
      >
        <AntDesign name="adduser" size={20} color="#FFFFFF" />
        <Text style={[styles.addButtonText, { color: "#FFFFFF" }]}>
          Add New Member
        </Text>
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showAddOptions}
        onRequestClose={() => setShowAddOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.optionBox}>
            <Text style={styles.modalTitle}>Choose Option</Text>

            <Pressable
              style={styles.optionButton}
              onPress={() => {
                setShowAddOptions(false);
                setShowAddMember(true);
              }}
            >
              <MaterialIcons name="keyboard" size={22} color="#fff" />
              <Text style={styles.optionText}>Add Manually</Text>
            </Pressable>

            <Pressable
              style={styles.optionButton}
              onPress={() => {
                setShowAddOptions(false);
                setShowQRScanner(true);
              }}
            >
              <AntDesign name="qrcode" size={22} color="#fff" />
              <Text style={styles.optionText}>by Member Form</Text>
            </Pressable>

            <Pressable
              onPress={() => setShowAddOptions(false)}
              style={styles.cancelButton}
            >
              <Text style={{ color: "#aaa" }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Member count */}
      <View style={styles.memberCountContainer}>
        <Text style={[styles.memberCountText, { color: colors.textSecondary }]}>
          Showing {filteredMembers.length}{" "}
          {filteredMembers.length === 1 ? "member" : "members"}
        </Text>
      </View>

      {/* Members list */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading members...
          </Text>
        </View>
      ) : filteredMembers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons
            name="people-outline"
            size={60}
            color={colors.textSecondary}
          />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            No members found
          </Text>
          <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>
            {searchQuery
              ? "Try a different search"
              : "Add a new member to get started"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredMembers}
          keyExtractor={(item) => item._id}
          renderItem={({ item, index }) => {
            const remainingDays = getRemainingDays(item);
            const statusColor = getStatusColor(item);
            const statusIcon = getStatusIcon(item);
            const isExpanded = expandedMember === item._id;

            return (
              <Animatable.View
                animation="fadeInUp"
                duration={600}
                delay={index * 50}
                useNativeDriver
              >
                <TouchableOpacity
                  style={[
                    styles.memberItem,
                    {
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.border,
                      shadowColor: colors.shadow,
                    },
                  ]}
                  onPress={() => toggleMemberExpand(item._id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.memberMainContent}>
                    <Image
                      source={{
                        uri: item.photo
                          ? item.photo
                          : `https://api.dicebear.com/7.x/initials/png?seed=${encodeURIComponent(
                              item.name
                            )}&size=100`,
                      }}
                      style={styles.memberPhoto}
                      onError={() => console.log("Error loading member photo")}
                    />

                    <View style={styles.memberInfo}>
                      <Text
                        style={[styles.memberName, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                      <View style={styles.memberMeta}>
                        <MaterialIcons
                          name="phone"
                          size={14}
                          color={colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.memberPhone,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {item.phone || "No phone"}
                        </Text>
                      </View>
                      <View style={styles.memberMeta}>
                        <MaterialCommunityIcons
                          name="calendar"
                          size={14}
                          color={colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.memberDate,
                            { color: colors.textSecondary },
                          ]}
                        >
                          Joined:{" "}
                          {new Date(item.joiningDate).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.statusContainer}>
                      <Ionicons
                        name={statusIcon}
                        size={24}
                        color={statusColor}
                        style={styles.statusIcon}
                      />
                      {remainingDays !== null && remainingDays <= 10 && (
                        <Text
                          style={[
                            styles.daysRemaining,
                            { color: colors.warning },
                          ]}
                        >
                          {remainingDays}d
                        </Text>
                      )}
                    </View>
                  </View>

                  {isExpanded && (
                    <Animatable.View
                      animation="fadeIn"
                      duration={300}
                      style={styles.expandedContent}
                    >
                      <View style={styles.expandedRow}>
                        <View style={styles.detailItem}>
                          <MaterialCommunityIcons
                            name="weight-lifter"
                            size={16}
                            color={colors.textSecondary}
                          />
                          <Text
                            style={[styles.detailText, { color: colors.text }]}
                          >
                            {item.batch || "No batch"}
                          </Text>
                        </View>
                        <View style={styles.detailItem}>
                          <MaterialCommunityIcons
                            name="card-account-details"
                            size={16}
                            color={colors.textSecondary}
                          />
                          <Text
                            style={[styles.detailText, { color: colors.text }]}
                          >
                            {item.membershipPlan || "No plan"}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.expandedRow}>
                        <View style={styles.detailItem}>
                          <MaterialCommunityIcons
                            name="calendar-clock"
                            size={16}
                            color={colors.textSecondary}
                          />
                          <Text
                            style={[styles.detailText, { color: colors.text }]}
                          >
                            {item.monthsOfSubscription || "0"} months
                          </Text>
                        </View>
                        <View style={styles.detailItem}>
                          <MaterialCommunityIcons
                            name="cash"
                            size={16}
                            color={colors.textSecondary}
                          />
                          <Text
                            style={[styles.detailText, { color: colors.text }]}
                          >
                            ₹{item.fees || "0"}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.viewDetailsButton,
                          { backgroundColor: colors.primary },
                        ]}
                        onPress={() =>
                          router.push({
                            pathname: "/(member)/[id]",
                            params: { id: item._id },
                          })
                        }
                      >
                        <Text
                          style={[
                            styles.viewDetailsText,
                            { color: colors.secondary },
                          ]}
                        >
                          View Full Details
                        </Text>
                        <Feather
                          name="chevron-right"
                          size={16}
                          color={colors.secondary}
                        />
                      </TouchableOpacity>
                    </Animatable.View>
                  )}
                </TouchableOpacity>
              </Animatable.View>
            );
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={styles.listContentContainer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterIcon: {
    marginRight: 6,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  
  addButtonText: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  optionBox: {
    width: 280,
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    borderColor: "#333",
    borderWidth: 1,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: "#2a2a2a",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 12,
    width: "220",
    justifyContent: "center",
  },
  optionText: {
    color: "#fff",
    marginLeft: 10,
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 10,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  memberCountContainer: {
    marginBottom: 12,
  },
  memberCountText: {
    fontSize: 14,
  },
  memberItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  memberMainContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  memberPhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  memberMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  memberPhone: {
    fontSize: 14,
    marginLeft: 4,
  },
  memberDate: {
    fontSize: 12,
    marginLeft: 4,
  },
  statusContainer: {
    alignItems: "center",
    marginLeft: 8,
  },
  statusIcon: {
    marginBottom: 4,
  },
  daysRemaining: {
    fontSize: 12,
    fontWeight: "600",
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  expandedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  detailText: {
    fontSize: 14,
    marginLeft: 8,
  },
  viewDetailsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: "500",
    marginRight: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "500",
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  listContentContainer: {
    paddingBottom: 20,
  },
});

export default AllMembersScreen;
