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
  ActivityIndicator
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as MailComposer from 'expo-mail-composer';
import * as Print from 'expo-print';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

// Dark Theme Colors
const darkTheme = {
  background: '#121212',
  surface: '#1E1E1E',
  surfaceLight: '#2D2D2D',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  primary: '#BB86FC',
  primaryVariant: '#3700B3',
  secondary: '#03DAC6',
  error: '#CF6679',
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
  const [recipients, setRecipients] = useState([]);
  const [isSending, setIsSending] = useState(false);
  
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
  }, []);

  // Handle template selection
  useEffect(() => {
    if (selectedTemplate !== 'none') {
      setSubject(templates[selectedTemplate].subject);
      setMessage(templates[selectedTemplate].message);
      Haptics.selectionAsync();
    }
  }, [selectedTemplate]);

  // Mock gym members data
  const members = {
    trial: ['trial1@example.com', 'trial2@example.com'],
    active: ['active1@example.com', 'active2@example.com'],
    inactive: ['inactive1@example.com', 'inactive2@example.com'],
    all: ['trial1@example.com', 'trial2@example.com', 'active1@example.com', 'active2@example.com', 'inactive1@example.com', 'inactive2@example.com'],
  };

  const sendMail = async () => {
    if (!subject || !message) {
      Alert.alert('Error', 'Subject and message cannot be empty');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      setIsSending(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      const { uri } = await Print.printToFileAsync({
        html: `
          <div style="background-color: ${themeColors.background}; color: ${themeColors.text}; padding: 30px; font-family: Arial, sans-serif;">
            <h1 style="color: ${themeColors.accent}; border-bottom: 2px solid ${themeColors.primary}; padding-bottom: 10px;">
              ${subject}
            </h1>
            <p style="color: ${themeColors.secondaryText}; line-height: 1.6; white-space: pre-line;">
              ${message}
            </p>
            <div style="margin-top: 30px; color: ${themeColors.secondaryText}; font-size: 12px;">
              <p>Best regards,</p>
              <p>Gym Management Team</p>
            </div>
          </div>
        `
      });

      setRecipients(members[selectedGroup]);

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

  const getGroupColor = (group) => {
    switch(group) {
      case 'trial': return themeColors.info;
      case 'active': return themeColors.success;
      case 'inactive': return themeColors.warning;
      default: return themeColors.accent;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: darkTheme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <StatusBar style="light" />
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={darkTheme.primary} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <MaterialCommunityIcons 
                name="bullhorn" 
                size={32} 
                color={darkTheme.primary} 
              />
              <Text style={[styles.title, { color: darkTheme.text }]}>Send Announcement</Text>
              <Text style={[styles.subtitle, { color: darkTheme.textSecondary }]}>
                Communicate with your members
              </Text>
            </View>
          </View>

          {/* Template Picker Card */}
          <View style={[styles.card, { backgroundColor: darkTheme.surface }]}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons 
                name="file-document-multiple-outline" 
                size={20} 
                color={darkTheme.primary} 
              />
              <Text style={[styles.cardTitle, { color: darkTheme.text }]}>Message Template</Text>
            </View>
            
            <View style={[styles.pickerContainer, { borderColor: darkTheme.divider }]}>
              <Picker
                selectedValue={selectedTemplate}
                onValueChange={setSelectedTemplate}
                style={[styles.picker, { color: darkTheme.text }]}
                dropdownIconColor={darkTheme.primary}
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
          </View>

          {/* Subject Input Card */}
          <View style={[styles.card, { backgroundColor: darkTheme.surface }]}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons 
                name="format-title" 
                size={20} 
                color={darkTheme.primary} 
              />
              <Text style={[styles.cardTitle, { color: darkTheme.text }]}>Subject</Text>
            </View>
            
            <TextInput
              style={[styles.input, { 
                backgroundColor: darkTheme.surfaceLight,
                color: darkTheme.text,
                borderColor: darkTheme.divider
              }]}
              placeholder='Enter announcement subject'
              placeholderTextColor={darkTheme.textSecondary}
              value={subject}
              onChangeText={setSubject}
            />
          </View>

          {/* Message Input Card */}
          <View style={[styles.card, { backgroundColor: darkTheme.surface }]}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons 
                name="message-text-outline" 
                size={20} 
                color={darkTheme.primary} 
              />
              <Text style={[styles.cardTitle, { color: darkTheme.text }]}>Message</Text>
            </View>
            
            <TextInput
              style={[styles.input, styles.messageInput, { 
                backgroundColor: darkTheme.surfaceLight,
                color: darkTheme.text,
                borderColor: darkTheme.divider
              }]}
              placeholder='Type your announcement message here...'
              placeholderTextColor={darkTheme.textSecondary}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
          </View>

          {/* Recipient Group Card */}
          <View style={[styles.card, { backgroundColor: darkTheme.surface }]}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons 
                name="account-group-outline" 
                size={20} 
                color={darkTheme.primary} 
              />
              <Text style={[styles.cardTitle, { color: darkTheme.text }]}>Recipient Group</Text>
            </View>
            
            <View style={[styles.pickerContainer, { borderColor: darkTheme.divider }]}>
              <Picker
                selectedValue={selectedGroup}
                onValueChange={setSelectedGroup}
                style={[styles.picker, { color: darkTheme.text }]}
                dropdownIconColor={darkTheme.primary}
              >
                <Picker.Item label='All Members' value='all' />
                <Picker.Item label='Trial Members' value='trial' />
                <Picker.Item label='Active Members' value='active' />
                <Picker.Item label='Inactive Members' value='inactive' />
              </Picker>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonGroup}>
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: darkTheme.surfaceLight }]} 
              onPress={clearForm}
            >
              <MaterialCommunityIcons 
                name="trash-can-outline" 
                size={18} 
                color={darkTheme.text} 
              />
              <Text style={[styles.buttonText, { color: darkTheme.text }]}> Clear Form</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: darkTheme.primary }]} 
              onPress={sendMail}
              disabled={isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color={darkTheme.background} />
              ) : (
                <>
                  <MaterialCommunityIcons 
                    name="send-outline" 
                    size={18} 
                    color={darkTheme.background} 
                  />
                  <Text style={[styles.buttonText, { color: darkTheme.background }]}> 
                    Send Announcement
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
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
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
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
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});