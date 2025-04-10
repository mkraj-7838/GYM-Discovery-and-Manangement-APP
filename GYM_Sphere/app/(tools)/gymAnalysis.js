import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Image,
} from "react-native";
import { BarChart, PieChart, LineChart } from "react-native-chart-kit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AntDesign,
  MaterialIcons,
  FontAwesome,
  Feather,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import moment from "moment";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000/api";
const screenWidth = Dimensions.get("window").width;

const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("monthly");
  const [membersData, setMembersData] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [maintenanceData, setMaintenanceData] = useState([]);
  const [expandedChart, setExpandedChart] = useState(null);

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const [membersRes, attendanceRes, maintenanceRes] = await Promise.all([
        fetch(`${API_BASE_URL}/user/members`, { headers }),
        fetch(`${API_BASE_URL}/attendance/all`, { headers }),
        fetch(`${API_BASE_URL}/user/maintenance`, { headers }),
      ]);

      if (!membersRes.ok || !attendanceRes.ok || !maintenanceRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const [members, attendance, maintenance] = await Promise.all([
        membersRes.json(),
        attendanceRes.json(),
        maintenanceRes.json(),
      ]);

      setMembersData(members);
      setAttendanceData(attendance);
      setMaintenanceData(maintenance);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate statistics
  const calculateStats = () => {
    if (!membersData.length || !attendanceData.length) {
      return {
        batchStats: { morning: 0, evening: 0 },
        statusStats: { active: 0, inactive: 0, trial: 0 },
        genderStats: { male: 0, female: 0, other: 0 },
        planStats: { basic: 0, premium: 0, vip: 0 },
        subscriptionMonths: [],
        maintenanceCost: 0,
        attendanceStats: { daily: [], weekly: [], monthly: [] },
      };
    }

    // Member statistics
    const batchStats = {
      morning: membersData.filter((m) => m.batch === "morning").length,
      evening: membersData.filter((m) => m.batch === "evening").length,
    };

    const statusStats = {
      active: membersData.filter((m) => m.status === "active").length,
      inactive: membersData.filter((m) => m.status === "inactive").length,
      trial: membersData.filter((m) => m.status === "trial").length,
    };

    const genderStats = {
      male: membersData.filter((m) => m.gender === "male").length,
      female: membersData.filter((m) => m.gender === "female").length,
      other: membersData.filter((m) => m.gender === "other").length,
    };

    const planStats = {
      basic: membersData.filter((m) => m.membershipPlan === "basic").length,
      premium: membersData.filter((m) => m.membershipPlan === "premium").length,
      vip: membersData.filter((m) => m.membershipPlan === "vip").length,
    };

    const subscriptionMonths = membersData.map(
      (m) => m.monthsOfSubscription || 0
    );

    // Maintenance statistics
    const maintenanceCost = maintenanceData.reduce(
      (sum, item) => sum + (item.cost || 0),
      0
    );

    // Attendance statistics
    const attendanceByDate = {};
    attendanceData.forEach((item) => {
      const date = moment(item.date).format("YYYY-MM-DD");
      attendanceByDate[date] = (attendanceByDate[date] || 0) + 1;
    });

    const attendanceStats = {
      daily: Object.entries(attendanceByDate).map(([date, count]) => ({
        date,
        count,
      })),
      weekly: groupByWeek(attendanceData),
      monthly: groupByMonth(attendanceData),
    };

    return {
      batchStats,
      statusStats,
      genderStats,
      planStats,
      subscriptionMonths,
      maintenanceCost,
      attendanceStats,
    };
  };

  // Helper functions for grouping attendance data
  const groupByWeek = (data) => {
    const weeklyData = {};
    data.forEach((item) => {
      const week = moment(item.date).startOf("week").format("YYYY-MM-DD");
      weeklyData[week] = (weeklyData[week] || 0) + 1;
    });
    return Object.entries(weeklyData).map(([week, count]) => ({ week, count }));
  };

  const groupByMonth = (data) => {
    const monthlyData = {};
    data.forEach((item) => {
      const month = moment(item.date).startOf("month").format("YYYY-MM");
      monthlyData[month] = (monthlyData[month] || 0) + 1;
    });
    return Object.entries(monthlyData).map(([month, count]) => ({
      month,
      count,
    }));
  };

  // Custom histogram component for subscription months
  const renderHistogram = () => {
    const stats = calculateStats();
    const monthCounts = {};

    stats.subscriptionMonths.forEach((months) => {
      monthCounts[months] = (monthCounts[months] || 0) + 1;
    });

    const labels = Object.keys(monthCounts).sort((a, b) => a - b);
    const data = labels.map((label) => monthCounts[label]);

    return (
      <BarChart
        data={{
          labels: labels,
          datasets: [
            {
              data: data,
            },
          ],
        }}
        width={screenWidth - 40}
        height={220}
        yAxisLabel=""
        chartConfig={{
          backgroundColor: "#1E1E1E",
          backgroundGradientFrom: "#1E1E1E",
          backgroundGradientTo: "#1E1E1E",
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: "6",
            strokeWidth: "2",
            stroke: "#ffa726",
          },
        }}
        verticalLabelRotation={0}
        fromZero
      />
    );
  };

  const totalMembers = membersData.length;

  // Business boost recommendations
  const getBusinessRecommendations = () => {
    const stats = calculateStats();
    const recommendations = [];
    const totalMembers = membersData.length;

    // 1. Batch Utilization Recommendations
    const eveningBatchPercentage =
      (stats.batchStats.evening / totalMembers) * 100;
    const morningBatchPercentage =
      (stats.batchStats.morning / totalMembers) * 100;

    if (eveningBatchPercentage > 70) {
      recommendations.push({
        icon: "clock",
        color: "#2196F3",
        text: `Evening batch at ${Math.round(
          eveningBatchPercentage
        )}% capacity. Offer 10% discount for members who switch to morning.`,
        action: "Create morning shift incentive",
      });
    } else if (morningBatchPercentage > 70) {
      recommendations.push({
        icon: "clock",
        color: "#4CAF50",
        text: `Morning batch at ${Math.round(
          morningBatchPercentage
        )}% capacity. Consider adding more evening slots with personal trainer availability.`,
        action: "Expand evening schedule",
      });
    }

    // 2. Membership Plan Optimization
    const premiumConversionRate =
      (stats.planStats.premium / totalMembers) * 100;
    const vipConversionRate = (stats.planStats.vip / totalMembers) * 100;

    if (premiumConversionRate < 20 && stats.planStats.basic > 10) {
      recommendations.push({
        icon: "star",
        color: "#FFD700",
        text: `Only ${Math.round(
          premiumConversionRate
        )}% on premium plans. Create limited-time upgrade offers with 2 free PT sessions.`,
        action: "Launch premium upgrade campaign",
      });
    }

    if (vipConversionRate < 5 && stats.planStats.premium > 5) {
      recommendations.push({
        icon: "crown",
        color: "#9C27B0",
        text: `VIP conversion low at ${Math.round(
          vipConversionRate
        )}%. Introduce VIP lounge access and monthly body analysis.`,
        action: "Enhance VIP benefits",
      });
    }

    // 3. Attendance Pattern Analysis
    const avgDailyAttendance =
      stats.attendanceStats.daily.reduce((sum, day) => sum + day.count, 0) /
      stats.attendanceStats.daily.length;
    const attendanceRate = (avgDailyAttendance / totalMembers) * 100;

    if (attendanceRate < 30) {
      recommendations.push({
        icon: "calendar",
        color: "#4CAF50",
        text: `Low attendance rate (${Math.round(
          attendanceRate
        )}%). Launch "30-day challenge" with prizes for consistent attendance.`,
        action: "Create attendance challenge",
      });
    }

    // Find least attended day
    if (stats.attendanceStats.daily.length > 0) {
      const leastAttendedDay = stats.attendanceStats.daily.reduce(
        (prev, current) => (prev.count < current.count ? prev : current)
      );
      const dayName = moment(leastAttendedDay.date).format("dddd");

      if (leastAttendedDay.count < avgDailyAttendance * 0.7) {
        recommendations.push({
          icon: "calendar-heart",
          color: "#E91E63",
          text: `Low attendance on ${dayName}s (${leastAttendedDay.count} visits). Offer specialty classes or discounts on this day.`,
          action: `Boost ${dayName} attendance`,
        });
      }
    }

    // 4. Member Retention Strategies
    const longTermMembers = stats.subscriptionMonths.filter(
      (m) => m >= 6
    ).length;
    const retentionRate = (longTermMembers / totalMembers) * 100;

    if (retentionRate < 40 && totalMembers > 0) {
      recommendations.push({
        icon: "account-heart",
        color: "#FF5722",
        text: `6+ month retention at ${Math.round(
          retentionRate
        )}%. Introduce loyalty program with tiered rewards.`,
        action: "Create loyalty program",
      });
    }

    if (stats.statusStats.inactive > 0) {
      const inactivePercentage =
        (stats.statusStats.inactive / totalMembers) * 100;
      recommendations.push({
        icon: "account-alert",
        color: "#F44336",
        text: `${stats.statusStats.inactive} inactive members (${Math.round(
          inactivePercentage
        )}%). Launch "We miss you" campaign with free week reactivation.`,
        action: "Re-engage inactive members",
      });
    }

    // 5. Financial Optimization
    const costPerMember = stats.maintenanceCost / totalMembers;

    if (costPerMember > 500 && totalMembers > 0) {
      recommendations.push({
        icon: "cash",
        color: "#00BCD4",
        text: `High maintenance cost per member (₹${Math.round(
          costPerMember
        )}). Consider equipment leasing options for expensive items.`,
        action: "Review equipment costs",
      });
    }

    // Revenue per member analysis (assuming basic membership is 1000, premium 1500, vip 2500)
    const estimatedRevenue =
      stats.planStats.basic * 1000 +
      stats.planStats.premium * 1500 +
      stats.planStats.vip * 2500;
    const revenuePerMember = estimatedRevenue / totalMembers;

    if (revenuePerMember < 1200 && totalMembers > 0) {
      recommendations.push({
        icon: "trending-up",
        color: "#8BC34A",
        text: `Revenue per member could improve (₹${Math.round(
          revenuePerMember
        )}). Bundle services like nutrition planning with premium plans.`,
        action: "Upsell value-added services",
      });
    }

    // Gender-specific recommendations
    if (stats.genderStats.female < totalMembers * 0.3 && totalMembers > 0) {
      recommendations.push({
        icon: "gender-female",
        color: "#E91E63",
        text: `Female members only ${Math.round(
          (stats.genderStats.female / totalMembers) * 100
        )}%. Consider women-only classes or female trainer hiring.`,
        action: "Attract female members",
      });
    }

    // Age-group analysis (if age data were available)
    // This is a placeholder for when age data becomes available
    // if (averageAge > 40) {
    //   recommendations.push({
    //     icon: 'account-group',
    //     color: '#795548',
    //     text: `Majority members over 40. Add low-impact classes like yoga or swimming.`,
    //     action: 'Expand class variety'
    //   });
    // }

    // New member acquisition
    if (stats.statusStats.trial > 0) {
      const trialConversionRate =
        (stats.statusStats.active / stats.statusStats.trial) * 100;
      if (trialConversionRate < 50) {
        recommendations.push({
          icon: "account-plus",
          color: "#673AB7",
          text: `Trial conversion rate low (${Math.round(
            trialConversionRate
          )}%). Enhance onboarding with free trainer session and progress tracking.`,
          action: "Improve trial conversion",
        });
      }
    }

    return recommendations;
  };

  const stats = calculateStats();
  const recommendations = getBusinessRecommendations();

  const toggleChartExpansion = (chartName) => {
    setExpandedChart(expandedChart === chartName ? null : chartName);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Crunching the numbers...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={50} color="#F44336" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={fetchData} style={styles.retryButton}>
          <Feather name="refresh-cw" size={18} color="white" />
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons
            name="chart-areaspline"
            size={28}
            color="#4CAF50"
          />
          <Text style={styles.title}>Gym Analytics Dashboard</Text>
        </View>
        <TouchableOpacity onPress={fetchData} style={styles.refreshButton}>
          <Feather name="refresh-cw" size={20} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      {/* Time Range Selector */}
      <View style={styles.timeRangeSelector}>
        {["daily", "weekly", "monthly"].map((range) => (
          <TouchableOpacity
            key={range}
            onPress={() => setTimeRange(range)}
            style={[
              styles.timeButton,
              timeRange === range && styles.activeTimeButton,
            ]}
          >
            <MaterialIcons
              name={
                range === "daily"
                  ? "today"
                  : range === "weekly"
                  ? "date-range"
                  : "calendar-today"
              }
              size={16}
              color={timeRange === range ? "white" : "#888"}
            />
            <Text
              style={[
                styles.timeButtonText,
                timeRange === range && styles.activeTimeButtonText,
              ]}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: "#2D2D2D" }]}>
          <View style={styles.summaryIconContainer}>
            <FontAwesome name="users" size={20} color="#4CAF50" />
          </View>
          <Text style={styles.summaryTitle}>Total Members</Text>
          <Text style={styles.summaryValue}>{membersData.length}</Text>
          <Text style={styles.summaryTrend}>
            <AntDesign name="caretup" size={12} color="#4CAF50" /> 12% from last
            month
          </Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: "#2D2D2D" }]}>
          <View style={styles.summaryIconContainer}>
            <MaterialCommunityIcons
              name="account-check"
              size={20}
              color="#2196F3"
            />
          </View>
          <Text style={styles.summaryTitle}>Active Members</Text>
          <Text style={styles.summaryValue}>{stats.statusStats.active}</Text>
          <Text style={styles.summaryTrend}>
            <AntDesign name="caretup" size={12} color="#4CAF50" /> 8% from last
            month
          </Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: "#2D2D2D" }]}>
          <View style={styles.summaryIconContainer}>
            <FontAwesome name="rupee" size={20} color="#FF9800" />
          </View>
          <Text style={styles.summaryTitle}>Maintenance</Text>
          <Text style={styles.summaryValue}>₹{stats.maintenanceCost}</Text>
          <Text style={styles.summaryTrend}>
            <AntDesign name="caretdown" size={12} color="#F44336" /> 5% from
            last month
          </Text>
        </View>
      </View>

      {/* Business Boost Recommendations */}
      {recommendations.length > 0 && (
        <View style={styles.recommendationsContainer}>
          <View style={styles.sectionHeader}>
            <Ionicons name="rocket" size={20} color="#FFD700" />
            <Text style={styles.sectionTitle}>
              Business Boost Recommendations
            </Text>
          </View>

          {recommendations.map((rec, index) => (
            <TouchableOpacity key={index} style={styles.recommendationCard}>
              <View
                style={[
                  styles.recommendationIcon,
                  { backgroundColor: rec.color },
                ]}
              >
                <MaterialCommunityIcons
                  name={rec.icon}
                  size={18}
                  color="white"
                />
              </View>
              <View style={styles.recommendationTextContainer}>
                <Text style={styles.recommendationText}>{rec.text}</Text>
                <Text style={styles.recommendationAction}>{rec.action}</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#888" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Batch Distribution */}
      <TouchableOpacity
        style={styles.chartContainer}
        onPress={() => toggleChartExpansion("batch")}
        activeOpacity={0.9}
      >
        <View style={styles.chartHeader}>
          <View style={styles.chartTitleContainer}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={20}
              color="#4CAF50"
            />
            <Text style={styles.chartTitle}>Batch Distribution</Text>
          </View>
          <Feather
            name={expandedChart === "batch" ? "chevron-up" : "chevron-down"}
            size={20}
            color="#888"
          />
        </View>

        {expandedChart === "batch" && (
          <PieChart
            data={[
              {
                name: "Morning",
                population: stats.batchStats.morning,
                color: "#4CAF50",
                legendFontColor: "#FFFFFF",
                legendFontSize: 12,
              },
              {
                name: "Evening",
                population: stats.batchStats.evening,
                color: "#2196F3",
                legendFontColor: "#FFFFFF",
                legendFontSize: 12,
              },
            ]}
            width={screenWidth - 40}
            height={200}
            chartConfig={{
              backgroundColor: "#1E1E1E",
              backgroundGradientFrom: "#1E1E1E",
              backgroundGradientTo: "#1E1E1E",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        )}

        <View style={styles.chartInsight}>
          <Text style={styles.insightText}>
            {stats.batchStats.morning > stats.batchStats.evening * 1.5
              ? "Morning batch is significantly more popular (" +
                Math.round((stats.batchStats.morning / totalMembers) * 100) +
                "%). Consider:" +
                "\n• Adding more morning time slots\n• Offering evening-only membership discounts"
              : stats.batchStats.evening > stats.batchStats.morning * 1.5
              ? "Evening batch is significantly more popular (" +
                Math.round((stats.batchStats.evening / totalMembers) * 100) +
                "%). Consider:" +
                "\n• Promoting morning sessions with trainer incentives\n• Creating evening waitlist for premium spots"
              : "Good balance between batches. Maintain current scheduling strategy."}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Membership Status */}
      <TouchableOpacity
        style={styles.chartContainer}
        onPress={() => toggleChartExpansion("status")}
        activeOpacity={0.9}
      >
        <View style={styles.chartHeader}>
          <View style={styles.chartTitleContainer}>
            <MaterialCommunityIcons
              name="account-details"
              size={20}
              color="#2196F3"
            />
            <Text style={styles.chartTitle}>Membership Status</Text>
          </View>
          <Feather
            name={expandedChart === "status" ? "chevron-up" : "chevron-down"}
            size={20}
            color="#888"
          />
        </View>

        {expandedChart === "status" && (
          <BarChart
            data={{
              labels: ["Active", "Inactive", "Trial"],
              datasets: [
                {
                  data: [
                    stats.statusStats.active,
                    stats.statusStats.inactive,
                    stats.statusStats.trial,
                  ],
                },
              ],
            }}
            width={screenWidth - 40}
            height={220}
            yAxisLabel=""
            chartConfig={{
              backgroundColor: "#1E1E1E",
              backgroundGradientFrom: "#1E1E1E",
              backgroundGradientTo: "#1E1E1E",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            }}
            verticalLabelRotation={0}
          />
        )}

        <View style={styles.chartInsight}>
          <Text style={styles.insightText}>
            {stats.statusStats.inactive > 0
              ? `${stats.statusStats.inactive} inactive members. Consider re-engagement campaigns.`
              : "Great retention! All members are active."}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Gender Distribution */}
      <TouchableOpacity
        style={styles.chartContainer}
        onPress={() => toggleChartExpansion("gender")}
        activeOpacity={0.9}
      >
        <View style={styles.chartHeader}>
          <View style={styles.chartTitleContainer}>
            <MaterialCommunityIcons
              name="gender-male-female"
              size={20}
              color="#E91E63"
            />
            <Text style={styles.chartTitle}>Gender Distribution</Text>
          </View>
          <Feather
            name={expandedChart === "gender" ? "chevron-up" : "chevron-down"}
            size={20}
            color="#888"
          />
        </View>

        {expandedChart === "gender" && (
          <PieChart
            data={[
              {
                name: "Male",
                population: stats.genderStats.male,
                color: "#2196F3",
                legendFontColor: "#FFFFFF",
                legendFontSize: 12,
              },
              {
                name: "Female",
                population: stats.genderStats.female,
                color: "#E91E63",
                legendFontColor: "#FFFFFF",
                legendFontSize: 12,
              },
              {
                name: "Other",
                population: stats.genderStats.other,
                color: "#9C27B0",
                legendFontColor: "#FFFFFF",
                legendFontSize: 12,
              },
            ]}
            width={screenWidth - 40}
            height={200}
            chartConfig={{
              backgroundColor: "#1E1E1E",
              backgroundGradientFrom: "#1E1E1E",
              backgroundGradientTo: "#1E1E1E",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        )}

        <View style={styles.chartInsight}>
          <Text style={styles.insightText}>
            {stats.genderStats.female < membersData.length * 0.3
              ? "Low female membership. Consider women-focused programs."
              : "Good gender balance. Maintain inclusive marketing."}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Membership Plans */}
      <TouchableOpacity
        style={styles.chartContainer}
        onPress={() => toggleChartExpansion("plans")}
        activeOpacity={0.9}
      >
        <View style={styles.chartHeader}>
          <View style={styles.chartTitleContainer}>
            <MaterialIcons name="card-membership" size={20} color="#FF9800" />
            <Text style={styles.chartTitle}>Membership Plans</Text>
          </View>
          <Feather
            name={expandedChart === "plans" ? "chevron-up" : "chevron-down"}
            size={20}
            color="#888"
          />
        </View>

        {expandedChart === "plans" && (
          <BarChart
            data={{
              labels: ["Basic", "Premium", "VIP"],
              datasets: [
                {
                  data: [
                    stats.planStats.basic,
                    stats.planStats.premium,
                    stats.planStats.vip,
                  ],
                },
              ],
            }}
            width={screenWidth - 40}
            height={220}
            yAxisLabel=""
            chartConfig={{
              backgroundColor: "#1E1E1E",
              backgroundGradientFrom: "#1E1E1E",
              backgroundGradientTo: "#1E1E1E",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255, 193, 7, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            }}
            verticalLabelRotation={0}
          />
        )}

        <View style={styles.chartInsight}>
          <Text style={styles.insightText}>
            {stats.planStats.premium + stats.planStats.vip >
            stats.planStats.basic
              ? "Premium plans account for " +
                Math.round(
                  ((stats.planStats.premium + stats.planStats.vip) /
                    totalMembers) *
                    100
                ) +
                "% of members. Excellent revenue mix!"
              : "Basic plans dominate (" +
                Math.round((stats.planStats.basic / totalMembers) * 100) +
                "%). Strategies to upgrade:" +
                "\n• Highlight premium benefits at checkout\n• Offer free month of premium for 6-month commitment"}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Subscription Duration */}
      <TouchableOpacity
        style={styles.chartContainer}
        onPress={() => toggleChartExpansion("subscription")}
        activeOpacity={0.9}
      >
        <View style={styles.chartHeader}>
          <View style={styles.chartTitleContainer}>
            <MaterialCommunityIcons
              name="calendar-clock"
              size={20}
              color="#9C27B0"
            />
            <Text style={styles.chartTitle}>
              Subscription Duration (Months)
            </Text>
          </View>
          <Feather
            name={
              expandedChart === "subscription" ? "chevron-up" : "chevron-down"
            }
            size={20}
            color="#888"
          />
        </View>

        {expandedChart === "subscription" && renderHistogram()}

        <View style={styles.chartInsight}>
          <Text style={styles.insightText}>
            {stats.subscriptionMonths.filter((m) => m >= 6).length /
              membersData.length >
            0.5
              ? "Great loyalty! Over half of members stay 6+ months."
              : "Consider loyalty programs to increase retention beyond 6 months."}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Attendance Trend */}
      <TouchableOpacity
        style={styles.chartContainer}
        onPress={() => toggleChartExpansion("attendance")}
        activeOpacity={0.9}
      >
        <View style={styles.chartHeader}>
          <View style={styles.chartTitleContainer}>
            <MaterialCommunityIcons
              name="chart-line"
              size={20}
              color="#00BCD4"
            />
            <Text style={styles.chartTitle}>
              Attendance Trend ({timeRange})
            </Text>
          </View>
          <Feather
            name={
              expandedChart === "attendance" ? "chevron-up" : "chevron-down"
            }
            size={20}
            color="#888"
          />
        </View>

        {expandedChart === "attendance" && (
          <LineChart
            data={{
              labels: stats.attendanceStats[timeRange].map((item) =>
                timeRange === "daily"
                  ? moment(item.date).format("D MMM")
                  : timeRange === "weekly"
                  ? `Week ${moment(item.week).format("D MMM")}`
                  : moment(item.month).format("MMM YYYY")
              ),
              datasets: [
                {
                  data: stats.attendanceStats[timeRange].map(
                    (item) => item.count
                  ),
                  color: (opacity = 1) => `rgba(0, 188, 212, ${opacity})`,
                  strokeWidth: 2,
                },
              ],
            }}
            width={screenWidth - 40}
            height={220}
            yAxisLabel=""
            chartConfig={{
              backgroundColor: "#1E1E1E",
              backgroundGradientFrom: "#1E1E1E",
              backgroundGradientTo: "#1E1E1E",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              propsForDots: {
                r: "4",
                strokeWidth: "2",
                stroke: "#00BCD4",
              },
            }}
            bezier
          />
        )}

        <View style={styles.chartInsight}>
          <Text style={styles.insightText}>
            {timeRange === "daily"
              ? "Peak days: " +
                stats.attendanceStats.daily
                  .slice()
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 2)
                  .map((d) => moment(d.date).format("ddd"))
                  .join(", ")
              : timeRange === "weekly"
              ? "Busiest weeks show " +
                Math.max(...stats.attendanceStats.weekly.map((w) => w.count)) +
                " visits"
              : "Monthly average: " +
                Math.round(
                  stats.attendanceStats.monthly.reduce(
                    (sum, m) => sum + m.count,
                    0
                  ) / stats.attendanceStats.monthly.length
                ) +
                " visits/month"}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Maintenance Cost Over Time */}
      <TouchableOpacity
        style={styles.chartContainer}
        onPress={() => toggleChartExpansion("maintenance")}
        activeOpacity={0.9}
      >
        <View style={styles.chartHeader}>
          <View style={styles.chartTitleContainer}>
            <MaterialCommunityIcons name="tools" size={20} color="#FF5722" />
            <Text style={styles.chartTitle}>Maintenance Cost Over Time</Text>
          </View>
          <Feather
            name={
              expandedChart === "maintenance" ? "chevron-up" : "chevron-down"
            }
            size={20}
            color="#888"
          />
        </View>

        {expandedChart === "maintenance" && (
          <LineChart
            data={{
              labels: maintenanceData.map((item) =>
                moment(item.createdAt).format("MMM YYYY")
              ),
              datasets: [
                {
                  data: maintenanceData.map((item) => item.cost),
                  color: (opacity = 1) => `rgba(255, 87, 34, ${opacity})`,
                  strokeWidth: 2,
                },
              ],
            }}
            width={screenWidth - 40}
            height={220}
            yAxisLabel="₹"
            chartConfig={{
              backgroundColor: "#1E1E1E",
              backgroundGradientFrom: "#1E1E1E",
              backgroundGradientTo: "#1E1E1E",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              propsForDots: {
                r: "4",
                strokeWidth: "2",
                stroke: "#FF5722",
              },
            }}
            bezier
          />
        )}

        <View style={styles.chartInsight}>
          <Text style={styles.insightText}>
            {stats.maintenanceCost > membersData.length * 500
              ? "High maintenance costs. Consider preventive maintenance scheduling."
              : "Maintenance costs are well managed. Keep up the good work!"}
          </Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    padding: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginLeft: 10,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#2D2D2D",
  },
  timeRangeSelector: {
    flexDirection: "row",
    backgroundColor: "#2D2D2D",
    borderRadius: 20,
    padding: 5,
    marginBottom: 15,
  },
  timeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  activeTimeButton: {
    backgroundColor: "#4CAF50",
  },
  timeButtonText: {
    color: "#888",
    fontSize: 14,
    marginLeft: 5,
  },
  activeTimeButtonText: {
    color: "white",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  summaryCard: {
    borderRadius: 12,
    padding: 15,
    width: "32%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  summaryIconContainer: {
    backgroundColor: "#1E1E1E",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  summaryTitle: {
    fontSize: 12,
    color: "#AAAAAA",
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  summaryTrend: {
    fontSize: 10,
    color: "#AAAAAA",
    marginTop: 5,
  },
  recommendationsContainer: {
    backgroundColor: "#2D2D2D",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginLeft: 10,
  },
  recommendationCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#3D3D3D",
  },
  recommendationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  recommendationTextContainer: {
    flex: 1,
  },
  recommendationText: {
    fontSize: 14,
    color: "#FFFFFF",
    marginBottom: 3,
  },
  recommendationAction: {
    fontSize: 12,
    color: "#4CAF50",
  },
  chartContainer: {
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  chartTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginLeft: 10,
  },
  chartInsight: {
    backgroundColor: "#2D2D2D",
    borderRadius: 8,
    padding: 12,
    marginTop: 15,
  },
  insightText: {
    fontSize: 13,
    color: "#FFFFFF",
    lineHeight: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  loadingText: {
    color: "#FFFFFF",
    marginTop: 15,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#121212",
  },
  errorText: {
    fontSize: 16,
    color: "#F44336",
    marginBottom: 20,
    textAlign: "center",
  },
  retryButton: {
    flexDirection: "row",
    backgroundColor: "#4CAF50",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  retryText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 8,
  },
});

export default AnalyticsDashboard;
