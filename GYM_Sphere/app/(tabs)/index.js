import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  FlatList,
  Linking,
  Alert,
  Modal,
  Animated,
  TouchableWithoutFeedback,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useRouter } from "expo-router";
import moment from "moment";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000/api";

const WelcomePage = () => {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [gymStats, setGymStats] = useState({
    activeMembers: 0,
    trainers: 0,
    attendanceRate: "0%",
    batchStats: { morning: 0, evening: 0 },
    planStats: { basic: 0, premium: 0, vip: 0 },
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [notificationsModalVisible, setNotificationsModalVisible] =
    useState(false);

  const [scaleValue] = useState(new Animated.Value(1));
  const [textColor, setTextColor] = useState("#BB86FC");

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 1.1,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };
  // Sample gym image
  const gymImage = require("./assets/gym1.png");

  // Navigation options with proper routes
  const navItems = [
    {
      id: 1,
      title: "Add Member",
      icon: "person-add",
      screen: "all-members",
      color: "#4CAF50",
    },
    {
      id: 3,
      title: "All Members",
      icon: "people",
      screen: "all-members",
      color: "#FF9800",
    },
    {
      id: 4,
      title: "Tools",
      icon: "fitness-center",
      screen: "tools",
      color: "#E91E63",
    },
    {
      id: 6,
      title: "profile",
      icon: "person",
      screen: "profile",
      color: "#607D8B",
    },
  ];

  // Random fitness news topics for variety
  const newsTopics = [
    "fitness+workout",
    "gym+exercise",
    "health+nutrition",
    "bodybuilding+diet",
    "yoga+meditation",
    "cardio+training",
    "strength+training",
    "weight+loss+tips",
    "muscle+gain+food",
    "running+marathon",
    "cycling+endurance",
    "swimming+technique",
    "pilates+benefits",
    "crossfit+workouts",
    "HIIT+training",
    "functional+fitness",
    "sports+nutrition",
    "recovery+exercise",
    "mental+fitness",
    "home+workouts",
    "outdoor+fitness",
    "dance+fitness",
    "flexibility+training",
    "resistance+bands",
    "kettlebell+training",
    "calisthenics+routine",
    "protein+supplements",
    "vitamin+intake+fitness",
    "sleep+exercise+performance",
    "hydration+workout",
    "fitness+technology",
    "wearable+fitness+trackers",
    "fitness+trends",
    "beginner+fitness+tips",
    "advanced+fitness+techniques",
    "injury+prevention+exercise",
    "post-workout+recovery",
    "fitness+motivation",
    "sustainable+fitness",
    "eco+friendly+exercise",
    "vegan+fitness+diet",
    "vegetarian+exercise+plan",
    "mindful+movement",
    "active+recovery",
    "core+strength+training",
    "balance+training",
    "agility+drills",
    "plyometrics+training",
    "mobility+exercises",
    "joint+health+fitness",
    "senior+fitness",
    "prenatal+fitness",
    "postpartum+exercise",
    "children+fitness",
    "family+fitness",
    "fitness+challenges",
    "fitness+retreats",
    "fitness+events",
    "fitness+community",
    "fitness+apps",
    "online+fitness+classes",
    "personal+training+tips",
    "group+fitness+classes",
    "equipment+free+workouts",
    "quick+workouts",
    "long+duration+workouts",
    "fitness+gear+reviews",
    "fitness+science",
    "exercise+physiology",
    "biomechanics+fitness",
    "fitness+psychology",
    "motivational+fitness+quotes",
    "fitness+success+stories",
    "fitness+influencers",
    "fitness+podcasts",
    "fitness+documentaries",
    "fitness+cooking+recipes",
    "meal+prep+fitness",
    "nutritional+supplements",
    "detox+fitness",
    "intermittent+fasting+exercise",
    "ketogenic+diet+fitness",
    "paleo+diet+workouts",
    "gut+health+fitness",
    "hormone+balance+exercise",
    "stress+management+fitness",
    "time+management+exercise",
    "travel+fitness",
    "office+fitness",
    "desk+exercises",
    "fitness+for+mental+clarity",
    "fitness+for+productivity",
    "fitness+and+creativity",
    "fitness+and+social+connection",
  ];

  // Fetch profile data with proper authentication
  const fetchProfile = async () => {
    const token = await AsyncStorage.getItem("token");
    try {
      const response = await axios.get(`${API_BASE_URL}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfileData(response.data);
    } catch (error) {
      Alert.alert("Error", "Failed to load profile data");
      console.error("Profile fetch error:", error);
    }
  };

  // Fetch random fitness news
  const fetchNews = async () => {
    try {
      const randomTopic =
        newsTopics[Math.floor(Math.random() * newsTopics.length)];
      const newsRes = await axios.get(
        `https://newsapi.org/v2/everything?q=${randomTopic}&sortBy=popularity&apiKey=37467f0d227949bc8c3264afa39f875c`
      );
      setNews(newsRes.data.articles?.slice(0, 10) || []);
    } catch (error) {
      console.error("News fetch error:", error);
      // Fallback news
      setNews([
        {
          title: "Importance of Hydration During Workouts",
          description:
            "Learn how proper hydration can improve your performance and recovery.",
          urlToImage: "https://via.placeholder.com/150",
        },
        {
          title: "New Yoga Classes Starting Next Week",
          description:
            "Join our new yoga sessions designed for all fitness levels.",
          urlToImage: "https://via.placeholder.com/150",
        },
      ]);
    }
  };

  // Fetch gym statistics
  const fetchGymStats = async () => {
    const token = await AsyncStorage.getItem("token");
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const [membersRes, attendanceRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/user/members`, { headers }),
        axios.get(`${API_BASE_URL}/attendance/all`, { headers }),
      ]);

      const members = membersRes.data;
      const attendance = attendanceRes.data;

      // Calculate statistics
      const activeMembers = members.filter((m) => m.status === "active").length;
      const trainers = members.filter((m) => m.role === "trainer").length;

      // Calculate attendance rate (simplified)
      const today = moment().format("YYYY-MM-DD");
      const todayAttendance = attendance.filter(
        (a) => moment(a.date).format("YYYY-MM-DD") === today
      ).length;
      const attendanceRate =
        activeMembers > 0
          ? `${Math.round((todayAttendance / activeMembers) * 100)}%`
          : "0%";

      const batchStats = {
        morning: members.filter((m) => m.batch === "morning").length,
        evening: members.filter((m) => m.batch === "evening").length,
      };

      const planStats = {
        basic: members.filter((m) => m.membershipPlan === "basic").length,
        premium: members.filter((m) => m.membershipPlan === "premium").length,
        vip: members.filter((m) => m.membershipPlan === "vip").length,
      };

      setGymStats({
        activeMembers,
        trainers,
        attendanceRate,
        batchStats,
        planStats,
      });

      // Generate recent activities
      const activities = [];
      if (members.length > 0) {
        const recentMembers = members
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 3);

        recentMembers.forEach((member) => {
          activities.push({
            id: `member-${member._id}`,
            text: `New member ${member.name} joined`,
            icon: "person-add",
            date: moment(member.createdAt).fromNow(),
          });
        });
      }

      // Add some sample activities (in a real app, these would come from your backend)
      activities.push(
        {
          id: "payment-1",
          text: "Monthly membership fee updated",
          icon: "payment",
          date: "2 days ago",
        },
        {
          id: "equipment-1",
          text: "New treadmill added to equipment",
          icon: "fitness-center",
          date: "1 week ago",
        }
      );

      setRecentActivities(activities);
    } catch (error) {
      console.error("Stats fetch error:", error);
      Alert.alert("Error", "Failed to load gym statistics");
    }
  };

  // Fetch all data
  const fetchData = async () => {
    try {
      setRefreshing(true);
      setLoading(true);
      await Promise.all([fetchProfile(), fetchNews(), fetchGymStats()]);
    } catch (error) {
      console.error("Data fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(() => {
    fetchData();
  }, []);

  const renderNewsItem = ({ item }) => (
    <TouchableOpacity
      style={styles.newsCard}
      onPress={() => item.url && Linking.openURL(item.url)}
    >
      <Image
        source={{ uri: item.urlToImage || "https://via.placeholder.com/150" }}
        style={styles.newsImage}
      />
      <View style={styles.newsContent}>
        <Text style={styles.newsTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.newsDesc} numberOfLines={3}>
          {item.description || "No description available"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderNavItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.navItem, { backgroundColor: item.color }]}
      onPress={() => router.push(`/(tabs)/${item.screen}`)}
    >
      <MaterialIcons name={item.icon} size={28} color="white" />
      <Text style={styles.navText}>{item.title}</Text>
    </TouchableOpacity>
  );

  const renderActivityItem = ({ item }) => (
    <View style={styles.activityItem}>
      <MaterialIcons name={item.icon} size={20} color="#BB86FC" />
      <View style={styles.activityContent}>
        <Text style={styles.activityText}>{item.text}</Text>
        <Text style={styles.activityDate}>{item.date}</Text>
      </View>
    </View>
  );

  const NotificationsModal = () => (
    <Modal
      animationType="slide"
      transparent={false}
      visible={notificationsModalVisible}
      onRequestClose={() => setNotificationsModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Notifications</Text>
          <TouchableOpacity onPress={() => setNotificationsModalVisible(false)}>
            <MaterialIcons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalScrollView}>
          {/* Recent Activities */}
          <View style={styles.modalSection}>
            <Text style={styles.modalSectionTitle}>Recent Activities</Text>
            {recentActivities.length > 0 ? (
              <FlatList
                data={recentActivities}
                renderItem={renderActivityItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            ) : (
              <Text style={styles.noItemsText}>No recent activities</Text>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  if (loading && !profileData) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (!profileData) {
    return (
      <View style={styles.setupContainer}>
        <Text style={styles.setupTitle}>Welcome to GYM Management</Text>
        <Text style={styles.setupText}>
          Please set up your profile to continue
        </Text>
        <TouchableOpacity
          style={styles.setupButton}
          onPress={() => router.push("/(tabs)/settings")}
        >
          <Text style={styles.setupButtonText}>Complete Profile Setup</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#fff"
        />
      }
    >
      {/* Header with profile info */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>
            Welcome, {profileData.name || "Admin"}
          </Text>
          <TouchableWithoutFeedback
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onLongPress={() => {
              setTextColor((prev) =>
                prev === "#BB86FC" ? "#FF0266" : "#BB86FC"
              );
            }}
          >
            <Animated.Text
              style={[
                styles.headerSubtitle,
                {
                  transform: [{ scale: scaleValue }],
                  color: textColor,
                },
              ]}
            >
              {profileData.gymName || "Your Gym"}
            </Animated.Text>
          </TouchableWithoutFeedback>
        </View>
        <TouchableOpacity onPress={() => setNotificationsModalVisible(true)}>
          <Ionicons name="notifications-outline" size={24} color="#fff" />
          {recentActivities.length > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {recentActivities.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Gym Image */}
      <View style={styles.gymImageContainer}>
        <Image source={gymImage} style={styles.gymImage} />
        <View style={styles.gymInfoOverlay}>
          <Text style={styles.gymInfoText}>
            {profileData.address || "Add your gym address"}
          </Text>
          <Text style={styles.gymInfoText}>
            {profileData.phone || "Add contact information"}
          </Text>
        </View>
      </View>

      {/* Quick Navigation Grid */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <FlatList
        data={navItems}
        renderItem={renderNavItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.navContainer}
        scrollEnabled={false}
      />

      {/* Fitness News */}
      <Text style={styles.sectionTitle}>Fitness News</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" style={styles.loader} />
      ) : (
        <FlatList
          data={news}
          renderItem={renderNewsItem}
          keyExtractor={(item, index) => index.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.newsContainer}
        />
      )}

      {/* Recent Activities */}
      <Text style={styles.sectionTitle}>Recent Activities</Text>
      <View style={styles.activitiesContainer}>
        <FlatList
          data={recentActivities.slice(0, 3)}
          renderItem={renderActivityItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
        <TouchableOpacity
          style={styles.seeAllButton}
          onPress={() => router.push("/(tabs)/notifications")}
        >
          <Text style={styles.seeAllText}>See All Activities</Text>
        </TouchableOpacity>
      </View>

      {/* Gym Statistics */}
      <Text style={styles.sectionTitle}>Gym Statistics</Text>
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <FontAwesome5 name="users" size={20} color="#4CAF50" />
          <Text style={styles.statValue}>{gymStats.activeMembers}</Text>
          <Text style={styles.statLabel}>Active Members</Text>
        </View>

        <View style={styles.statItem}>
          <FontAwesome5 name="calendar-check" size={20} color="#E91E63" />
          <Text style={styles.statValue}>{gymStats.attendanceRate}</Text>
          <Text style={styles.statLabel}>Today's Attendance</Text>
        </View>
      </View>

      {/* Additional Stats */}
      <View style={styles.additionalStatsContainer}>
        <View style={styles.additionalStatItem}>
          <Text style={styles.additionalStatLabel}>Morning Batch</Text>
          <Text style={styles.additionalStatValue}>
            {gymStats.batchStats.morning}
          </Text>
        </View>
        <View style={styles.additionalStatItem}>
          <Text style={styles.additionalStatLabel}>Evening Batch</Text>
          <Text style={styles.additionalStatValue}>
            {gymStats.batchStats.evening}
          </Text>
        </View>
        <View style={styles.additionalStatItem}>
          <Text style={styles.additionalStatLabel}>Basic Plan</Text>
          <Text style={styles.additionalStatValue}>
            {gymStats.planStats.basic}
          </Text>
        </View>
        <View style={styles.additionalStatItem}>
          <Text style={styles.additionalStatLabel}>Premium Plan</Text>
          <Text style={styles.additionalStatValue}>
            {gymStats.planStats.premium}
          </Text>
        </View>
      </View>

      {/* Profile Information */}
      <Text style={styles.sectionTitle}>Profile Information</Text>
      <View style={styles.profileInfoCard}>
        <View style={styles.profileInfoRow}>
          <MaterialIcons name="email" size={20} color="#BB86FC" />
          <Text style={styles.profileInfoText}>
            {profileData.email || "No email provided"}
          </Text>
        </View>
        <View style={styles.profileInfoRow}>
          <MaterialIcons name="phone" size={20} color="#BB86FC" />
          <Text style={styles.profileInfoText}>
            {profileData.phone || "No phone number provided"}
          </Text>
        </View>
        <View style={styles.profileInfoRow}>
          <MaterialIcons name="date-range" size={20} color="#BB86FC" />
          <Text style={styles.profileInfoText}>
            Member since: {new Date(profileData.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <NotificationsModal />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  setupContainer: {
    flex: 1,
    backgroundColor: "#121212",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  setupTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  setupText: {
    color: "#aaa",
    fontSize: 16,
    marginBottom: 30,
    textAlign: "center",
  },
  setupButton: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
  },
  setupButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  headerSubtitle: {
    fontSize: 48,
    fontWeight: "800",
    marginTop: 4,
    textShadowColor: "rgba(187, 134, 252, 0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  notificationBadge: {
    position: "absolute",
    right: -6,
    top: -6,
    backgroundColor: "#E91E63",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  gymImageContainer: {
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    elevation: 3,
    marginBottom: 20,
  },
  gymImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  gymInfoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 12,
  },
  gymInfoText: {
    color: "#fff",
    fontSize: 14,
    marginVertical: 2,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    marginTop: 8,
  },
  navContainer: {
    paddingHorizontal: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#121212",
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingTop: 40,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  modalSectionTitle: {
    color: "#BB86FC",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  noItemsText: {
    color: "#aaa",
    fontSize: 14,
    textAlign: "center",
    marginVertical: 10,
  },
  navItem: {
    flex: 1,
    margin: 8,
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minWidth: "40%",
    elevation: 2,
  },
  navText: {
    color: "#fff",
    marginTop: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  newsContainer: {
    paddingRight: 16,
  },
  newsCard: {
    width: 280,
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    marginRight: 16,
    overflow: "hidden",
    elevation: 2,
  },
  newsImage: {
    width: "100%",
    height: 150,
    backgroundColor: "#333",
  },
  newsContent: {
    padding: 12,
  },
  newsTitle: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 8,
  },
  newsDesc: {
    color: "#aaa",
    fontSize: 14,
    lineHeight: 20,
  },
  loader: {
    marginVertical: 30,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  statItem: {
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 6,
    elevation: 2,
  },
  statValue: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 8,
  },
  statLabel: {
    color: "#aaa",
    fontSize: 12,
    textAlign: "center",
  },
  additionalStatsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  additionalStatItem: {
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 12,
    width: "48%",
    marginBottom: 10,
    elevation: 2,
  },
  additionalStatLabel: {
    color: "#aaa",
    fontSize: 12,
    marginBottom: 5,
  },
  additionalStatValue: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  activitiesContainer: {
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  activityContent: {
    marginLeft: 12,
    flex: 1,
  },
  activityText: {
    color: "#fff",
    fontSize: 14,
  },
  activityDate: {
    color: "#aaa",
    fontSize: 12,
    marginTop: 2,
  },
  seeAllButton: {
    alignSelf: "flex-end",
    marginTop: 10,
  },
  seeAllText: {
    color: "#BB86FC",
    fontSize: 14,
  },
  profileInfoCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
  },
  profileInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  profileInfoText: {
    color: "#fff",
    marginLeft: 12,
    fontSize: 14,
  },
});

export default WelcomePage;
