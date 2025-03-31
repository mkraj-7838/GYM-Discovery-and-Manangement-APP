import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Animated,
  TouchableOpacity,
  Alert,
  Dimensions,
  RefreshControl,
  Linking
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { 
  Ionicons, 
  MaterialIcons, 
  MaterialCommunityIcons, 
  FontAwesome,
  AntDesign,
  Feather 
} from "@expo/vector-icons";
import * as Animatable from 'react-native-animatable';
import AttendanceCalendar from "../../components/attendanceCalender";

const { width } = Dimensions.get('window');
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000/api";

const MemberDetailScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [member, setMember] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [remainingDays, setRemainingDays] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const [bmi, setBmi] = useState(null);

  // Enhanced dark theme colors
  const colors = {
    background: "#0F0F0F",
    primary: "#1E88E5",
    secondary: "#FFFFFF",
    accent: "#00C853",
    text: "#E0E0E0",
    textSecondary: "#9E9E9E",
    cardBackground: "#1A1A1A",
    warning: "#FFC107",
    danger: "#FF5252",
    success: "#4CAF50",
    border: "#2D2D2D",
    highlight: "#1E88E5",
    tabActive: "#1E88E5",
    tabInactive: "#2D2D2D",
  };

  const calculateRemainingDays = (joiningDate, monthsOfSubscription) => {
    if (!joiningDate || !monthsOfSubscription) return null;

    const joinDate = new Date(joiningDate);
    const endDate = new Date(joinDate);
    endDate.setMonth(joinDate.getMonth() + parseInt(monthsOfSubscription));

    const today = new Date();
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  const calculateBmi = (weight, height) => {
    if (!weight || !height) return null;
    // Convert height from cm to meters
    const heightInMeters = height / 100;
    return (weight / (heightInMeters * heightInMeters)).toFixed(1);
  };

  const fetchMemberDetails = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/user/members/${id}`);
      const data = await response.json();
      setMember(data);

      if (data.joiningDate && data.monthsOfSubscription) {
        const days = calculateRemainingDays(
          data.joiningDate,
          data.monthsOfSubscription
        );
        setRemainingDays(days);
      }

      // Calculate BMI if height and weight are available
      if (data.height && data.weight) {
        setBmi(calculateBmi(data.weight, data.height));
      }
    } catch (error) {
      console.error("Error fetching member details:", error);
      Alert.alert("Error", "Failed to load member details");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMemberDetails();
  }, [id]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleDeleteMember = async () => {
    Alert.alert(
      "Delete Member",
      "Are you sure you want to delete this member?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(
                `${API_BASE_URL}/user/members/${id}`,
                {
                  method: "DELETE",
                }
              );
              if (response.ok) {
                Alert.alert("Success", "Member deleted successfully");
                router.back();
              } else {
                Alert.alert("Error", "Failed to delete member");
              }
            } catch (error) {
              console.error("Error deleting member:", error);
              Alert.alert("Error", "An error occurred while deleting the member");
            }
          },
        },
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMemberDetails();
  };

  const handlePhonePress = (phone) => {
    if (!phone) return;
    
    Alert.alert(
      "Contact Member",
      `Call or message ${member.name}?`,
      [
        {
          text: "Call",
          onPress: () => Linking.openURL(`tel:${phone}`)
        },
        {
          text: "WhatsApp",
          onPress: () => Linking.openURL(`https://wa.me/${phone}`)
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  };

  const handleEmailPress = (email) => {
    if (!email) return;
    Linking.openURL(`mailto:${email}`);
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading member details...</Text>
      </View>
    );
  }

  if (!member) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <MaterialIcons name="error-outline" size={50} color={colors.danger} />
        <Text style={[styles.errorText, { color: colors.text }]}>Member not found</Text>
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={fetchMemberDetails}
        >
          <Feather name="refresh-cw" size={18} color="white" />
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const avatarUrl = member.photo
    ? member.photo
    : `https://api.dicebear.com/7.x/initials/png?seed=${encodeURIComponent(member.name)}&size=100&background=1E88E5&color=fff`;

  let subscriptionStatusMessage = "";
  let subscriptionStatusColor = colors.text;
  let statusIcon = "timer";

  if (remainingDays !== null) {
    if (remainingDays <= 0) {
      subscriptionStatusMessage = "Membership Expired!";
      subscriptionStatusColor = colors.danger;
      statusIcon = "close-circle";
    } else if (remainingDays <= 10) {
      subscriptionStatusMessage = `Only ${remainingDays} day${remainingDays !== 1 ? "s" : ""} remaining!`;
      subscriptionStatusColor = colors.warning;
      statusIcon = "alert-circle";
    } else {
      subscriptionStatusMessage = `${remainingDays} day${remainingDays !== 1 ? "s" : ""} remaining`;
      statusIcon = "timer";
    }
  }

  const renderDetailItem = (iconName, label, value, iconColor = colors.text, isPressable = false, onPress = null) => (
    <View style={styles.detailRow}>
      <MaterialCommunityIcons name={iconName} size={20} color={iconColor} style={styles.detailIcon} />
      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{label}:</Text>
      {isPressable ? (
        <TouchableOpacity onPress={onPress}>
          <Text style={[styles.detailValue, { color: colors.primary }]}>{value || "N/A"}</Text>
        </TouchableOpacity>
      ) : (
        <Text style={[styles.detailValue, { color: colors.text }]}>{value || "N/A"}</Text>
      )}
    </View>
  );

  const renderContactItem = (iconName, label, value, actionIcon, onPress) => (
    <View style={styles.contactRow}>
      <View style={styles.contactInfo}>
        <MaterialCommunityIcons name={iconName} size={20} color={colors.text} style={styles.detailIcon} />
        <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{label}:</Text>
        <TouchableOpacity onPress={onPress}>
          <Text style={[styles.detailValue, { color: colors.primary }]}>{value || "N/A"}</Text>
        </TouchableOpacity>
      </View>
      {value && (
        <TouchableOpacity onPress={onPress} style={styles.actionIcon}>
          <MaterialCommunityIcons name={actionIcon} size={24} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <Animated.View style={[styles.container, { backgroundColor: colors.background, opacity: fadeAnim }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: colors.text }]}>Member Profile</Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            onPress={() => router.push({ pathname: "/(member)/update-member/[id]", params: { id } })}
            style={styles.headerButton}
          >
            <Feather name="edit" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleDeleteMember}
            style={styles.headerButton}
          >
            <MaterialIcons name="delete" size={20} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Profile Card */}
        <Animatable.View 
          animation="fadeInUp"
          duration={600}
          style={[styles.profileCard, { backgroundColor: colors.cardBackground }]}
        >
          <View style={styles.profileTop}>
            <Image
              source={{ uri: avatarUrl }}
              style={styles.photo}
              onError={(e) => console.log("Error loading image:", e.nativeEvent.error)}
            />
            
            <View style={styles.profileInfo}>
              <Text style={[styles.name, { color: colors.text }]}>{member.name}</Text>
              <View style={styles.statusContainer}>
                <Ionicons 
                  name={statusIcon} 
                  size={20} 
                  color={subscriptionStatusColor} 
                />
                <Text style={[styles.statusText, { color: subscriptionStatusColor }]}>
                  {member.status ? member.status.toUpperCase() : "N/A"}
                </Text>
              </View>
              {remainingDays !== null && (
                <Text style={[styles.daysRemaining, { color: subscriptionStatusColor }]}>
                  {subscriptionStatusMessage}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.profileMeta}>
            {renderContactItem(
              "phone", 
              "Phone", 
              member.phone, 
              "whatsapp", 
              () => handlePhonePress(member.phone)
            )}
            {renderContactItem(
              "email", 
              "Email", 
              member.email, 
              "email-send", 
              () => handleEmailPress(member.email)
            )}
          </View>
        </Animatable.View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'details' 
                ? { backgroundColor: colors.tabActive }
                : { backgroundColor: colors.tabInactive }
            ]}
            onPress={() => setActiveTab('details')}
            activeOpacity={0.7}
          >
            <MaterialIcons 
              name="info" 
              size={20} 
              color={activeTab === 'details' ? colors.secondary : colors.textSecondary} 
            />
            <Text style={[
              styles.tabText,
              { color: activeTab === 'details' ? colors.secondary : colors.textSecondary }
            ]}>
              Details
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'attendance' 
                ? { backgroundColor: colors.tabActive }
                : { backgroundColor: colors.tabInactive }
            ]}
            onPress={() => setActiveTab('attendance')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons 
              name="calendar-check" 
              size={20} 
              color={activeTab === 'attendance' ? colors.secondary : colors.textSecondary} 
            />
            <Text style={[
              styles.tabText,
              { color: activeTab === 'attendance' ? colors.secondary : colors.textSecondary }
            ]}>
              Attendance
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content based on active tab */}
        {activeTab === 'details' ? (
          <Animatable.View 
            animation="fadeInUp"
            duration={800}
            style={styles.contentContainer}
          >
            {/* Personal Details Card */}
            <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
              <View style={styles.cardHeader}>
                <MaterialIcons name="person" size={20} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.text }]}>Personal Details</Text>
              </View>
              
              {renderDetailItem("map-marker", "Address", member.address)}
              {renderDetailItem("cake", "Age", member.age)}
              {renderDetailItem("gender-male-female", "Gender", member.gender)}
              {renderDetailItem("id-card", "ID", member._id.substring(0, 8))}
            </View>

            {/* Physical Details Card */}
            <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="arm-flex" size={20} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.text }]}>Physical Stats</Text>
              </View>
              
              {renderDetailItem("weight-kilogram", "Weight", `${member.weight} kg`)}
              {renderDetailItem("human-male-height", "Height", `${member.height} cm`)}
              {renderDetailItem("tape-measure", "BMI", bmi || "N/A")}
              {bmi && (
                <View style={styles.bmiIndicator}>
                  <Text style={[styles.bmiText, { color: colors.textSecondary }]}>
                    BMI Category: {getBmiCategory(bmi)}
                  </Text>
                  <View style={styles.bmiBarContainer}>
                    <View style={[
                      styles.bmiBar, 
                      { 
                        width: `${Math.min(100, (parseFloat(bmi) / 40 * 100))}%`,
                        backgroundColor: getBmiColor(bmi)
                      }
                    ]} />
                  </View>
                </View>
              )}
            </View>

            {/* Membership Details Card */}
            <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="card-account-details" size={20} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.text }]}>Membership</Text>
              </View>
              
              {renderDetailItem("account-cash", "Plan", member.membershipPlan)}
              {renderDetailItem("clock", "Batch", member.batch)}
              {renderDetailItem("calendar", "Joined", new Date(member.joiningDate).toLocaleDateString())}
              {renderDetailItem("calendar-month", "Subscription", `${member.monthsOfSubscription} months`)}
              {renderDetailItem("cash", "Fees", member.fees ? `₹${member.fees}` : "N/A")}
            </View>
          </Animatable.View>
        ) : (
          <Animatable.View 
            animation="fadeInUp"
            duration={800}
            style={[styles.attendanceContainer, { backgroundColor: colors.cardBackground }]}
          >
            <AttendanceCalendar memberId={id} />
          </Animatable.View>
        )}
      </ScrollView>
    </Animated.View>
  );
};

// Helper functions for BMI
const getBmiCategory = (bmi) => {
  const bmiValue = parseFloat(bmi);
  if (bmiValue < 18.5) return "Underweight";
  if (bmiValue >= 18.5 && bmiValue < 25) return "Normal";
  if (bmiValue >= 25 && bmiValue < 30) return "Overweight";
  return "Obese";
};

const getBmiColor = (bmi) => {
  const bmiValue = parseFloat(bmi);
  if (bmiValue < 18.5) return "#FFC107"; // Yellow for underweight
  if (bmiValue >= 18.5 && bmiValue < 25) return "#4CAF50"; // Green for normal
  if (bmiValue >= 25 && bmiValue < 30) return "#FF9800"; // Orange for overweight
  return "#F44336"; // Red for obese
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D2D',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    marginTop: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  retryText: {
    color: 'white',
    fontWeight: '500',
  },
  profileCard: {
    borderRadius: 12,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#1E88E5',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  daysRemaining: {
    fontSize: 13,
    fontWeight: '500',
  },
  profileMeta: {
    borderTopWidth: 1,
    borderTopColor: '#2D2D2D',
    paddingTop: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    marginLeft: 8,
    padding: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D2D',
    paddingBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailIcon: {
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  detailLabel: {
    fontSize: 14,
    width: 100,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  bmiIndicator: {
    marginTop: 12,
  },
  bmiText: {
    fontSize: 13,
    marginBottom: 4,
  },
  bmiBarContainer: {
    height: 6,
    backgroundColor: '#2D2D2D',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 4,
  },
  bmiBar: {
    height: '100%',
    borderRadius: 3,
  },
  attendanceContainer: {
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 16,
    minHeight: 300,
  },
});

export default MemberDetailScreen;