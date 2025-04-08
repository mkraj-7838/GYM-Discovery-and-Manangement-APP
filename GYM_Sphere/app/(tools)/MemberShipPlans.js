import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  ScrollView, 
  RefreshControl, 
  ActivityIndicator,
  Animated,
  Platform,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Animatable from 'react-native-animatable';
import { Picker } from '@react-native-picker/picker';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000/api";

// Color options for plans
const PLAN_COLORS = [
  { name: 'Emerald', value: '#10b981' },
  { name: 'Sapphire', value: '#3b82f6' },
  { name: 'Ruby', value: '#ef4444' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Sky', value: '#0ea5e9' },
  { name: 'Lime', value: '#84cc16' },
  { name: 'Gold', value: '#eab308' },
  { name: 'Silver', value: '#94a3b8' },
];

// Icon options for plans
const availableIcons = [
  'crown',
  'diamond-stone',
  'star',
  'trophy',
  'medal',
  'shield-crown',
  'rocket',
  'lightning-bolt',
  'fire',
  'account-supervisor',
  'account-group',
  'chess-queen',
  'gift',
  'heart',
  'hexagon',
];

const MembershipPlansScreen = ({ navigation }) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [token, setToken] = useState(null);
  const buttonScale = useRef(new Animated.Value(1)).current;

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    color: PLAN_COLORS[0].value,
    icon: availableIcons[0],
    features: [{ name: '', included: true }],
  });

  // Animation for button press
  const animateButton = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animatedStyle = {
    transform: [{ scale: buttonScale }],
  };

  // Reset form to default values
  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      color: PLAN_COLORS[0].value,
      icon: availableIcons[0],
      features: [{ name: '', included: true }],
    });
    setCurrentPlan(null);
  };

  // Fetch token from AsyncStorage
  useEffect(() => {
    const getToken = async () => {
      const storedToken = await AsyncStorage.getItem('token');
      setToken(storedToken);
      if (storedToken) {
        fetchPlans();
      }
    };
    getToken();
  }, []);

  // Fetch all plans for the user
  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/membership-plans`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setPlans(data.data);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      Alert.alert('Error', 'Failed to fetch plans');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchPlans();
  };

  // Add a new feature field
  const addFeature = () => {
    setFormData({
      ...formData,
      features: [...formData.features, { name: '', included: true }],
    });
  };

  // Update a feature
  const updateFeature = (index, field, value) => {
    const updatedFeatures = [...formData.features];
    updatedFeatures[index][field] = value;
    setFormData({ ...formData, features: updatedFeatures });
  };

  // Remove a feature
  const removeFeature = (index) => {
    const updatedFeatures = [...formData.features];
    updatedFeatures.splice(index, 1);
    setFormData({ ...formData, features: updatedFeatures });
  };

  // Edit an existing plan
  const editPlan = (plan) => {
    setCurrentPlan(plan);
    setFormData({
      name: plan.name,
      price: plan.price.toString(),
      color: plan.color,
      icon: plan.icon,
      features: plan.features.map(f => ({ ...f })),
    });
    setShowPlanModal(true);
  };

  // Delete a plan
  const deletePlan = async (id) => {
    Alert.alert(
      'Delete Plan',
      'Are you sure you want to delete this plan?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_BASE_URL}/membership-plans/${id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });
              const data = await response.json();
              if (data.success) {
                fetchPlans();
              }
            } catch (error) {
              console.error('Error deleting plan:', error);
              Alert.alert('Error', 'Failed to delete plan');
            }
          },
        },
      ]
    );
  };

  // Save or update a plan
  const savePlan = async () => {
    // Validate form
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Plan name is required');
      return;
    }
    if (!formData.price || isNaN(formData.price)) {
      Alert.alert('Error', 'Price must be a valid number');
      return;
    }
    if (formData.features.some(f => !f.name.trim())) {
      Alert.alert('Error', 'All features must have a name');
      return;
    }

    try {
      const planData = {
        name: formData.name,
        price: parseFloat(formData.price),
        color: formData.color,
        icon: formData.icon,
        features: formData.features.map(f => ({
          name: f.name.trim(),
          included: f.included,
        })),
      };

      let response;
      if (currentPlan) {
        // Update existing plan
        response = await fetch(`${API_BASE_URL}/membership-plans/${currentPlan._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(planData),
        });
      } else {
        // Create new plan
        response = await fetch(`${API_BASE_URL}/membership-plans`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(planData),
        });
      }

      const data = await response.json();
      if (data.success) {
        setShowPlanModal(false);
        fetchPlans();
      } else {
        Alert.alert('Error', data.error || 'Failed to save plan');
      }
    } catch (error) {
      console.error('Error saving plan:', error);
      Alert.alert('Error', 'Failed to save plan');
    }
  };

  // Render plan card
  const renderPlanCard = ({ item }) => (
    <Animatable.View 
      animation="fadeInUp"
      duration={800}
      style={[
        styles.planCard, 
        { 
          borderWidth: 4, // Add border
        borderColor: `${item.color}50`, // 50% opacity of the color
        backgroundColor: '#1a1a1a',
        shadowColor: item.color,
        elevation: 6,
        }
      ]}
    >
      <View style={[
      styles.colorStrip,
      { backgroundColor: item.color }
    ]} />
      
      <View style={styles.planHeader}>
        <Icon 
          name={item.icon} 
          size={28} 
          color={item.color} 
          style={styles.planIcon}
        />
        <View style={styles.planTitleContainer}>
          <Text style={[styles.planName, { color: item.color }]}>
            {item.name}
          </Text>
          <Text style={styles.planPrice}>
            ${item.price}<Text style={styles.perMonth}>/month</Text>
          </Text>
        </View>
        
        <View style={styles.planActions}>
          <TouchableOpacity
            onPress={() => editPlan(item)}
            style={[styles.actionButton, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}
          >
            <Icon name="pencil" size={18} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => deletePlan(item._id)}
            style={[styles.actionButton, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}
          >
            <Icon name="trash-can" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.benefitsContainer}>
        {item.features.map((feature, index) => (
          <View key={index} style={styles.benefitItem}>
            <Icon 
              name={feature.included ? 'check-circle' : 'close-circle'} 
              size={20} 
              color={feature.included ? item.color : '#666'} 
              style={{ marginRight: 12 }}
            />
            <Text style={styles.benefitText}>{feature.name}</Text>
          </View>
        ))}
      </View>
    </Animatable.View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Icon name="chevron-left" size={32} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Membership Plans</Text>
        <TouchableOpacity
          onPress={() => {
            resetForm();
            setShowPlanModal(true);
          }}
          style={styles.addButton}
          activeOpacity={0.7}
        >
          <Icon name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Plans List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : plans.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="clipboard-text" size={60} color="#444" />
          <Text style={styles.emptyText}>No plans created yet</Text>
          <Text style={styles.emptySubtext}>Tap the + button to add your first plan</Text>
        </View>
      ) : (
        <FlatList
          data={plans}
          renderItem={renderPlanCard}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              tintColor="#3b82f6"
              colors={["#3b82f6"]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Plan Form Modal */}
      <Modal
        visible={showPlanModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowPlanModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => setShowPlanModal(false)}
              style={styles.modalCloseButton}
            >
              <Icon name="close" size={24} color="#999" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {currentPlan ? 'Edit Plan' : 'Create New Plan'}
            </Text>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {/* Plan Color Selection */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Plan Color</Text>
              <View style={styles.colorOptionsContainer}>
                {PLAN_COLORS.map((colorOption) => (
                  <TouchableOpacity
                    key={colorOption.value}
                    style={[
                      styles.colorOption,
                      { 
                        backgroundColor: colorOption.value,
                        borderWidth: formData.color === colorOption.value ? 3 : 0,
                        borderColor: '#fff'
                      }
                    ]}
                    onPress={() => setFormData({ ...formData, color: colorOption.value })}
                  >
                    {formData.color === colorOption.value && (
                      <Icon name="check" size={16} color="#fff" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Name Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Plan Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter plan name"
                placeholderTextColor="#666"
                value={formData.name}
                onChangeText={text => setFormData({ ...formData, name: text })}
              />
            </View>

            {/* Price Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Monthly Price ($)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter monthly price"
                placeholderTextColor="#666"
                keyboardType="numeric"
                value={formData.price}
                onChangeText={text => setFormData({ ...formData, price: text })}
              />
            </View>

            {/* Icon Picker */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Plan Icon</Text>
              <View style={styles.iconPickerContainer}>
                <Picker
                  selectedValue={formData.icon}
                  onValueChange={value => setFormData({ ...formData, icon: value })}
                  style={styles.iconPicker}
                  dropdownIconColor="#999"
                >
                  {availableIcons.map(icon => (
                    <Picker.Item 
                      key={icon} 
                      label={icon} 
                      value={icon} 
                    />
                  ))}
                </Picker>
                <View style={[
                  styles.iconPreview, 
                  { backgroundColor: '#222' }
                ]}>
                  <Icon name={formData.icon} size={24} color={formData.color} />
                </View>
              </View>
            </View>

            {/* Features List */}
            <View style={styles.featuresHeader}>
              <Text style={styles.inputLabel}>Plan Features</Text>
              <TouchableOpacity
                onPress={addFeature}
                style={styles.addFeatureButton}
              >
                <Icon name="plus" size={20} color="#3b82f6" />
              </TouchableOpacity>
            </View>

            {formData.features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={styles.featureInputContainer}>
                  <TextInput
                    style={[styles.input, styles.featureInput]}
                    placeholder="Feature name"
                    placeholderTextColor="#666"
                    value={feature.name}
                    onChangeText={text => updateFeature(index, 'name', text)}
                  />
                  <TouchableOpacity
                    onPress={() => updateFeature(index, 'included', !feature.included)}
                    style={[
                      styles.featureToggle,
                      { backgroundColor: feature.included ? formData.color : '#666' }
                    ]}
                  >
                    <Icon 
                      name={feature.included ? 'check' : 'close'} 
                      size={16} 
                      color="#fff" 
                    />
                  </TouchableOpacity>
                </View>
                {formData.features.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeFeature(index)}
                    style={styles.removeFeatureButton}
                  >
                    <Icon name="close" size={20} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {/* Save Button */}
            <Animated.View style={[animatedStyle, { marginTop: 20 }]}>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: formData.color }]}
                onPress={() => {
                  animateButton();
                  savePlan();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.saveButtonText}>
                  {currentPlan ? 'Update Plan' : 'Create Plan'}
                </Text>
                <Icon name="check" size={20} color="#fff" style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  addButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#000',
  },
  emptyText: {
    fontSize: 18,
    color: '#fff',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  planCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    overflow: 'hidden',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  planIcon: {
    marginRight: 12,
  },
  planTitleContainer: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
  },
  planPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  perMonth: {
    fontSize: 14,
    color: '#999',
    fontWeight: '400',
  },
  planActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 12,
  },
  benefitsContainer: {
    marginTop: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  benefitText: {
    fontSize: 14,
    color: '#fff',
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  modalCloseButton: {
    marginRight: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  modalContent: {
    padding: 20,
    paddingBottom: 40,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
  },
  colorOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconPicker: {
    flex: 1,
    color: '#fff',
    backgroundColor: '#222',
    borderRadius: 12,
  },
  iconPreview: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    borderRadius: 12,
  },
  featuresHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  addFeatureButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureInput: {
    flex: 1,
    marginRight: 10,
  },
  featureToggle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeFeatureButton: {
    padding: 10,
    marginLeft: 10,
  },
  saveButton: {
    padding: 18,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default MembershipPlansScreen;