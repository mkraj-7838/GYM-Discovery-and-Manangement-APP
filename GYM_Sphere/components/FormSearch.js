import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
  Keyboard,
  TextInput,
  RefreshControl,
} from "react-native";
import { MaterialIcons, Ionicons, FontAwesome } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Animatable from "react-native-animatable";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000/api";

const SearchMemberScreen = ({ onClose }) => {
  const [phone, setPhone] = useState("");
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [members, setMembers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  // Fetch all members on component mount
  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setRefreshing(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${API_BASE_URL}/user/members`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch members");
      }

      setMembers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch members error:", error);
      Alert.alert("Error", error.message || "Failed to load members");
      setMembers([]);
    } finally {
      setRefreshing(false);
    }
  };

  const searchMember = async () => {
    if (!phone) {
      setError("Please enter a phone number");
      return;
    }

    setError(null);
    setLoading(true);
    Keyboard.dismiss();

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required");
      }

      // Check if member already exists
      const existingMember = members.find(m => m.phone === phone);
      if (existingMember) {
        throw new Error(`Member with phone ${phone} already exists as a full member`);
      }

      const response = await fetch(
        `${API_BASE_URL}/user/members/form-member/search`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ phone }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to search member");
      }

      if (!data.data) {
        throw new Error("No form member found with this phone number");
      }

      setMember(data.data);
    } catch (error) {
      setError(error.message);
      setMember(null);
    } finally {
      setLoading(false);
    }
  };

  const convertToMember = async () => {
    if (!member) return;

    setIsConverting(true);

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required");
      }

      // Check again if member exists (race condition protection)
      const existingMember = members.find(m => m.phone === member.phone);
      if (existingMember) {
        throw new Error(`Member with phone ${member.phone} already exists`);
      }

      // Format the joining date to DD-MM-YYYY
      const joiningDate = new Date(member.joiningDate);
      const day = String(joiningDate.getDate()).padStart(2, "0");
      const month = String(joiningDate.getMonth() + 1).padStart(2, "0");
      const year = joiningDate.getFullYear();
      const formattedJoiningDate = `${day}-${month}-${year}`;

      const memberData = {
        name: member.name,
        email: member.email,
        phone: member.phone,
        address: member.address,
        age: member.age,
        weight: member.weight,
        height: member.height,
        gender: member.gender,
        batch: member.batch,
        membershipPlan: member.membershipPlan,
        status: member.status,
        joiningDate: formattedJoiningDate,
        monthsOfSubscription: member.monthsOfSubscription,
        photo: member.photo || null,
      };

      const response = await fetch(`${API_BASE_URL}/user/members/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(memberData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to add member");
      }

      // Show success alert with animation
      Alert.alert(
        "✅ Success", 
        `Member "${member.name}" added successfully!`,
        [
          {
            text: "Great!",
            onPress: () => {
              setMember(null);
              setPhone("");
              fetchMembers(); // Refresh members list
              if (onClose) onClose();
            },
          },
        ],
        { cancelable: false }
      );
      
    } catch (error) {
      console.error("Conversion error:", error);
      Alert.alert(
        "❌ Error", 
        error.message || "Failed to convert member. Please try again.",
        [
          { 
            text: "OK", 
            style: "cancel" 
          },
          {
            text: "Refresh",
            onPress: () => fetchMembers()
          }
        ]
      );
    } finally {
      setIsConverting(false);
    }
  };

  const clearSearch = () => {
    setPhone("");
    setMember(null);
    setError(null);
  };

  return (
    <View style={styles.container}>
      {/* Animated Header */}
      <Animatable.View 
        animation="fadeInDown"
        duration={500}
        style={styles.header}
      >
        <TouchableOpacity 
          onPress={onClose} 
          style={styles.closeButton}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={28} color="#BB86FC" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <FontAwesome name="search" size={24} color="#BB86FC" />
          <Text style={styles.headerTitle}>Search Form Member</Text>
        </View>
        <View style={{ width: 28 }} />
      </Animatable.View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchMembers}
            colors={["#BB86FC"]}
            tintColor="#BB86FC"
          />
        }
      >
        {/* Search Section */}
        <Animatable.View 
          animation="fadeInUp"
          delay={300}
          style={styles.searchContainer}
        >
          <View style={styles.inputContainer}>
            <MaterialIcons 
              name="phone" 
              size={20} 
              color="#888" 
              style={styles.inputIcon} 
            />
            <TextInput
              style={styles.input}
              placeholder="Enter phone number"
              placeholderTextColor="#888"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                setError(null);
              }}
              onSubmitEditing={searchMember}
            />
            {phone ? (
              <TouchableOpacity
                onPress={clearSearch}
                style={styles.clearButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={20} color="#888" />
              </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity
            style={[styles.searchButton, loading && styles.disabledButton]}
            onPress={searchMember}
            disabled={loading}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialIcons name="search" size={20} color="#fff" />
                <Text style={styles.buttonText}>Search</Text>
              </>
            )}
          </TouchableOpacity>
        </Animatable.View>

        {/* Error Message */}
        {error && (
          <Animatable.View 
            animation="fadeIn"
            style={styles.errorContainer}
          >
            <MaterialIcons name="error-outline" size={24} color="#F44336" />
            <Text style={styles.errorText}>{error}</Text>
          </Animatable.View>
        )}

        {/* Member Card */}
        {member && (
          <Animatable.View 
            animation="fadeInUp"
            duration={500}
            style={styles.card}
          >
            <View style={styles.cardHeader}>
              {member.photo ? (
                <Image
                  source={{ uri: member.photo }}
                  style={styles.memberImage}
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <MaterialIcons name="person" size={40} color="#BB86FC" />
                </View>
              )}
              <Text style={styles.name}>{member.name}</Text>
            </View>

            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <MaterialIcons name="phone" size={18} color="#BB86FC" />
                <Text style={styles.detailText}>{member.phone}</Text>
              </View>

              <View style={styles.detailRow}>
                <MaterialIcons name="email" size={18} color="#BB86FC" />
                <Text style={styles.detailText}>
                  {member.email || "Not provided"}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <MaterialIcons name="home" size={18} color="#BB86FC" />
                <Text style={styles.detailText}>
                  {member.address || "Not provided"}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <MaterialIcons name="cake" size={18} color="#BB86FC" />
                <Text style={styles.detailText}>Age: {member.age}</Text>
              </View>

              <View style={styles.detailRow}>
                <MaterialIcons name="straighten" size={18} color="#BB86FC" />
                <Text style={styles.detailText}>Height: {member.height} cm</Text>
              </View>

              <View style={styles.detailRow}>
                <MaterialIcons name="fitness-center" size={18} color="#BB86FC" />
                <Text style={styles.detailText}>Weight: {member.weight} kg</Text>
              </View>

              <View style={styles.detailRow}>
                <MaterialIcons name="wc" size={18} color="#BB86FC" />
                <Text style={styles.detailText}>Gender: {member.gender}</Text>
              </View>

              <View style={styles.detailRow}>
                <MaterialIcons name="schedule" size={18} color="#BB86FC" />
                <Text style={styles.detailText}>Batch: {member.batch}</Text>
              </View>

              <View style={styles.detailRow}>
                <MaterialIcons name="card-membership" size={18} color="#BB86FC" />
                <Text style={styles.detailText}>
                  Plan: {member.membershipPlan}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <MaterialIcons name="event-available" size={18} color="#BB86FC" />
                <Text style={styles.detailText}>
                  Joining Date:{" "}
                  {new Date(member.joiningDate).toLocaleDateString()}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <MaterialIcons name="calendar-today" size={18} color="#BB86FC" />
                <Text style={styles.detailText}>
                  Subscription: {member.monthsOfSubscription} months
                </Text>
              </View>

              <View style={styles.detailRow}>
                <MaterialIcons name="verified-user" size={18} color="#BB86FC" />
                <Text style={styles.detailText}>Status: {member.status}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.convertButton,
                isConverting && styles.disabledButton,
              ]}
              onPress={convertToMember}
              disabled={isConverting}
              activeOpacity={0.7}
            >
              {isConverting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="person-add" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Convert to Full Member</Text>
                </>
              )}
            </TouchableOpacity>
          </Animatable.View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    elevation: 4,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 10,
  },
  closeButton: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: "#2D2D2D",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  searchContainer: {
    flexDirection: "row",
    marginBottom: 20,
    alignItems: "center",
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    paddingHorizontal: 15,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    color: "#fff",
    fontSize: 16,
  },
  clearButton: {
    padding: 8,
    borderRadius: 20,
  },
  searchButton: {
    flexDirection: "row",
    backgroundColor: "#BB86FC",
    padding: 14,
    borderRadius: 12,
    marginLeft: 10,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
    elevation: 3,
    shadowColor: "#BB86FC",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
    fontSize: 16,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#F44336",
    elevation: 2,
  },
  errorText: {
    color: "#F44336",
    marginLeft: 12,
    flex: 1,
    fontSize: 15,
  },
  card: {
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  cardHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  memberImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
    backgroundColor: "#121212",
    borderWidth: 2,
    borderColor: "#BB86FC",
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
    backgroundColor: "#2D2D2D",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#BB86FC",
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  detailsContainer: {
    marginTop: 10,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#2D2D2D",
  },
  detailText: {
    fontSize: 16,
    marginLeft: 12,
    color: "#ddd",
    flex: 1,
  },
  convertButton: {
    backgroundColor: "#03DAC6",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    elevation: 3,
    shadowColor: "#03DAC6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

export default SearchMemberScreen;