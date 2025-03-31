import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  RefreshControl,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome"; // For check icons
import { useNavigation } from "@react-navigation/native"; // For navigation
import * as Animatable from "react-native-animatable"; // For animations

// Membership Plans Data
const MEMBERSHIP_PLANS = {
  BASIC: {
    name: "Basic",
    price: 29.99,
    benefits: [
      "Basic gym access",
      "Limited hours (6AM-8PM)",
      "Access to basic equipment",
    ],
    color: "#808080", // Gray
  },
  PREMIUM: {
    name: "Premium",
    price: 49.99,
    benefits: [
      "Unlimited gym access",
      "24/7 access",
      "Free fitness classes",
      "Personal trainer consultation (1/month)",
      "Access to premium equipment",
    ],
    color: "#1A73E8", // Razorpay blue
  },
  VIP: {
    name: "VIP",
    price: 89.99,
    benefits: [
      "Unlimited gym access",
      "24/7 access",
      "Unlimited fitness classes",
      "Weekly personal trainer sessions",
      "Access to all equipment",
      "Spa access",
      "Nutritional counseling",
    ],
    color: "#FFD700", // Gold
  },
};

const MembershipPlans = () => {
  const navigation = useNavigation();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Handle plan selection
  const handleUpgrade = (planKey) => {
    setSelectedPlan(planKey);
    setProcessingPayment(true);
    // Simulate payment processing
    setTimeout(() => {
      setProcessingPayment(false);
      setShowUpgradeModal(false);
      Alert.alert("Success", `You have upgraded to the ${MEMBERSHIP_PLANS[planKey].name} plan!`);
    }, 2000);
  };

  // Pull-to-refresh handler
  const onRefresh = () => {
    setRefreshing(true);
    // Simulate fetching new data
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  return (
    <View style={styles.container}>
      {/* Back Arrow */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Icon name="arrow-left" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Membership Plans List */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#1A73E8"]} />
        }
      >
        <Text style={styles.title}>Membership Plans</Text>
        {Object.entries(MEMBERSHIP_PLANS).map(([key, plan]) => (
          <Animatable.View
            key={key}
            animation="fadeInUp"
            duration={800}
            delay={parseInt(key) * 200}
            style={[styles.planCard, { borderColor: plan.color }]}
          >
            <Text style={[styles.planName, { color: plan.color }]}>{plan.name}</Text>
            <Text style={styles.planPrice}>${plan.price}/month</Text>
            <View style={styles.benefitsContainer}>
              {plan.benefits.map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <Icon name="check" size={16} color={plan.color} />
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.selectButton, { borderColor: plan.color }]}
              onPress={() => {
                setSelectedPlan(key);
                setShowUpgradeModal(true);
              }}
            >
              <Text style={[styles.selectButtonText, { color: plan.color }]}>Select Plan</Text>
            </TouchableOpacity>
          </Animatable.View>
        ))}
      </ScrollView>

      {/* Upgrade Button at Bottom */}
      {selectedPlan && (
        <TouchableOpacity
          style={[styles.upgradeButton, { backgroundColor: MEMBERSHIP_PLANS[selectedPlan].color }]}
          onPress={() => setShowUpgradeModal(true)}
        >
          <Text style={styles.upgradeButtonText}>
            Upgrade to {MEMBERSHIP_PLANS[selectedPlan].name}
          </Text>
        </TouchableOpacity>
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
            <ScrollView contentContainerStyle={styles.modalScrollContent}>
              <Text style={styles.modalTitle}>Confirm Your Plan</Text>
              <View style={styles.selectedPlanContainer}>
                <Text style={[styles.planName, { color: MEMBERSHIP_PLANS[selectedPlan]?.color }]}>
                  {MEMBERSHIP_PLANS[selectedPlan]?.name}
                </Text>
                <Text style={styles.planPrice}>
                  ${MEMBERSHIP_PLANS[selectedPlan]?.price}/month
                </Text>
                <View style={styles.benefitsContainer}>
                  {MEMBERSHIP_PLANS[selectedPlan]?.benefits.map((benefit, index) => (
                    <View key={index} style={styles.benefitItem}>
                      <Icon name="check" size={16} color={MEMBERSHIP_PLANS[selectedPlan]?.color} />
                      <Text style={styles.benefitText}>{benefit}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => handleUpgrade(selectedPlan)}
                disabled={processingPayment}
              >
                <Text style={styles.confirmButtonText}>
                  {processingPayment ? "Processing..." : "Confirm Upgrade"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowUpgradeModal(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A2540", // Dark blue background
    padding: 20,
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 1,
  },
  scrollContent: {
    paddingTop: 60, // Space for back button
    paddingBottom: 100, // Space for upgrade button
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF", // White text
    textAlign: "center",
    marginBottom: 30,
  },
  planCard: {
    backgroundColor: "#1E3A5F", // Slightly lighter dark blue
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
  },
  planName: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  planPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF", // White text
    textAlign: "center",
    marginBottom: 20,
  },
  benefitsContainer: {
    marginBottom: 20,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  benefitText: {
    fontSize: 16,
    color: "#FFFFFF", // White text
    marginLeft: 10,
  },
  selectButton: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  upgradeButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF", // White text
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent overlay
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#0A2540", // Dark blue background
    borderRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  modalScrollContent: {
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF", // White text
    textAlign: "center",
    marginBottom: 20,
  },
  selectedPlanContainer: {
    marginBottom: 20,
  },
  confirmButton: {
    padding: 15,
    backgroundColor: "#34A853", // Green for confirm button
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF", // White text
  },
  closeButton: {
    padding: 15,
    backgroundColor: "#DC3545", // Red for close button
    borderRadius: 10,
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF", // White text
  },
});

export default MembershipPlans;