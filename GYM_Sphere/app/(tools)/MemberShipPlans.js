import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  RefreshControl,
  Animated,
  Easing,
  Dimensions,
  Alert
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import * as Animatable from "react-native-animatable";

const { width } = Dimensions.get('window');

// Enhanced Membership Plans Data
const MEMBERSHIP_PLANS = {
  BASIC: {
    name: "Basic",
    price: 29.99,
    benefits: [
      { text: "Basic gym access", icon: "dumbbell" },
      { text: "Limited hours (6AM-8PM)", icon: "clock-outline" },
      { text: "Access to basic equipment", icon: "weight-lifter" },
      { text: "Locker access", icon: "locker" },
      { text: "Free WiFi", icon: "wifi" }
    ],
    color: "#6b7280", // Cool gray
    icon: "silverware-fork-knife",
    gradient: ["#4b5563", "#374151"]
  },
  PREMIUM: {
    name: "Premium",
    price: 49.99,
    benefits: [
      { text: "Unlimited gym access", icon: "infinity" },
      { text: "24/7 access", icon: "clock-check-outline" },
      { text: "Free fitness classes", icon: "yoga" },
      { text: "Personal trainer (1/month)", icon: "account-star" },
      { text: "Premium equipment", icon: "weight" },
      { text: "Sauna access", icon: "hot-tub" },
      { text: "Nutrition guide", icon: "food-apple" }
    ],
    color: "#3b82f6", // Blue-500
    icon: "star-circle",
    gradient: ["#2563eb", "#1d4ed8"]
  },
  VIP: {
    name: "VIP",
    price: 89.99,
    benefits: [
      { text: "Unlimited gym access", icon: "crown" },
      { text: "24/7 VIP access", icon: "shield-account" },
      { text: "Unlimited classes", icon: "calendar-multiple" },
      { text: "Weekly trainer sessions", icon: "account-supervisor" },
      { text: "All equipment", icon: "weight-lifter" },
      { text: "Spa & massage", icon: "spa" },
      { text: "Nutritionist sessions", icon: "food-variant" },
      { text: "Guest passes", icon: "account-multiple-plus" },
      { text: "Priority booking", icon: "priority-high" }
    ],
    color: "#f59e0b", // Amber-500
    icon: "crown-outline",
    gradient: ["#d97706", "#b45309"]
  }
};

const MembershipPlans = () => {
  const navigation = useNavigation();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("PREMIUM");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  const animateButton = () => {
    animation.setValue(0);
    Animated.timing(animation, {
      toValue: 1,
      duration: 300,
      easing: Easing.linear,
      useNativeDriver: true
    }).start();
  };

  const handleUpgrade = (planKey) => {
    animateButton();
    setProcessingPayment(true);
    
    setTimeout(() => {
      setProcessingPayment(false);
      setShowUpgradeModal(false);
      Alert.alert(
        "Membership Upgraded!",
        `You're now a ${MEMBERSHIP_PLANS[planKey].name} member. Enjoy your new benefits!`,
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    }, 2000);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const scaleInterpolate = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.05, 1]
  });

  const animatedStyle = {
    transform: [{ scale: scaleInterpolate }]
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Icon name="chevron-left" size={32} color="#f3f4f6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Your Plan</Text>
        <View style={{ width: 32 }} /> {/* Spacer */}
      </View>

      {/* Membership Plans List */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor="#3b82f6"
            colors={["#3b82f6"]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Animatable.Text 
          animation="fadeInDown" 
          duration={800}
          style={styles.title}
        >
          Elevate Your Fitness Journey
        </Animatable.Text>
        
        <Text style={styles.subtitle}>
          Select the membership that fits your goals and lifestyle
        </Text>

        {Object.entries(MEMBERSHIP_PLANS).map(([key, plan]) => (
          <Animatable.View
            key={key}
            animation="fadeInUp"
            duration={800}
            delay={parseInt(key) * 150}
            style={[
              styles.planCard, 
              { 
                borderLeftWidth: 4,
                borderLeftColor: plan.color,
                backgroundColor: '#1f2937',
                shadowColor: plan.color,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 6
              }
            ]}
          >
            <View style={styles.planHeader}>
              <Icon 
                name={plan.icon} 
                size={28} 
                color={plan.color} 
                style={styles.planIcon}
              />
              <View>
                <Text style={[styles.planName, { color: plan.color }]}>
                  {plan.name}
                </Text>
                <Text style={styles.planPrice}>
                  ${plan.price}<Text style={styles.perMonth}>/month</Text>
                </Text>
              </View>
            </View>

            <View style={styles.benefitsContainer}>
              {plan.benefits.map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <Icon 
                    name={benefit.icon} 
                    size={20} 
                    color={plan.color} 
                    style={{ marginRight: 12 }}
                  />
                  <Text style={styles.benefitText}>{benefit.text}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.selectButton, 
                { 
                  backgroundColor: plan.color,
                  shadowColor: plan.color,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.4,
                  shadowRadius: 4,
                  elevation: 4
                }
              ]}
              onPress={() => {
                setSelectedPlan(key);
                setShowUpgradeModal(true);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.selectButtonText}>
                Choose {plan.name}
              </Text>
            </TouchableOpacity>
          </Animatable.View>
        ))}

        <View style={styles.infoBox}>
          <Icon name="information-outline" size={24} color="#3b82f6" />
          <Text style={styles.infoText}>
            All plans include a 7-day free trial. Cancel anytime.
          </Text>
        </View>
      </ScrollView>

      {/* Floating Upgrade Button */}
      {selectedPlan && (
        <Animated.View 
          style={[
            styles.upgradeButtonContainer,
            animatedStyle
          ]}
        >
          <TouchableOpacity
            style={[
              styles.upgradeButton, 
              { 
                backgroundColor: MEMBERSHIP_PLANS[selectedPlan].color,
                shadowColor: MEMBERSHIP_PLANS[selectedPlan].color,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6
              }
            ]}
            onPress={() => setShowUpgradeModal(true)}
            activeOpacity={0.8}
          >
            <Icon 
              name="arrow-up" 
              size={22} 
              color="#fff" 
              style={{ marginRight: 8 }} 
            />
            <Text style={styles.upgradeButtonText}>
              Upgrade to {MEMBERSHIP_PLANS[selectedPlan].name}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Upgrade Modal */}
      <Modal
        visible={showUpgradeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUpgradeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowUpgradeModal(false)}
            >
              <Icon name="close" size={24} color="#9ca3af" />
            </TouchableOpacity>

            <ScrollView 
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.modalHeader}>
                <Icon 
                  name={MEMBERSHIP_PLANS[selectedPlan]?.icon} 
                  size={40} 
                  color={MEMBERSHIP_PLANS[selectedPlan]?.color} 
                />
                <Text style={styles.modalTitle}>
                  Confirm {MEMBERSHIP_PLANS[selectedPlan]?.name} Membership
                </Text>
              </View>

              <View style={styles.selectedPlanContainer}>
                <View style={styles.priceContainer}>
                  <Text style={styles.modalPrice}>
                    ${MEMBERSHIP_PLANS[selectedPlan]?.price}
                  </Text>
                  <Text style={styles.perMonth}>/month</Text>
                </View>

                <View style={styles.modalBenefitsContainer}>
                  {MEMBERSHIP_PLANS[selectedPlan]?.benefits.map((benefit, index) => (
                    <View key={index} style={styles.modalBenefitItem}>
                      <Icon 
                        name={benefit.icon} 
                        size={20} 
                        color={MEMBERSHIP_PLANS[selectedPlan]?.color} 
                        style={{ marginRight: 12 }}
                      />
                      <Text style={styles.modalBenefitText}>{benefit.text}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.paymentMethod}>
                <Text style={styles.paymentTitle}>Payment Method</Text>
                <View style={styles.cardPreview}>
                  <Icon name="credit-card" size={24} color="#9ca3af" />
                  <Text style={styles.cardText}>•••• •••• •••• 4242</Text>
                  <Icon name="chevron-down" size={20} color="#9ca3af" />
                </View>
              </View>

              <Animated.View style={animatedStyle}>
                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    { backgroundColor: MEMBERSHIP_PLANS[selectedPlan]?.color }
                  ]}
                  onPress={() => handleUpgrade(selectedPlan)}
                  disabled={processingPayment}
                  activeOpacity={0.8}
                >
                  {processingPayment ? (
                    <>
                      <Icon name="loading" size={20} color="#fff" style={styles.spinner} />
                      <Text style={styles.confirmButtonText}>Processing...</Text>
                    </>
                  ) : (
                    <>
                      <Icon name="check-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
                      <Text style={styles.confirmButtonText}>Confirm & Pay</Text>
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowUpgradeModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Not Now</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Enhanced Dark Theme Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827", // Dark slate background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#111827',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f3f4f6',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#f9fafb',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 32,
  },
  planCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    overflow: 'hidden',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  planIcon: {
    marginRight: 16,
  },
  planName: {
    fontSize: 22,
    fontWeight: '700',
  },
  planPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f9fafb',
  },
  perMonth: {
    fontSize: 16,
    color: '#9ca3af',
    fontWeight: '400',
  },
  benefitsContainer: {
    marginVertical: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  benefitText: {
    fontSize: 15,
    color: '#e5e7eb',
    flex: 1,
  },
  selectButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    flexDirection: 'row',
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#93c5fd',
    marginLeft: 12,
    flex: 1,
  },
  upgradeButtonContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
  upgradeButton: {
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  upgradeButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#1f2937',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1,
    padding: 8,
  },
  modalScrollContent: {
    paddingBottom: 40,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f9fafb',
    textAlign: 'center',
    marginTop: 16,
  },
  selectedPlanContainer: {
    marginBottom: 24,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 24,
  },
  modalPrice: {
    fontSize: 36,
    fontWeight: '700',
    color: '#f9fafb',
  },
  modalBenefitsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
  },
  modalBenefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  modalBenefitText: {
    fontSize: 15,
    color: '#e5e7eb',
    flex: 1,
  },
  paymentMethod: {
    marginBottom: 24,
  },
  paymentTitle: {
    fontSize: 16,
    color: '#9ca3af',
    marginBottom: 12,
  },
  cardPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
  },
  cardText: {
    fontSize: 16,
    color: '#e5e7eb',
    flex: 1,
    marginHorizontal: 12,
  },
  confirmButton: {
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 16,
  },
  confirmButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  spinner: {
    marginRight: 8,
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#9ca3af',
    fontWeight: '500',
  },
});

export default MembershipPlans;