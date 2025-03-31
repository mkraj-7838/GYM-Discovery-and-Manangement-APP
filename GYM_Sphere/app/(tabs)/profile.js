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
  Dimensions,
  Linking,
  Modal,
  FlatList
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "expo-router";
import { logoutAction } from "../(redux)/authSlice";
import ProtectedRoute from "../../components/ProtectedRoute";
import * as ImagePicker from "expo-image-picker";
import { 
  MaterialIcons, 
  FontAwesome, 
  Ionicons, 
  Feather,
  AntDesign,
  MaterialCommunityIcons,
  Entypo,
  FontAwesome5
} from '@expo/vector-icons';
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000/api";

// Enhanced color scheme
const colors = {
  primary: "#7C4DFF",
  primaryDark: "#512DA8",
  background: "#121212",
  surface: "#1E1E1E",
  accent: "#B388FF",
  text: "#FFFFFF",
  secondaryText: "#B0B0B0",
  error: "#FF5252",
  success: "#69F0AE",
  warning: "#FFD740",
  divider: "#333333",
  card: "#252525",
  highlight: "#FF9800",
};

export default function Profile() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const [profileData, setProfileData] = useState({
    name: "",
    gymName: "",
    address: "",
    phone: "",
    photo: "",
    coverPhoto: "",
    certifications: []
  });
  const [newCertification, setNewCertification] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  // Load profile data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const token = await AsyncStorage.getItem("token");
        
        const [profileRes, certsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/user/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_BASE_URL}/user/certifications`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        
        setProfileData({
          ...profileRes.data,
          certifications: certsRes.data
        });
      } catch (error) {
        Alert.alert("Error", "Failed to load profile data");
        console.error("Fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle image upload
  const uploadImage = async (type) => {
    try {
      setIsUploading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'cover' ? [3, 1] : [1, 1],
        quality: 0.8,
      });
      const token = await AsyncStorage.getItem("token");

      if (!result.canceled) {
        const field = type === 'cover' ? 'coverPhoto' : 'photo';
        const response = await axios.patch(
          `${API_BASE_URL}/user/profile`, 
          { [field]: result.assets[0].uri },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        setProfileData(prev => ({
          ...prev,
          [field]: response.data[field]
        }));
      }
    } catch (error) {
      Alert.alert("Error", "Failed to upload image");
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  // Update profile data
  const updateProfile = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem("token");
      const response = await axios.patch(
        `${API_BASE_URL}/user/profile`, 
        profileData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setProfileData(response.data);
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to update profile");
      console.error("Update error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add certification
  const addCertification = async () => {
    if (!newCertification.trim()) return;

    const token = await AsyncStorage.getItem("token");
    
    try {
      const response = await axios.post(
        `${API_BASE_URL}/user/certifications`, 
        { name: newCertification },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setProfileData(prev => ({
        ...prev,
        certifications: [...prev.certifications, response.data]
      }));
      setNewCertification("");
      setModalVisible(false);
    } catch (error) {
      Alert.alert("Error", "Failed to add certification");
      console.error("Certification error:", error);
    }
  };

  // Remove certification
  const removeCertification = async (id) => {
    try {
      const token = await AsyncStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/user/certifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setProfileData(prev => ({
        ...prev,
        certifications: prev.certifications.filter(cert => cert._id !== id)
      }));
    } catch (error) {
      Alert.alert("Error", "Failed to remove certification");
      console.error("Remove cert error:", error);
    }
  };

  // Handle logout
  const handleLogout = () => {
    dispatch(logoutAction());
    router.replace("/auth/login");
  };

  // Navigation functions
  const navigateTo = (screen) => {
    router.replace(`${screen}`);
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.text, marginTop: 10 }}>Loading your profile...</Text>
      </View>
    );
  }

  return (
    <ProtectedRoute>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Cover Photo */}
        <TouchableOpacity 
          onPress={() => uploadImage('cover')}
          disabled={isUploading}
          activeOpacity={0.8}
        >
          {profileData.coverPhoto ? (
            <Image 
              source={{ uri: profileData.coverPhoto }} 
              style={styles.coverPhoto} 
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.coverPhoto, { backgroundColor: colors.primaryDark }]}>
              <FontAwesome5 name="dumbbell" size={40} color={colors.accent} />
            </View>
          )}
          <View style={styles.coverEditButton}>
            <MaterialIcons name="edit" size={18} color="white" />
          </View>
        </TouchableOpacity>

        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity 
            onPress={() => uploadImage('profile')}
            disabled={isUploading}
            style={styles.avatarContainer}
          >
            {profileData.photo ? (
              <Image source={{ uri: profileData.photo }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: colors.surface }]}>
                <FontAwesome name="user" size={40} color={colors.primary} />
              </View>
            )}
            <View style={styles.editAvatarButton}>
              <MaterialIcons name="edit" size={16} color="white" />
            </View>
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            {isEditing ? (
              <TextInput
                style={[styles.nameInput, { color: colors.text }]}
                value={profileData.name}
                onChangeText={(text) => setProfileData({...profileData, name: text})}
                placeholder="Your Name"
                placeholderTextColor={colors.secondaryText}
              />
            ) : (
              <Text style={[styles.userName, { color: colors.text }]}>
                {profileData.name || "Your Name"}
              </Text>
            )}
            <Text style={[styles.userEmail, { color: colors.secondaryText }]}>
              {user?.email}
            </Text>
          </View>
        </View>

        {/* Navigation Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'profile' && styles.activeTab]}
            onPress={() => setActiveTab('profile')}
          >
            <MaterialIcons 
              name="person" 
              size={24} 
              color={activeTab === 'profile' ? colors.primary : colors.secondaryText} 
            />
            <Text style={[styles.tabText, activeTab === 'profile' && { color: colors.primary }]}>
              Profile
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'announcements' && styles.activeTab]}
            onPress={() => navigateTo('/(tools)/GymNotice')}
          >
            <Ionicons 
              name="megaphone" 
              size={24} 
              color={activeTab === 'announcements' ? colors.primary : colors.secondaryText} 
            />
            <Text style={[styles.tabText, activeTab === 'announcements' && { color: colors.primary }]}>
              Announce
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'feedback' && styles.activeTab]}
            onPress={() => navigateTo('feedback')}
          >
            <MaterialIcons 
              name="feedback" 
              size={24} 
              color={activeTab === 'feedback' ? colors.primary : colors.secondaryText} 
            />
            <Text style={[styles.tabText, activeTab === 'feedback' && { color: colors.primary }]}>
              Feedback
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollContainer}>
          {/* Gym Name Highlight */}
          <View style={[styles.gymNameContainer, { backgroundColor: colors.surface }]}>
            {isEditing ? (
              <TextInput
                style={[styles.gymNameInput, { color: colors.highlight }]}
                value={profileData.gymName}
                onChangeText={(text) => setProfileData({...profileData, gymName: text})}
                placeholder="Your Gym Name"
                placeholderTextColor={colors.secondaryText}
              />
            ) : (
              <Text style={[styles.gymName, { color: colors.highlight }]}>
                {profileData.gymName || "Your Gym Name"}
              </Text>
            )}
          </View>

          {/* Contact Info Section */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>Contact Information</Text>
            
            <View style={styles.detailItem}>
              <MaterialIcons name="location-on" size={24} color={colors.primary} />
              {isEditing ? (
                <TextInput
                  style={[styles.editInput, { color: colors.text }]}
                  value={profileData.address}
                  onChangeText={(text) => setProfileData({...profileData, address: text})}
                  placeholder="Address"
                  placeholderTextColor={colors.secondaryText}
                />
              ) : (
                <Text style={[styles.detailText, { color: colors.text }]}>
                  {profileData.address || "Not specified"}
                </Text>
              )}
              {!isEditing && profileData.address && (
                <TouchableOpacity 
                  onPress={() => Linking.openURL(`https://maps.google.com/?q=${profileData.address}`)}
                  style={styles.actionIcon}
                >
                  <Entypo name="direction" size={20} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.detailItem}>
              <MaterialIcons name="phone" size={24} color={colors.primary} />
              {isEditing ? (
                <TextInput
                  style={[styles.editInput, { color: colors.text }]}
                  value={profileData.phone}
                  onChangeText={(text) => setProfileData({...profileData, phone: text})}
                  placeholder="Phone Number"
                  placeholderTextColor={colors.secondaryText}
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={[styles.detailText, { color: colors.text }]}>
                  {profileData.phone || "Not specified"}
                </Text>
              )}
              {!isEditing && profileData.phone && (
                <TouchableOpacity 
                  onPress={() => Linking.openURL(`tel:${profileData.phone}`)}
                  style={styles.actionIcon}
                >
                  <MaterialIcons name="call" size={20} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Certifications Section */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>Certifications</Text>
              <TouchableOpacity 
                onPress={() => setModalVisible(true)}
                style={styles.addButton}
              >
                <AntDesign name="plus" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
            
            {profileData.certifications?.length > 0 ? (
              <FlatList
                data={profileData.certifications}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View style={styles.certItem}>
                    <MaterialCommunityIcons name="certificate" size={20} color={colors.accent} />
                    <Text style={[styles.certText, { color: colors.text }]}>{item.name}</Text>
                    {isEditing && (
                      <TouchableOpacity 
                        onPress={() => removeCertification(item._id)}
                        style={styles.deleteCert}
                      >
                        <AntDesign name="close" size={16} color={colors.error} />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                keyExtractor={(item) => item._id}
              />
            ) : (
              <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
                No certifications added yet
              </Text>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {isEditing ? (
              <>
                <TouchableOpacity 
                  style={[styles.button, { backgroundColor: colors.success }]}
                  onPress={updateProfile}
                  disabled={isLoading}
                >
                  <MaterialIcons name="save" size={20} color="white" />
                  <Text style={styles.buttonText}>Save Changes</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.button, { backgroundColor: colors.error }]}
                  onPress={() => setIsEditing(false)}
                >
                  <AntDesign name="close" size={20} color="white" />
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: colors.primary }]}
                onPress={() => setIsEditing(true)}
              >
                <MaterialIcons name="edit" size={20} color="white" />
                <Text style={styles.buttonText}>Edit Profile</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: colors.card }]}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color={colors.error} />
              <Text style={[styles.buttonText, { color: colors.error }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Add Certification Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Certification</Text>
              
              <TextInput
                style={[styles.modalInput, { 
                  color: colors.text,
                  borderColor: colors.divider,
                  backgroundColor: colors.card
                }]}
                value={newCertification}
                onChangeText={setNewCertification}
                placeholder="Certification Name"
                placeholderTextColor={colors.secondaryText}
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: colors.error }]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: colors.success }]}
                  onPress={addCertification}
                >
                  <Text style={styles.buttonText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
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
  coverPhoto: {
    width: '100%',
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverEditButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    padding: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileInfo: {
    marginLeft: 20,
    flex: 1,
    marginBottom: 10,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  nameInput: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    paddingVertical: 5,
  },
  userEmail: {
    fontSize: 14,
    opacity: 0.8,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    marginBottom: 15,
  },
  tabButton: {
    alignItems: 'center',
    padding: 5,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 5,
  },
  scrollContainer: {
    flex: 1,
  },
  gymNameContainer: {
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  gymName: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  gymNameInput: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    width: '100%',
    paddingVertical: 5,
  },
  section: {
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButton: {
    padding: 5,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  detailText: {
    fontSize: 16,
    marginLeft: 15,
    flex: 1,
  },
  editInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    paddingVertical: 5,
  },
  actionIcon: {
    padding: 5,
    marginLeft: 10,
  },
  certItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  certText: {
    fontSize: 16,
    marginLeft: 15,
    flex: 1,
  },
  deleteCert: {
    padding: 5,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 10,
    fontStyle: 'italic',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    fontSize: 16,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
});