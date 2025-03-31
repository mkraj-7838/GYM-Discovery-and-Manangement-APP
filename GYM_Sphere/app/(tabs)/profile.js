import React, { useState, useEffect } from "react";
import { 
  View, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  Image, 
  TextInput, 
  Alert, 
  ActivityIndicator,
  ScrollView,
  Dimensions 
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "expo-router";
import { logoutAction } from "../(redux)/authSlice";
import ProtectedRoute from "../../components/ProtectedRoute";
import * as ImagePicker from "expo-image-picker";
import { MaterialIcons, FontAwesome, Ionicons } from '@expo/vector-icons';
import axios from "axios";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000/api";

// Razorpay-inspired color palette
const colors = {
  primary: "#2D89FF",       // Razorpay blue
  primaryDark: "#0F4C81",   // Darker blue
  background: "#0F172A",    // Dark navy background
  surface: "#1E293B",       // Card surfaces
  accent: "#60A5FA",        // Light blue accent
  text: "#E2E8F0",         // Light text
  secondaryText: "#94A3B8", // Secondary text
  error: "#F87171",         // Error red
  success: "#34D399",       // Success green
  warning: "#FBBF24",       // Warning yellow
};

export default function Profile() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);

  const [profileData, setProfileData] = useState({
    name: "",
    gymName: "",
    address: "",
    phone: "",
    photo: "",
    coverPhoto: ""
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { width } = Dimensions.get('window');

  // Load profile data from backend
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/user/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfileData(response.data);
      } catch (error) {
        console.error("Error fetching profile:", error);
        Alert.alert("Error", "Failed to load profile data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  // Handle image upload for profile or cover
  const uploadImage = async (type) => {
    try {
      setIsUploading(true);
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'cover' ? [3, 1] : [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const formData = new FormData();
        formData.append('image', {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: 'profile.jpg'
        });

        const response = await axios.post(
          `${API_BASE_URL}/user/upload-${type}-photo`, 
          formData, 
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        setProfileData(prev => ({
          ...prev,
          [type === 'cover' ? 'coverPhoto' : 'photo']: response.data.url
        }));
      }
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Error", "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  // Update profile data
  const updateProfile = async () => {
    try {
      setIsLoading(true);
      await axios.put(`${API_BASE_URL}/user/profile`, profileData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      console.error("Update error:", error);
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    dispatch(logoutAction());
    router.push("/auth/login");
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ProtectedRoute>
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Cover Photo */}
        <View style={styles.coverContainer}>
          {profileData.coverPhoto ? (
            <Image 
              source={{ uri: profileData.coverPhoto }} 
              style={styles.coverImage} 
            />
          ) : (
            <View style={[styles.coverImage, { backgroundColor: colors.primaryDark }]}>
              <Text style={styles.placeholderText}>Cover Photo</Text>
            </View>
          )}
          <TouchableOpacity 
            style={styles.editCoverButton}
            onPress={() => uploadImage('cover')}
            disabled={isUploading}
          >
            <MaterialIcons name="edit" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {profileData.photo ? (
              <Image source={{ uri: profileData.photo }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: colors.surface }]}>
                <FontAwesome name="user" size={40} color={colors.primary} />
              </View>
            )}
            <TouchableOpacity 
              style={[styles.editAvatarButton, { backgroundColor: colors.primary }]}
              onPress={() => uploadImage('profile')}
              disabled={isUploading}
            >
              <MaterialIcons name="edit" size={16} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.profileInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>{profileData.name || "Your Name"}</Text>
            <Text style={[styles.userEmail, { color: colors.secondaryText }]}>{user?.email}</Text>
          </View>
        </View>

        {/* Gym Name Highlight */}
        <View style={[styles.gymNameContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.gymNameText}>
            {profileData.gymName || "Your Gym Name"}
          </Text>
        </View>

        {/* Profile Details */}
        <View style={styles.detailsContainer}>
          <View style={[styles.detailItem, { backgroundColor: colors.surface }]}>
            <MaterialIcons name="location-on" size={24} color={colors.primary} />
            {isEditing ? (
              <TextInput
                style={[styles.editInput, { color: colors.text }]}
                value={profileData.address}
                onChangeText={(text) => setProfileData({...profileData, address: text})}
                placeholder="Enter your address"
                placeholderTextColor={colors.secondaryText}
              />
            ) : (
              <Text style={[styles.detailText, { color: colors.text }]}>
                {profileData.address || "Not specified"}
              </Text>
            )}
          </View>

          <View style={[styles.detailItem, { backgroundColor: colors.surface }]}>
            <MaterialIcons name="phone" size={24} color={colors.primary} />
            {isEditing ? (
              <TextInput
                style={[styles.editInput, { color: colors.text }]}
                value={profileData.phone}
                onChangeText={(text) => setProfileData({...profileData, phone: text})}
                placeholder="Enter your phone number"
                placeholderTextColor={colors.secondaryText}
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={[styles.detailText, { color: colors.text }]}>
                {profileData.phone || "Not specified"}
              </Text>
            )}
          </View>

          {/* Edit/Save Buttons */}
          <View style={styles.buttonGroup}>
            {isEditing ? (
              <>
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: colors.success }]}
                  onPress={updateProfile}
                  disabled={isLoading}
                >
                  <Text style={styles.buttonText}>Save Changes</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: colors.secondaryText }]}
                  onPress={() => setIsEditing(false)}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={() => setIsEditing(true)}
              >
                <Text style={styles.buttonText}>Update Profile</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.error }]}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="white" />
              <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverContainer: {
    height: 200,
    width: '100%',
    position: 'relative',
  },
  coverImage: {
    height: '100%',
    width: '100%',
  },
  editCoverButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderRadius: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginTop: -50,
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#1E293B',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    padding: 6,
    borderRadius: 20,
  },
  profileInfo: {
    marginLeft: 15,
    marginBottom: 10,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 16,
    marginTop: 2,
  },
  gymNameContainer: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 20,
  },
  gymNameText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  detailsContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2.22,
    elevation: 3,
  },
  detailText: {
    fontSize: 16,
    marginLeft: 10,
    flex: 1,
  },
  editInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingVertical: 5,
  },
  buttonGroup: {
    marginTop: 20,
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  placeholderText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});