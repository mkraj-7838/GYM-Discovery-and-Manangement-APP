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
  ratingHigh: "#4CAF50",
  ratingMedium: "#FFC107",
  ratingLow: "#F44336",
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
  });
  const [feedbackData, setFeedbackData] = useState([]);
  const [averageRatings, setAverageRatings] = useState({
    overall: 0,
    cleanliness: 0,
    equipment: 0,
    staff: 0,
    availability: 0,
    ambiance: 0,
    recommendation: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Load profile and feedback data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const token = await AsyncStorage.getItem("token");
        
        const [profileRes, feedbackRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/user/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_BASE_URL}/feedback`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        
        setProfileData(profileRes.data);
        setFeedbackData(feedbackRes.data.data || []);
        
        // Calculate average ratings
        if (feedbackRes.data.data?.length > 0) {
          calculateAverageRatings(feedbackRes.data.data);
        }
      } catch (error) {
        Alert.alert("Error", "Failed to load profile data");
        console.error("Fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate average ratings from feedback
  const calculateAverageRatings = (feedback) => {
    const totals = {
      overall: 0,
      cleanliness: 0,
      equipment: 0,
      staff: 0,
      availability: 0,
      ambiance: 0,
      recommendation: { yes: 0, no: 0, maybe: 0 }
    };

    feedback.forEach(item => {
      totals.overall += item.ratings.overall;
      totals.cleanliness += item.ratings.cleanliness;
      totals.equipment += item.ratings.equipment;
      totals.staff += item.ratings.staff;
      totals.availability += item.ratings.availability;
      totals.ambiance += item.ratings.ambiance;
      
      if (item.recommendation === 'yes') totals.recommendation.yes++;
      else if (item.recommendation === 'no') totals.recommendation.no++;
      else totals.recommendation.maybe++;
    });

    const count = feedback.length;
    setAverageRatings({
      overall: totals.overall / count,
      cleanliness: totals.cleanliness / count,
      equipment: totals.equipment / count,
      staff: totals.staff / count,
      availability: totals.availability / count,
      ambiance: totals.ambiance / count,
      recommendation: (totals.recommendation.yes / count) * 100
    });
  };

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

  // Handle logout
  const handleLogout = () => {
    dispatch(logoutAction());
    router.replace("/auth/login");
  };

  // Render star ratings
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<AntDesign key={i} name="star" size={16} color={colors.ratingHigh} />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<AntDesign key={i} name="star" size={16} color={colors.ratingMedium} />);
      } else {
        stars.push(<AntDesign key={i} name="staro" size={16} color={colors.secondaryText} />);
      }
    }
    
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {stars}
        <Text style={{ color: colors.text, marginLeft: 5 }}>{rating.toFixed(1)}</Text>
      </View>
    );
  };

  // Render rating bar
  const renderRatingBar = (label, value, iconName, iconType = 'MaterialIcons') => {
    const IconComponent = iconType === 'MaterialIcons' ? MaterialIcons : 
                         iconType === 'FontAwesome' ? FontAwesome : 
                         iconType === 'Ionicons' ? Ionicons : MaterialIcons;
    
    let color = colors.ratingHigh;
    if (value < 3) color = colors.ratingLow;
    else if (value < 4) color = colors.ratingMedium;
    
    return (
      <View style={styles.ratingItem}>
        <View style={styles.ratingLabel}>
          <IconComponent name={iconName} size={20} color={colors.primary} />
          <Text style={[styles.ratingText, { color: colors.text }]}>{label}</Text>
        </View>
        {renderStars(value)}
      </View>
    );
  };

  // Render feedback item
  const renderFeedbackItem = ({ item }) => (
    <View style={styles.feedbackItem}>
      <View style={styles.feedbackHeader}>
        <Text style={[styles.feedbackMember, { color: colors.text }]}>
          {item.member?.name || 'Anonymous'}
        </Text>
        <Text style={{ color: colors.secondaryText }}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      
      <View style={styles.feedbackRating}>
        <Text style={{ color: colors.text }}>Overall: </Text>
        {renderStars(item.ratings.overall)}
      </View>
      
      <Text style={[styles.feedbackComment, { color: colors.text }]}>
        {item.feedback.comments || 'No comments provided'}
      </Text>
      
      <View style={styles.feedbackRecommendation}>
        <MaterialIcons 
          name={item.recommendation === 'yes' ? 'thumb-up' : 'thumb-down'} 
          size={16} 
          color={item.recommendation === 'yes' ? colors.ratingHigh : colors.ratingLow} 
        />
        <Text style={{ 
          color: item.recommendation === 'yes' ? colors.ratingHigh : colors.ratingLow,
          marginLeft: 5
        }}>
          {item.recommendation === 'yes' ? 'Recommends' : 'Does not recommend'}
        </Text>
      </View>
    </View>
  );

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
            style={[styles.tabButton, activeTab === 'overview' && styles.activeTab]}
            onPress={() => setActiveTab('overview')}
          >
            <MaterialIcons 
              name="dashboard" 
              size={24} 
              color={activeTab === 'overview' ? colors.primary : colors.secondaryText} 
            />
            <Text style={[styles.tabText, activeTab === 'overview' && { color: colors.primary }]}>
              Overview
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'feedback' && styles.activeTab]}
            onPress={() => setActiveTab('feedback')}
          >
            <MaterialIcons 
              name="reviews" 
              size={24} 
              color={activeTab === 'feedback' ? colors.primary : colors.secondaryText} 
            />
            <Text style={[styles.tabText, activeTab === 'feedback' && { color: colors.primary }]}>
              Feedback
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'settings' && styles.activeTab]}
            onPress={() => setActiveTab('settings')}
          >
            <Ionicons 
              name="settings-sharp" 
              size={24} 
              color={activeTab === 'settings' ? colors.primary : colors.secondaryText} 
            />
            <Text style={[styles.tabText, activeTab === 'settings' && { color: colors.primary }]}>
              Settings
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

          {/* Overview Tab Content */}
          {activeTab === 'overview' && (
            <>
              {/* Ratings Summary */}
              <View style={[styles.section, { backgroundColor: colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: colors.primary }]}>
                  Gym Ratings Summary
                </Text>
                
                <View style={styles.overallRating}>
                  <Text style={[styles.overallRatingText, { color: colors.text }]}>
                    Overall Rating
                  </Text>
                  <Text style={[styles.overallRatingValue, { color: colors.ratingHigh }]}>
                    {averageRatings.overall.toFixed(1)}
                  </Text>
                  {renderStars(averageRatings.overall)}
                  <Text style={[styles.ratingCount, { color: colors.secondaryText }]}>
                    Based on {feedbackData.length} reviews
                  </Text>
                </View>
                
                {renderRatingBar('Cleanliness', averageRatings.cleanliness, 'cleaning-services')}
                {renderRatingBar('Equipment', averageRatings.equipment, 'fitness-center')}
                {renderRatingBar('Staff', averageRatings.staff, 'people-alt')}
                {renderRatingBar('Availability', averageRatings.availability, 'access-time')}
                {renderRatingBar('Ambiance', averageRatings.ambiance, 'mood')}
                
                <View style={styles.recommendationContainer}>
                  <Text style={[styles.recommendationText, { color: colors.text }]}>
                    Recommendation Rate
                  </Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { 
                      width: `${averageRatings.recommendation}%`,
                      backgroundColor: averageRatings.recommendation > 70 ? colors.ratingHigh : 
                                       averageRatings.recommendation > 40 ? colors.ratingMedium : colors.ratingLow
                    }]} />
                  </View>
                  <Text style={[styles.recommendationValue, { color: colors.text }]}>
                    {averageRatings.recommendation.toFixed(0)}%
                  </Text>
                </View>
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
            </>
          )}
          
          {/* Feedback Tab Content */}
          {activeTab === 'feedback' && (
            <View style={[styles.section, { backgroundColor: colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>
                Member Feedback ({feedbackData.length})
              </Text>
              
              {feedbackData.length > 0 ? (
                <FlatList
                  data={feedbackData}
                  scrollEnabled={false}
                  renderItem={renderFeedbackItem}
                  keyExtractor={(item) => item._id}
                  ItemSeparatorComponent={() => <View style={styles.feedbackSeparator} />}
                />
              ) : (
                <View style={styles.emptyFeedback}>
                  <Ionicons name="sad-outline" size={40} color={colors.secondaryText} />
                  <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
                    No feedback received yet
                  </Text>
                </View>
              )}
            </View>
          )}
          
          {/* Settings Tab Content */}
          {activeTab === 'settings' && (
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
          )}
        </ScrollView>
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
    paddingBottom: 20,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
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
  // Ratings styles
  overallRating: {
    alignItems: 'center',
    marginBottom: 20,
  },
  overallRatingText: {
    fontSize: 16,
    marginBottom: 5,
  },
  overallRatingValue: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  ratingCount: {
    fontSize: 12,
    marginTop: 5,
  },
  ratingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  ratingLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ratingText: {
    fontSize: 16,
    marginLeft: 10,
  },
  recommendationContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  recommendationText: {
    fontSize: 16,
    marginBottom: 5,
  },
  progressBar: {
    height: 10,
    width: '100%',
    backgroundColor: colors.divider,
    borderRadius: 5,
    marginVertical: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  recommendationValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Feedback styles
  feedbackItem: {
    paddingVertical: 15,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  feedbackMember: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  feedbackRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  feedbackComment: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  feedbackRecommendation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedbackSeparator: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 5,
  },
  emptyFeedback: {
    alignItems: 'center',
    paddingVertical: 30,
  },
});