import { Tabs } from "expo-router";
import { 
  FontAwesome, 
  Ionicons, 
  MaterialCommunityIcons,
  MaterialIcons 
} from "@expo/vector-icons";
import { StyleSheet } from "react-native";

export default function RootLayout() {
  // Enhanced dark theme color palette
  const colors = {
    background: "#121212", // Dark background
    primary: "#1E88E5", // Vibrant blue for active tab
    secondary: "#FFFFFF", // White for text
    accent: "#4CAF50", // Green accent
    text: "#E0E0E0", // Light gray text
    tabBarBackground: "#1E1E1E", // Dark tab bar
    border: "#333333", // Border color
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text + 'AA', // Slightly transparent
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          height: 70, // Optimal height for mobile navigation
          borderTopWidth: 0,
          borderTopColor: colors.border,
          paddingBottom: 4, // Add small padding at bottom
        },
        tabBarItemStyle: {
          paddingVertical: 6, // Vertical padding for each tab
        },
        tabBarLabelStyle: {
          fontSize: 12, // Proper label size
          fontWeight: '500', // Medium weight for better readability
          marginBottom: 0, // Space between icon and label
        },
        headerStyle: {
          backgroundColor: colors.background,
          shadowColor: 'transparent', // Remove shadow
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 22,
        },
      }}
    >
      {/* Dashboard Tab */}
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          title: "Dashboard",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              size={24} 
              name={focused ? "home" : "home-outline"} 
              color={color} 
            />
          ),
        }}
      />

      {/* Members Tab */}
      <Tabs.Screen
        name="all-members"
        options={{
          headerShown: false,
          title: "Members",
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons 
              size={24} 
              name={focused ? "account-group" : "account-group-outline"} 
              color={color} 
            />
          ),
        }}
      />

      {/* Analytics Tab */}
      <Tabs.Screen
        name="settings"
        options={{
          headerShown: false,
          title: "Tools",
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons 
              size={24} 
              name={focused ? "analytics" : "insights"} 
              color={color} 
            />
          ),
        }}
      />

      {/* Profile Tab */}
      <Tabs.Screen
        name="profile"
        options={{
          headerShown: false,
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              size={24} 
              name={focused ? "person" : "person-outline"} 
              color={color} 
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  // Additional styles if needed
});