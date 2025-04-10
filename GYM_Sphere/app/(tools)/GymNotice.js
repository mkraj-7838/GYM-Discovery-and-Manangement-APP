import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Alert, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Animated,
  Easing,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as MailComposer from 'expo-mail-composer';
import * as Print from 'expo-print';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000/api";

// Enhanced Dark Theme Colors
const themeColors = {
  background: '#0F0F0F',
  surface: '#1A1A1A',
  surfaceLight: '#252525',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  primary: '#BB86FC',
  primaryVariant: '#3700B3',
  secondary: '#03DAC6',
  error: '#CF6679',
  success: '#4CAF50',
  warning: '#FFC107',
  info: '#2196F3',
  divider: '#383838'
};

const templates = {
  none: { 
    subject: '', 
    message: '',
    icon: 'file-document-outline'
  },
  openingHours: {
    subject: 'Updated Gym Opening Hours',
    message: 'Dear Members,\n\nWe would like to inform you about our updated opening hours:\n\nMonday-Friday: 6:00 AM - 10:00 PM\nSaturday-Sunday: 7:00 AM - 8:00 PM\n\nThank you for your understanding.\n\nBest regards,\nGym Management',
    icon: 'clock-outline'
  },
  gymClosed: {
    subject: 'Temporary Gym Closure Notice',
    message: 'Dear Members,\n\nWe regret to inform you that the gym will be temporarily closed from [start date] to [end date] due to [reason].\n\nAll memberships will be extended accordingly to compensate for the closure period.\n\nWe apologize for any inconvenience caused and appreciate your understanding.\n\nBest regards,\nGym Management',
    icon: 'alert-circle-outline'
  },
  festivalGreeting: {
    subject: 'Festival Greetings',
    message: 'Dear Members,\n\nWarm greetings on the occasion of [Festival Name]!\n\nMay this festival bring joy, health, and prosperity to you and your family.\n\nPlease note our special holiday timings: [timings if any]\n\nHappy [Festival Name]!\n\nBest regards,\nGym Management',
    icon: 'party-popper'
  },
  priceUpdate: {
    subject: 'Membership Price Update Notification',
    message: 'Dear Members,\n\nWe would like to inform you about an upcoming adjustment to our membership prices effective from [date].\n\nThe new pricing structure will be as follows:\n\n- Monthly Membership: $XX\n- Quarterly Membership: $XX\n- Annual Membership: $XX\n\nCurrent members will continue at their existing rates until their next renewal.\n\nThank you for your continued support.\n\nBest regards,\nGym Management',
    icon: 'cash-multiple'
  },
  maintenance: {
    subject: 'Scheduled Maintenance Notice',
    message: 'Dear Members,\n\nThis is to inform you that we will be conducting scheduled maintenance on [date] from [time] to [time].\n\nDuring this period, the following facilities will be unavailable:\n- [List facilities]\n\nWe apologize for any inconvenience and appreciate your understanding as we work to improve our facilities.\n\nBest regards,\nGym Management',
    icon: 'toolbox-outline'
  }
};

export default function AnnouncementScreen() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState('none');
  const [members, setMembers] = useState({ all: [], trial: [], active: [], inactive: [] });
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(20)).current;
  
  const navigation = useNavigation();

  useEffect(() => {
    // Animation on mount
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    async function checkAvailability() {
      const isMailAvailable = await MailComposer.isAvailableAsync();
      setIsAvailable(isMailAvailable);
    }
    checkAvailability();
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      setRefreshing(true);
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
      
      // Categorize members by status
      const categorizedMembers = {
        all: data.map(member => member.email).filter(email => email),
        trial: data.filter(member => member.status === 'trial').map(member => member.email).filter(email => email),
        active: data.filter(member => member.status === 'active').map(member => member.email).filter(email => email),
        inactive: data.filter(member => member.status === 'inactive').map(member => member.email).filter(email => email),
      };
      
      setMembers(categorizedMembers);
    } catch (err) {
      console.error("Error fetching members:", err);
      Alert.alert("Error", err.message || "Failed to load members");
      setMembers({ all: [], trial: [], active: [], inactive: [] });
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Handle template selection
  useEffect(() => {
    if (selectedTemplate !== 'none') {
      setSubject(templates[selectedTemplate].subject);
      setMessage(templates[selectedTemplate].message);
      Haptics.selectionAsync();
    }
  }, [selectedTemplate]);

  const sendMail = async () => {
    if (!subject || !message) {
      Alert.alert('Error', 'Subject and message cannot be empty');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (members[selectedGroup].length === 0) {
      Alert.alert('Error', `No ${selectedGroup} members found to send announcement`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      setIsSending(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      const { uri } = await Print.printToFileAsync({
        html: `
          <div style="background-color: ${themeColors.background}; color: ${themeColors.text}; padding: 30px; font-family: Arial, sans-serif;">
            <h1 style="color: ${themeColors.primary}; border-bottom: 2px solid ${themeColors.primary}; padding-bottom: 10px;">
              ${subject}
            </h1>
            <p style="color: ${themeColors.textSecondary}; line-height: 1.6; white-space: pre-line;">
              ${message}
            </p>
            <div style="margin-top: 30px; color: ${themeColors.textSecondary}; font-size: 12px;">
              <p>Best regards,</p>
              <p>Gym Management Team</p>
            </div>
          </div>
        `
      });

      await MailComposer.composeAsync({
        subject,
        body: message,
        recipients: members[selectedGroup],
        attachments: [uri],
        isHtml: false
      });
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to send announcement. Please try again.');
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  const clearForm = () => {
    setSubject('');
    setMessage('');
    setSelectedTemplate('none');
    Haptics.selectionAsync();
  };

  const getGroupColor = () => {
    switch(selectedGroup) {
      case 'trial': return themeColors.info;
      case 'active': return themeColors.success;
      case 'inactive': return themeColors.warning;
      default: return themeColors.primary;
    }
  };

  const getMemberCount = (group) => {
    return members[group]?.length || 0;
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={fetchMembers}
              tintColor={themeColors.primary}
              colors={[themeColors.primary]}
            />
          }
        >
          <StatusBar style="light" />
          
          {/* Header */}
          <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={28} color={themeColors.primary} />
            </TouchableOpacity>
            <Animated.View style={[styles.headerContent, { transform: [{ translateY: slideUpAnim }] }]}>
              <MaterialCommunityIcons 
                name="bullhorn" 
                size={36} 
                color={themeColors.primary} 
              />
              <Text style={[styles.title, { color: themeColors.text }]}>Send Announcement</Text>
              <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
                Communicate with your members
              </Text>
            </Animated.View>
          </Animated.View>

          {/* Template Picker Card */}
          <Animated.View 
            style={[
              styles.card, 
              { 
                backgroundColor: themeColors.surface,
                opacity: fadeAnim,
                transform: [{ translateY: slideUpAnim }]
              }
            ]}
          >
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons 
                name={templates[selectedTemplate].icon} 
                size={24} 
                color={themeColors.primary} 
              />
              <Text style={[styles.cardTitle, { color: themeColors.text }]}>Message Template</Text>
            </View>
            
            <View style={[styles.pickerContainer, { borderColor: themeColors.divider }]}>
              <Picker
                selectedValue={selectedTemplate}
                onValueChange={setSelectedTemplate}
                style={[styles.picker, { color: themeColors.text }]}
                dropdownIconColor={themeColors.primary}
              >
                {Object.entries(templates).map(([key, template]) => (
                  <Picker.Item 
                    key={key}
                    label={key === 'none' ? 'Custom Message' : template.subject}
                    value={key} 
                  />
                ))}
              </Picker>
            </View>
          </Animated.View>

          {/* Subject Input Card */}
          <Animated.View 
            style={[
              styles.card, 
              { 
                backgroundColor: themeColors.surface,
                opacity: fadeAnim,
                transform: [{ translateY: slideUpAnim }]
              }
            ]}
          >
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons 
                name="format-title" 
                size={24} 
                color={themeColors.primary} 
              />
              <Text style={[styles.cardTitle, { color: themeColors.text }]}>Subject</Text>
            </View>
            
            <TextInput
              style={[styles.input, { 
                backgroundColor: themeColors.surfaceLight,
                color: themeColors.text,
                borderColor: themeColors.divider
              }]}
              placeholder='Enter announcement subject'
              placeholderTextColor={themeColors.textSecondary}
              value={subject}
              onChangeText={setSubject}
            />
          </Animated.View>

          {/* Message Input Card */}
          <Animated.View 
            style={[
              styles.card, 
              { 
                backgroundColor: themeColors.surface,
                opacity: fadeAnim,
                transform: [{ translateY: slideUpAnim }]
              }
            ]}
          >
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons 
                name="message-text-outline" 
                size={24} 
                color={themeColors.primary} 
              />
              <Text style={[styles.cardTitle, { color: themeColors.text }]}>Message</Text>
            </View>
            
            <TextInput
              style={[styles.input, styles.messageInput, { 
                backgroundColor: themeColors.surfaceLight,
                color: themeColors.text,
                borderColor: themeColors.divider
              }]}
              placeholder='Type your announcement message here...'
              placeholderTextColor={themeColors.textSecondary}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
          </Animated.View>

          {/* Recipient Group Card */}
          <Animated.View 
            style={[
              styles.card, 
              { 
                backgroundColor: themeColors.surface,
                opacity: fadeAnim,
                transform: [{ translateY: slideUpAnim }]
              }
            ]}
          >
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons 
                name="account-group-outline" 
                size={24} 
                color={themeColors.primary} 
              />
              <Text style={[styles.cardTitle, { color: themeColors.text }]}>Recipient Group</Text>
              <View style={[styles.memberCountBadge, { backgroundColor: getGroupColor() }]}>
                <Text style={styles.memberCountText}>{getMemberCount(selectedGroup)}</Text>
              </View>
            </View>
            
            <View style={[styles.pickerContainer, { borderColor: themeColors.divider }]}>
              <Picker
                selectedValue={selectedGroup}
                onValueChange={setSelectedGroup}
                style={[styles.picker, { color: themeColors.text }]}
                dropdownIconColor={themeColors.primary}
              >
                <Picker.Item label={`All Members (${getMemberCount('all')})`} value='all' />
                <Picker.Item label={`Trial Members (${getMemberCount('trial')})`} value='trial' />
                <Picker.Item label={`Active Members (${getMemberCount('active')})`} value='active' />
                <Picker.Item label={`Inactive Members (${getMemberCount('inactive')})`} value='inactive' />
              </Picker>
            </View>

            <View style={styles.groupStats}>
              <View style={styles.statItem}>
                <FontAwesome name="circle" size={10} color={themeColors.success} />
                <Text style={[styles.statText, { color: themeColors.textSecondary }]}>
                  Active: {getMemberCount('active')}
                </Text>
              </View>
              <View style={styles.statItem}>
                <FontAwesome name="circle" size={10} color={themeColors.warning} />
                <Text style={[styles.statText, { color: themeColors.textSecondary }]}>
                  Inactive: {getMemberCount('inactive')}
                </Text>
              </View>
              <View style={styles.statItem}>
                <FontAwesome name="circle" size={10} color={themeColors.info} />
                <Text style={[styles.statText, { color: themeColors.textSecondary }]}>
                  Trial: {getMemberCount('trial')}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View 
            style={[
              styles.buttonGroup,
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideUpAnim }]
              }
            ]}
          >
            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton, { backgroundColor: themeColors.surfaceLight }]} 
              onPress={clearForm}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons 
                name="trash-can-outline" 
                size={20} 
                color={themeColors.error} 
              />
              <Text style={[styles.buttonText, { color: themeColors.text }]}> Clear Form</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton, { backgroundColor: themeColors.primary }]} 
              onPress={sendMail}
              disabled={isSending || getMemberCount(selectedGroup) === 0}
              activeOpacity={0.7}
            >
              {isSending ? (
                <ActivityIndicator size="small" color={themeColors.background} />
              ) : (
                <>
                  <MaterialCommunityIcons 
                    name="send-outline" 
                    size={20} 
                    color={themeColors.background} 
                  />
                  <Text style={[styles.buttonText, { color: themeColors.background }]}> 
                    Send Announcement
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  memberCountBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  memberCountText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  messageInput: {
    minHeight: 150,
    textAlignVertical: 'top',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  primaryButton: {
    marginLeft: 8,
  },
  secondaryButton: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  groupStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#383838',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    marginLeft: 4,
  },
});