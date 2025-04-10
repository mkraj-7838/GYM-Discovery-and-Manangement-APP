import React, { useState, useEffect } from 'react';
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
  Platform,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from "@react-navigation/native";

import { Picker } from '@react-native-picker/picker';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000/api";

// Simplified color options
const COLOR_OPTIONS = [
  '#10b981', // Emerald
  '#3b82f6', // Sapphire
  '#ef4444', // Ruby
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#f43f5e', // Rose
  '#0ea5e9', // Sky
  '#84cc16', // Lime
  '#eab308', // Gold
  '#94a3b8', // Silver
];

const ICON_OPTIONS = [
  'crown',
  'diamond-stone',
  'star',
  'trophy',
  'medal',
  'shield-crown',
  'rocket',
  'lightning-bolt',
  'fire',
  'account-supervisor'
];

const MembershipPlansScreen = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [token, setToken] = useState(null);

  const navigation = useNavigation();


  // Form state
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    color: COLOR_OPTIONS[0],
    icon: ICON_OPTIONS[0],
    features: [{ name: '', included: true }],
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      color: COLOR_OPTIONS[0],
      icon: ICON_OPTIONS[0],
      features: [{ name: '', included: true }],
    });
    setCurrentPlan(null);
  };

  

  // Fetch token and plans
  useEffect(() => {
    const fetchToken = async () => {
      const storedToken = await AsyncStorage.getItem('token');
      setToken(storedToken);
    };
    fetchToken();
  }, []);

  useEffect(() => {
    if (token) {
      fetchPlans();
    }
  }, [token]);

  

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/membership-plans`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) setPlans(data.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch plans');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPlans();
  };

  const addFeature = () => {
    setFormData({
      ...formData,
      features: [...formData.features, { name: '', included: true }],
    });
  };

  const updateFeature = (index, field, value) => {
    const updatedFeatures = [...formData.features];
    updatedFeatures[index][field] = value;
    setFormData({ ...formData, features: updatedFeatures });
  };

  const removeFeature = (index) => {
    if (formData.features.length > 1) {
      const updatedFeatures = [...formData.features];
      updatedFeatures.splice(index, 1);
      setFormData({ ...formData, features: updatedFeatures });
    }
  };

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

  const deletePlan = async (id) => {
    Alert.alert(
      'Delete Plan',
      'Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_BASE_URL}/membership-plans/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
              });
              const data = await response.json();
              if (data.success) fetchPlans();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete plan');
            }
          }
        },
      ]
    );
  };

  const savePlan = async () => {
    if (!formData.name.trim()) return Alert.alert('Error', 'Plan name is required');
    if (!formData.price || isNaN(formData.price)) return Alert.alert('Error', 'Valid price required');
    if (formData.features.some(f => !f.name.trim())) return Alert.alert('Error', 'All features need names');

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

      const url = currentPlan 
        ? `${API_BASE_URL}/membership-plans/${currentPlan._id}`
        : `${API_BASE_URL}/membership-plans`;
        
      const method = currentPlan ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(planData),
      });

      const data = await response.json();
      if (data.success) {
        setShowPlanModal(false);
        fetchPlans();
      } else {
        Alert.alert('Error', data.error || 'Failed to save');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save plan');
    }
  };

  const renderPlanCard = ({ item }) => (
    <View style={[
      styles.planCard, 
      { 
        borderLeftWidth: 6,
        borderLeftColor: item.color,
        backgroundColor: '#1a1a1a',
      }
    ]}>
      <View style={styles.planHeader}>
        <Icon name={item.icon} size={28} color={item.color} />
        <View style={styles.planTitleContainer}>
          <Text style={[styles.planName, { color: item.color }]}>
            {item.name}
          </Text>
          <Text style={styles.planPrice}>
            Rs.{item.price}<Text style={styles.perMonth}>/month</Text>
          </Text>
        </View>
        
        <View style={styles.planActions}>
          <TouchableOpacity onPress={() => editPlan(item)} style={styles.editButton}>
            <Icon name="pencil" size={18} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => deletePlan(item._id)} style={styles.deleteButton}>
            <Icon name="trash-can" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.benefitsContainer}>
        {item.features.map((feature, index) => (
          <View key={index} style={styles.benefitItem}>
            <Icon 
              name={feature.included ? 'check' : 'close'} 
              size={20} 
              color={feature.included ? item.color : '#666'} 
            />
            <Text style={styles.benefitText}>{feature.name}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevron-left" size={32} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Membership Plans</Text>
        <TouchableOpacity
          onPress={() => {
            resetForm();
            setShowPlanModal(true);
          }}
          style={styles.addButton}
        >
          <Icon name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : plans.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="clipboard-text" size={60} color="#444" />
          <Text style={styles.emptyText}>No plans created yet</Text>
          <TouchableOpacity 
            style={styles.createFirstButton}
            onPress={() => {
              resetForm();
              setShowPlanModal(true);
            }}
          >
            <Text style={styles.createFirstButtonText}>Create First Plan</Text>
          </TouchableOpacity>
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
            />
          }
        />
      )}

      {/* Plan Form Modal */}
      <Modal
        visible={showPlanModal}
        onRequestClose={() => setShowPlanModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPlanModal(false)}>
              <Icon name="close" size={24} color="#999" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {currentPlan ? 'Edit Plan' : 'Create Plan'}
            </Text>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {/* Color Selection */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Plan Color</Text>
              <View style={styles.colorGrid}>
                {COLOR_OPTIONS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { 
                        backgroundColor: color,
                        borderWidth: formData.color === color ? 2 : 0,
                        borderColor: '#fff'
                      }
                    ]}
                    onPress={() => setFormData({...formData, color})}
                  />
                ))}
              </View>
            </View>

            {/* Name */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Plan Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter plan name"
                value={formData.name}
                onChangeText={text => setFormData({...formData, name: text})}
              />
            </View>

            {/* Price */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Monthly Price (Rs.)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter price"
                keyboardType="numeric"
                value={formData.price}
                onChangeText={text => setFormData({...formData, price: text})}
              />
            </View>

            {/* Icon */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Icon</Text>
              <Picker
                selectedValue={formData.icon}
                onValueChange={value => setFormData({...formData, icon: value})}
                style={styles.picker}
              >
                {ICON_OPTIONS.map(icon => (
                  <Picker.Item key={icon} label={icon} value={icon} />
                ))}
              </Picker>
            </View>

            {/* Features */}
            <View style={styles.inputContainer}>
              <View style={styles.featuresHeader}>
                <Text style={styles.inputLabel}>Features</Text>
                <TouchableOpacity onPress={addFeature} style={styles.addButtonSmall}>
                  <Icon name="plus" size={20} color="#3b82f6" />
                </TouchableOpacity>
              </View>
              
              {formData.features.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <TextInput
                    style={styles.featureInput}
                    placeholder="Feature name"
                    value={feature.name}
                    onChangeText={text => updateFeature(index, 'name', text)}
                  />
                  <TouchableOpacity
                    style={[
                      styles.featureToggle,
                      { backgroundColor: feature.included ? formData.color : '#666' }
                    ]}
                    onPress={() => updateFeature(index, 'included', !feature.included)}
                  >
                    <Icon 
                      name={feature.included ? 'check' : 'close'} 
                      size={16} 
                      color="#fff" 
                    />
                  </TouchableOpacity>
                  {formData.features.length > 1 && (
                    <TouchableOpacity 
                      style={styles.removeButton}
                      onPress={() => removeFeature(index)}
                    >
                      <Icon name="close" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: formData.color }]}
              onPress={savePlan}
            >
              <Text style={styles.saveButtonText}>
                {currentPlan ? 'Update Plan' : 'Create Plan'}
              </Text>
            </TouchableOpacity>
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
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#fff',
    marginTop: 16,
  },
  createFirstButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  createFirstButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  planCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#1a1a1a',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  planTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
  },
  planPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  perMonth: {
    fontSize: 12,
    color: '#999',
  },
  planActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
  },
  benefitsContainer: {
    marginTop: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  benefitText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 12,
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
  modalTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 16,
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
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  picker: {
    backgroundColor: '#222',
    borderRadius: 8,
    color: '#fff',
  },
  featuresHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addButtonSmall: {
    padding: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureInput: {
    flex: 1,
    backgroundColor: '#222',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    marginRight: 8,
  },
  featureToggle: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    padding: 10,
    marginLeft: 8,
  },
  saveButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default MembershipPlansScreen;