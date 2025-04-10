import React, { useState, useEffect } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  Animated,
  TextInput,
} from "react-native";
import moment from "moment";
import * as Animatable from 'react-native-animatable';
import { 
  AntDesign, 
  MaterialIcons, 
  MaterialCommunityIcons,
  FontAwesome,
  Feather,
  Ionicons,
  Entypo
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from 'expo-blur';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000/api";

const MemberAttendance = () => {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(moment());
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [isMarkingAttendance, setIsMarkingAttendance] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const fadeAnim = useState(new Animated.Value(0))[0];

  // Enhanced dark theme colors
  const colors = {
    primary: "#1E88E5",
    secondary: "#FFFFFF",
    accent: "#00C853",
    text: "#E0E0E0",
    textSecondary: "#9E9E9E",
    background: "#121212",
    cardBackground: "#1E1E1E",
    inputBackground: "#2D2D2D",
    border: "#333333",
    danger: "#FF5252",
    warning: "#FFC107",
    present: "#4CAF50",
    absent: "#F44336",
  };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
    fetchMembers();
  }, []);

  useEffect(() => {
    if (members.length > 0) {
      fetchAttendanceData();
    }
  }, [currentDate, members]);

  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const response = await fetch(`${API_BASE_URL}/user/members`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch members");
      setMembers(Array.isArray(data) ? data : []);
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to load members");
      setMembers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAttendanceData = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const response = await fetch(
        `${API_BASE_URL}/attendance?date=${currentDate.format("YYYY-MM-DD")}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch attendance");
      setAttendance(Array.isArray(data) ? data : []);
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to load attendance data");
      setAttendance([]);
    }
  };

  const handleMarkAttendance = async (memberId) => {
    try {
      setIsMarkingAttendance(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Authentication required");

      const attendanceData = {
        memberId,
        date: currentDate.format("YYYY-MM-DD"),
        attendanceStatus: "Present",
        checkInTime: moment().format("HH:mm"),
      };

      const response = await fetch(`${API_BASE_URL}/attendance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(attendanceData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to mark attendance");
      await fetchAttendanceData();
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to mark attendance");
    } finally {
      setIsMarkingAttendance(false);
    }
  };

  // Filter members based on search query (name or phone number)
  const filteredMembers = members.filter(member => {
    const searchLower = searchQuery.toLowerCase();
    return (
      member.name?.toLowerCase().includes(searchLower) ||
      member.phone?.includes(searchQuery)
    );
  });

  const memberWithAttendance = filteredMembers.map((member) => {
    const attendanceRecord = attendance.find((record) => 
      String(record.memberId) === String(member._id) || 
      String(record.memberId) === String(member.memberId)
    );
    return {
      ...member,
      isPresent: attendanceRecord?.attendanceStatus === "Present",
      checkInTime: attendanceRecord?.checkInTime || null,
    };
  });

  const goToNextDay = () => {
    const nextDate = moment(currentDate).add(1, "days");
    if (nextDate.isAfter(moment(), "day")) {
      Alert.alert("Info", "Cannot navigate to future dates");
      return;
    }
    setCurrentDate(nextDate);
  };

  const goToPrevDay = () => {
    setCurrentDate(moment(currentDate).subtract(1, "days"));
  };

  const formatDate = (date) => {
    return date.format("MMMM D, YYYY");
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading attendance...</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { backgroundColor: colors.background, opacity: fadeAnim }]}>
      <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.cardBackground }]}>
        <Pressable 
          onPress={() => router.back()} 
          style={styles.backButton}
          android_ripple={{ color: colors.primary, borderless: true }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Member Attendance</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.cardBackground }]}>
          <View style={[styles.searchInputContainer, { backgroundColor: colors.inputBackground }]}>
            <Feather name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search by name or phone..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <Pressable
                onPress={() => setSearchQuery("")}
                style={styles.clearButton}
              >
                <Entypo name="cross" size={20} color={colors.textSecondary} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Date Navigation */}
        <View style={[styles.dateContainer, { backgroundColor: colors.cardBackground }]}>
          <Pressable 
            onPress={goToPrevDay} 
            style={styles.navButton}
            android_ripple={{ color: colors.primary, borderless: true }}
          >
            <AntDesign name="left" size={20} color={colors.text} />
          </Pressable>

          <View style={styles.dateTextContainer}>
            <MaterialCommunityIcons name="calendar" size={20} color={colors.primary} />
            <Text style={[styles.dateText, { color: colors.text }]}>
              {formatDate(currentDate)}
            </Text>
          </View>

          <Pressable
            onPress={goToNextDay}
            style={styles.navButton}
            disabled={currentDate.isSame(moment(), "day")}
            android_ripple={{ color: colors.primary, borderless: true }}
          >
            <AntDesign
              name="right"
              size={20}
              color={currentDate.isSame(moment(), "day") ? colors.textSecondary : colors.text}
            />
          </Pressable>
        </View>

        {/* Attendance Summary */}
        <View style={[styles.summaryContainer, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Members</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{filteredMembers.length}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Present</Text>
            <Text style={[styles.summaryValue, { color: colors.present }]}>
              {memberWithAttendance.filter(m => m.isPresent).length}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Absent</Text>
            <Text style={[styles.summaryValue, { color: colors.absent }]}>
              {memberWithAttendance.filter(m => !m.isPresent).length}
            </Text>
          </View>
        </View>

        {/* Member List */}
        {memberWithAttendance.length > 0 ? (
          memberWithAttendance.map((member, index) => (
            <Animatable.View 
              key={member._id || index}
              animation="fadeInUp"
              duration={600}
              delay={index * 50}
              style={[styles.memberCard, { backgroundColor: colors.cardBackground }]}
            >
              {/* Member Avatar */}
              <View style={styles.avatarContainer}>
                {member.photo ? (
                  <Image source={{ uri: member.photo }} style={styles.avatarImage} />
                ) : (
                  <View style={[styles.avatarFallback, { backgroundColor: colors.primary }]}>
                    <Text style={styles.avatarText}>
                      {member?.name?.charAt(0)?.toUpperCase() || "M"}
                    </Text>
                  </View>
                )}
              </View>

              {/* Member Info */}
              <View style={styles.memberInfo}>
                <Text style={[styles.memberName, { color: colors.text }]}>
                  {member?.name || "Unknown Member"}
                </Text>
                <View style={styles.memberMeta}>
                  <MaterialCommunityIcons name="phone" size={14} color={colors.textSecondary} />
                  <Text style={[styles.memberId, { color: colors.textSecondary }]}>
                    {member?.phone || "N/A"}
                  </Text>
                </View>
                {member.isPresent && member.checkInTime && (
                  <View style={styles.checkInContainer}>
                    <MaterialCommunityIcons name="clock-check" size={14} color={colors.present} />
                    <Text style={[styles.checkInTime, { color: colors.present }]}>
                      Checked in at {member.checkInTime}
                    </Text>
                  </View>
                )}
              </View>

              {/* Attendance Status */}
              <View style={styles.statusContainer}>
                {member.isPresent ? (
                  <View style={[styles.statusBadge, { backgroundColor: colors.present }]}>
                    <MaterialCommunityIcons name="check" size={18} color={colors.secondary} />
                  </View>
                ) : (
                  <Pressable
                    onPress={() => handleMarkAttendance(member._id)}
                    style={({ pressed }) => [
                      styles.markButton,
                      { 
                        backgroundColor: pressed ? '#0D47A1' : colors.primary,
                        opacity: isMarkingAttendance ? 0.7 : 1
                      }
                    ]}
                    disabled={isMarkingAttendance}
                  >
                    {isMarkingAttendance ? (
                      <ActivityIndicator size="small" color={colors.secondary} />
                    ) : (
                      <>
                        <FontAwesome name="check-circle" size={16} color={colors.secondary} />
                        <Text style={[styles.markText, { color: colors.secondary }]}>Check In</Text>
                      </>
                    )}
                  </Pressable>
                )}
              </View>
            </Animatable.View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            {searchQuery.length > 0 ? (
              <>
                <MaterialCommunityIcons name="magnify" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.text }]}>No members found</Text>
                <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>
                  No results for "{searchQuery}"
                </Text>
              </>
            ) : (
              <>
                <MaterialCommunityIcons name="account-group" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.text }]}>No members found</Text>
                <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>
                  Add members to track attendance
                </Text>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    elevation: 3,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 16,
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
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  clearButton: {
    padding: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    elevation: 2,
  },
  navButton: {
    padding: 12,
    borderRadius: 30,
  },
  dateTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarFallback: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  memberMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberId: {
    fontSize: 13,
    marginLeft: 4,
  },
  checkInContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  checkInTime: {
    fontSize: 13,
    marginLeft: 4,
  },
  statusContainer: {
    marginLeft: 8,
  },
  statusBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  markText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default MemberAttendance;