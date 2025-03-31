import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
  Animated,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Picker } from "@react-native-picker/picker";
import { 
  FontAwesome, 
  Ionicons, 
  MaterialCommunityIcons,
  MaterialIcons,
  Feather,
  AntDesign
} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from 'expo-blur';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000/api";
const { width } = Dimensions.get("window");

const AddMemberScreen = ({ onClose }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    age: "",
    weight: "",
    height: "",
    photo: null,
    gender: "male",
    batch: "morning",
    membershipPlan: "basic",
    status: "active",
    joiningDate: "",
    monthsOfSubscription: "",
  });
  const fadeAnim = useState(new Animated.Value(0))[0];

  // Enhanced dark theme colors
  const colors = {
    background: "#121212",
    primary: "#1E88E5",
    secondary: "#FFFFFF",
    accent: "#00C853",
    text: "#E0E0E0",
    textSecondary: "#9E9E9E",
    cardBackground: "#1E1E1E",
    inputBackground: "#2D2D2D",
    border: "#333333",
    danger: "#FF5252",
    warning: "#FFC107",
    pickerBackground: "#2D2D2D",
  };

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      setFormData((prev) => ({
        ...prev,
        photo: result.assets[0].uri,
      }));
    }
  };

  const handleAddMember = async () => {
    if (
      !formData.name ||
      !formData.email ||
      !formData.phone ||
      !formData.age ||
      !formData.weight ||
      !formData.height ||
      !formData.joiningDate ||
      !formData.gender ||
      !formData.batch
    ) {
      Alert.alert("Error", "Please fill all required fields.");
      return;
    }
    if (!/^[0-9]+$/.test(formData.phone)) {
      Alert.alert("Error", "Phone number must contain only digits.");
      return;
    }

    // Validate joining date format (DD-MM-YYYY)
    const dateRegex = /^\d{2}-\d{2}-\d{4}$/;
    if (!dateRegex.test(formData.joiningDate)) {
      Alert.alert("Error", "Joining date must be in the format DD-MM-YYYY.");
      return;
    }

    // If status is not trial, ensure subscription months is provided
    if (formData.status !== "trial" && !formData.monthsOfSubscription) {
      Alert.alert(
        "Error",
        "Subscription months is required for non-trial members."
      );
      return;
    }

    setIsLoading(true);

    try {
      // Retrieve the token from AsyncStorage
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found. Please log in again.");
      }
      console.log("Form Data:", formData);

      console.log("Form Data being sent:", JSON.stringify(formData, null, 2)); // Log form data

      const response = await fetch(
        `${API_BASE_URL}/user/members`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // Include the token in the headers
          },
          body: JSON.stringify(formData),
        }
      );

      console.log("Response status:", response.status); // Log response status

      const result = await response.json();
      console.log("API Response:", result); // Log API response

      if (response.ok) {
        Alert.alert(
          "Success",
          `Member "${formData.name}" added successfully!`,
          [
            {
              text: "OK",
              onPress: () => {
                console.log("Navigating to all-members screen");
                router.push("/(tabs)/all-members");
                onClose();
              },
            },
          ]
        );
      } else {
        Alert.alert("Error", result.error || "Failed to add member");
      }
    } catch (err) {
      console.error("Error adding member:", err); // Log the error
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Animated.View style={[styles.container, { backgroundColor: colors.background, opacity: fadeAnim }]}>
      <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header with close button */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={onClose}
            style={styles.closeButton}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Add New Member</Text>
        </View>

        {/* Photo Section */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Profile Photo</Text>
          <TouchableOpacity 
            style={styles.photoContainer} 
            onPress={pickImage}
            activeOpacity={0.8}
          >
            {formData.photo ? (
              <Image source={{ uri: formData.photo }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Feather name="camera" size={32} color={colors.textSecondary} />
                <Text style={[styles.photoPlaceholderText, { color: colors.textSecondary }]}>
                  Add Photo
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Personal Details Section */}
        <View style={[styles.sectionContainer, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="account-details" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal Details</Text>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="person" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Enter full name"
                placeholderTextColor={colors.textSecondary}
                value={formData.name}
                onChangeText={(value) => handleInputChange("name", value)}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Email</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="email" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Enter email"
                placeholderTextColor={colors.textSecondary}
                value={formData.email}
                onChangeText={(value) => handleInputChange("email", value)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Phone Number</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="phone" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Enter phone number"
                placeholderTextColor={colors.textSecondary}
                value={formData.phone}
                onChangeText={(value) => handleInputChange("phone", value)}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Address</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="location-on" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Enter address"
                placeholderTextColor={colors.textSecondary}
                value={formData.address}
                onChangeText={(value) => handleInputChange("address", value)}
              />
            </View>
          </View>
        </View>

        {/* Physical Details Section */}
        <View style={[styles.sectionContainer, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="arm-flex" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Physical Details</Text>
          </View>
          
          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={[styles.label, { color: colors.text }]}>Height (cm)</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="human-male-height" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Enter height"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.height}
                  onChangeText={(value) => handleInputChange("height", value)}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.text }]}>Weight (kg)</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="weight-kilogram" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Enter weight"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.weight}
                  onChangeText={(value) => handleInputChange("weight", value)}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Age</Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="cake" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Enter age"
                placeholderTextColor={colors.textSecondary}
                value={formData.age}
                onChangeText={(value) => handleInputChange("age", value)}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Gender</Text>
            <View style={[styles.pickerContainer, { backgroundColor: colors.pickerBackground }]}>
              <MaterialCommunityIcons name="gender-male-female" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <Picker
                selectedValue={formData.gender}
                onValueChange={(value) => handleInputChange("gender", value)}
                style={[styles.picker, { color: colors.text }]}
                dropdownIconColor={colors.textSecondary}
                mode="dropdown"
              >
                <Picker.Item label="Male" value="male" />
                <Picker.Item label="Female" value="female" />
                <Picker.Item label="Other" value="other" />
              </Picker>
            </View>
          </View>
        </View>

        {/* Membership Details Section */}
        <View style={[styles.sectionContainer, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="card-account-details" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Membership Details</Text>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Training Batch</Text>
            <View style={[styles.pickerContainer, { backgroundColor: colors.pickerBackground }]}>
              <MaterialCommunityIcons name="clock" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <Picker
                selectedValue={formData.batch}
                onValueChange={(value) => handleInputChange("batch", value)}
                style={[styles.picker, { color: colors.text }]}
                dropdownIconColor={colors.textSecondary}
                mode="dropdown"
              >
                <Picker.Item label="Morning Batch (6-9 AM)" value="morning" />
                <Picker.Item label="Evening Batch (5-8 PM)" value="evening" />
              </Picker>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Membership Plan</Text>
            <View style={[styles.pickerContainer, { backgroundColor: colors.pickerBackground }]}>
              <MaterialCommunityIcons name="cash" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <Picker
                selectedValue={formData.membershipPlan}
                onValueChange={(value) => handleInputChange("membershipPlan", value)}
                style={[styles.picker, { color: colors.text }]}
                dropdownIconColor={colors.textSecondary}
                mode="dropdown"
              >
                <Picker.Item label="Basic (₹500/month)" value="basic" />
                <Picker.Item label="Premium (₹800/month)" value="premium" />
                <Picker.Item label="VIP (₹1200/month)" value="vip" />
              </Picker>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Member Status</Text>
            <View style={[styles.pickerContainer, { backgroundColor: colors.pickerBackground }]}>
              <MaterialCommunityIcons name="account-check" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <Picker
                selectedValue={formData.status}
                onValueChange={(value) => {
                  handleInputChange("status", value);
                  if (value === "trial") {
                    handleInputChange("monthsOfSubscription", "");
                  }
                }}
                style={[styles.picker, { color: colors.text }]}
                dropdownIconColor={colors.textSecondary}
                mode="dropdown"
              >
                <Picker.Item label="Active" value="active" />
                <Picker.Item label="Inactive" value="inactive" />
                <Picker.Item label="Trial (7 days free)" value="trial" />
              </Picker>
            </View>
          </View>
        </View>

        {/* Subscription Details */}
        <View style={[styles.sectionContainer, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="calendar-clock" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Subscription Details</Text>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Joining Date</Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="calendar" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="DD-MM-YYYY"
                placeholderTextColor={colors.textSecondary}
                value={formData.joiningDate}
                onChangeText={(value) => handleInputChange("joiningDate", value)}
              />
            </View>
          </View>

          {formData.status !== "trial" && (
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Subscription Duration</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="calendar-month" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Number of months"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.monthsOfSubscription}
                  onChangeText={(value) => handleInputChange("monthsOfSubscription", value.replace(/[^0-9]/g, ""))}
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}

          {formData.status === "trial" && (
            <View style={styles.trialContainer}>
              <MaterialCommunityIcons name="clock-alert" size={20} color={colors.accent} />
              <Text style={[styles.trialText, { color: colors.accent }]}>
                Trial members get 7 days free access
              </Text>
            </View>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.primary }]}
          onPress={handleAddMember}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.secondary} />
          ) : (
            <>
              <AntDesign name="adduser" size={20} color={colors.secondary} />
              <Text style={[styles.submitButtonText, { color: colors.secondary }]}>
                Add Member
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 16,
  },
  closeButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    flex: 1,
  },
  sectionContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#1E1E1E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D2D',
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#E0E0E0',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2D2D2D',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#FFFFFF',
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  picker: {
    flex: 1,
    height: '100%',
    color: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  photoContainer: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#1E88E5',
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#2D2D2D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#9E9E9E',
  },
  trialContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1E3A2D',
    borderRadius: 8,
    marginTop: 8,
  },
  trialText: {
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 12,
    marginTop: 16,
    gap: 12,
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});

export default AddMemberScreen;