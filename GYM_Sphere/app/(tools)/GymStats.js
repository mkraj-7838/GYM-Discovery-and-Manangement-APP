import { StyleSheet, Text, View, ScrollView, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import React, { useState, useEffect } from 'react';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { MaterialIcons, Feather, FontAwesome, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000/api";
const screenWidth = Dimensions.get('window').width;

const GymStats = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('monthly');
  const [membersData, setMembersData] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [maintenanceData, setMaintenanceData] = useState([]);
  const [expandedChart, setExpandedChart] = useState(null);

  // Chart config
  const chartConfig = {
    backgroundColor: '#121212',
    backgroundGradientFrom: '#1E1E1E',
    backgroundGradientTo: '#121212',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#ffa726',
    },
  };

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const [membersRes, attendanceRes, maintenanceRes] = await Promise.all([
        fetch(`${API_BASE_URL}/user/members`, { headers }),
        fetch(`${API_BASE_URL}/attendance/all`, { headers }),
        fetch(`${API_BASE_URL}/user/maintenance`, { headers })
      ]);

      if (!membersRes.ok || !attendanceRes.ok || !maintenanceRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [members, attendance, maintenance] = await Promise.all([
        membersRes.json(),
        attendanceRes.json(),
        maintenanceRes.json()
      ]);

      setMembersData(members);
      setAttendanceData(attendance);
      setMaintenanceData(maintenance);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching data:', err);
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
        attendanceStats: { daily: [], weekly: [], monthly: [] }
      };
    }

    // Member statistics
    const batchStats = {
      morning: membersData.filter(m => m.batch === 'morning').length,
      evening: membersData.filter(m => m.batch === 'evening').length
    };

    const statusStats = {
      active: membersData.filter(m => m.status === 'active').length,
      inactive: membersData.filter(m => m.status === 'inactive').length,
      trial: membersData.filter(m => m.status === 'trial').length
    };

    const genderStats = {
      male: membersData.filter(m => m.gender === 'male').length,
      female: membersData.filter(m => m.gender === 'female').length,
      other: membersData.filter(m => m.gender === 'other').length
    };

    const planStats = {
      basic: membersData.filter(m => m.membershipPlan === 'basic').length,
      premium: membersData.filter(m => m.membershipPlan === 'premium').length,
      vip: membersData.filter(m => m.membershipPlan === 'vip').length
    };

    const subscriptionMonths = membersData.map(m => m.monthsOfSubscription || 0);

    // Maintenance statistics
    const maintenanceCost = maintenanceData.reduce((sum, item) => sum + (item.cost || 0), 0);

    // Attendance statistics
    const attendanceByDate = {};
    attendanceData.forEach(item => {
      const date = moment(item.date).format('YYYY-MM-DD');
      attendanceByDate[date] = (attendanceByDate[date] || 0) + 1;
    });

    const attendanceStats = {
      daily: Object.entries(attendanceByDate).map(([date, count]) => ({ date, count })),
      weekly: groupByWeek(attendanceData),
      monthly: groupByMonth(attendanceData)
    };

    return {
      batchStats,
      statusStats,
      genderStats,
      planStats,
      subscriptionMonths,
      maintenanceCost,
      attendanceStats
    };
  };

  // Helper functions for grouping attendance data
  const groupByWeek = (data) => {
    const weeklyData = {};
    data.forEach(item => {
      const week = moment(item.date).startOf('week').format('YYYY-MM-DD');
      weeklyData[week] = (weeklyData[week] || 0) + 1;
    });
    return Object.entries(weeklyData).map(([week, count]) => ({ week, count }));
  };

  const groupByMonth = (data) => {
    const monthlyData = {};
    data.forEach(item => {
      const month = moment(item.date).startOf('month').format('YYYY-MM');
      monthlyData[month] = (monthlyData[month] || 0) + 1;
    });
    return Object.entries(monthlyData).map(([month, count]) => ({ month, count }));
  };

  // Render attendance trend chart
  const renderAttendanceTrend = () => {
    const stats = calculateStats();
    const data = timeRange === 'daily' 
      ? stats.attendanceStats.daily.slice(-7).map(item => item.count)
      : timeRange === 'weekly' 
        ? stats.attendanceStats.weekly.slice(-8).map(item => item.count)
        : stats.attendanceStats.monthly.slice(-6).map(item => item.count);

    const labels = timeRange === 'daily' 
      ? stats.attendanceStats.daily.slice(-7).map(item => moment(item.date).format('DD MMM'))
      : timeRange === 'weekly' 
        ? stats.attendanceStats.weekly.slice(-8).map(item => moment(item.week).format('DD MMM'))
        : stats.attendanceStats.monthly.slice(-6).map(item => moment(item.month).format('MMM YY'));

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <View style={styles.chartTitleContainer}>
            <MaterialIcons name="trending-up" size={20} color="#4CAF50" />
            <Text style={styles.chartTitle}>Attendance Trend</Text>
          </View>
          <View style={styles.timeRangeSelector}>
            <TouchableOpacity 
              onPress={() => setTimeRange('daily')} 
              style={[styles.timeRangeButton, timeRange === 'daily' && styles.activeTimeRange]}
            >
              <Text style={styles.timeRangeText}>Daily</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setTimeRange('weekly')} 
              style={[styles.timeRangeButton, timeRange === 'weekly' && styles.activeTimeRange]}
            >
              <Text style={styles.timeRangeText}>Weekly</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setTimeRange('monthly')} 
              style={[styles.timeRangeButton, timeRange === 'monthly' && styles.activeTimeRange]}
            >
              <Text style={styles.timeRangeText}>Monthly</Text>
            </TouchableOpacity>
          </View>
        </View>
        <LineChart
          data={{
            labels: labels,
            datasets: [{ data }]
          }}
          width={screenWidth - 40}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>
    );
  };

  // Render member batch distribution
  const renderBatchDistribution = () => {
    const stats = calculateStats();
    const data = [
      {
        name: "Morning",
        population: stats.batchStats.morning,
        color: "#FFA726",
        legendFontColor: "#FFF",
        legendFontSize: 12
      },
      {
        name: "Evening",
        population: stats.batchStats.evening,
        color: "#4CAF50",
        legendFontColor: "#FFF",
        legendFontSize: 12
      }
    ];

    return (
      <TouchableOpacity 
        style={styles.chartContainer} 
        onPress={() => toggleChartExpansion('batch')}
      >
        <View style={styles.chartHeader}>
          <View style={styles.chartTitleContainer}>
            <Ionicons name="time-outline" size={20} color="#FFA726" />
            <Text style={styles.chartTitle}>Batch Distribution</Text>
          </View>
          <Feather 
            name={expandedChart === 'batch' ? "minimize-2" : "maximize-2"} 
            size={18} 
            color="#888" 
          />
        </View>
        <PieChart
          data={data}
          width={screenWidth - 40}
          height={expandedChart === 'batch' ? 300 : 180}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
          style={styles.chart}
        />
      </TouchableOpacity>
    );
  };

  // Render membership plan distribution
  const renderPlanDistribution = () => {
    const stats = calculateStats();
    const data = [
      {
        name: "Basic",
        population: stats.planStats.basic,
        color: "#2196F3",
        legendFontColor: "#FFF",
        legendFontSize: 12
      },
      {
        name: "Premium",
        population: stats.planStats.premium,
        color: "#4CAF50",
        legendFontColor: "#FFF",
        legendFontSize: 12
      },
      {
        name: "VIP",
        population: stats.planStats.vip,
        color: "#FFC107",
        legendFontColor: "#FFF",
        legendFontSize: 12
      }
    ];

    return (
      <TouchableOpacity 
        style={styles.chartContainer} 
        onPress={() => toggleChartExpansion('plans')}
      >
        <View style={styles.chartHeader}>
          <View style={styles.chartTitleContainer}>
            <FontAwesome name="diamond" size={18} color="#2196F3" />
            <Text style={styles.chartTitle}>Membership Plans</Text>
          </View>
          <Feather 
            name={expandedChart === 'plans' ? "minimize-2" : "maximize-2"} 
            size={18} 
            color="#888" 
          />
        </View>
        <PieChart
          data={data}
          width={screenWidth - 40}
          height={expandedChart === 'plans' ? 300 : 180}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
          style={styles.chart}
        />
      </TouchableOpacity>
    );
  };

  // Render member status distribution
  const renderStatusDistribution = () => {
    const stats = calculateStats();
    const data = [
      {
        name: "Active",
        population: stats.statusStats.active,
        color: "#4CAF50",
        legendFontColor: "#FFF",
        legendFontSize: 12
      },
      {
        name: "Inactive",
        population: stats.statusStats.inactive,
        color: "#F44336",
        legendFontColor: "#FFF",
        legendFontSize: 12
      },
      {
        name: "Trial",
        population: stats.statusStats.trial,
        color: "#FFC107",
        legendFontColor: "#FFF",
        legendFontSize: 12
      }
    ];

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <View style={styles.chartTitleContainer}>
            <MaterialIcons name="people-alt" size={20} color="#4CAF50" />
            <Text style={styles.chartTitle}>Member Status</Text>
          </View>
        </View>
        <PieChart
          data={data}
          width={screenWidth - 40}
          height={180}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
          style={styles.chart}
        />
      </View>
    );
  };

  // Render subscription duration histogram
  const renderSubscriptionHistogram = () => {
    const stats = calculateStats();
    const monthCounts = {};
    
    stats.subscriptionMonths.forEach(months => {
      monthCounts[months] = (monthCounts[months] || 0) + 1;
    });

    const labels = Object.keys(monthCounts).sort((a, b) => a - b);
    const data = labels.map(label => monthCounts[label]);

    return (
      <TouchableOpacity 
        style={styles.chartContainer} 
        onPress={() => toggleChartExpansion('subscription')}
      >
        <View style={styles.chartHeader}>
          <View style={styles.chartTitleContainer}>
            <MaterialIcons name="calendar-today" size={18} color="#9C27B0" />
            <Text style={styles.chartTitle}>Subscription Duration (Months)</Text>
          </View>
          <Feather 
            name={expandedChart === 'subscription' ? "minimize-2" : "maximize-2"} 
            size={18} 
            color="#888" 
          />
        </View>
        <BarChart
          data={{
            labels: labels,
            datasets: [{ data }]
          }}
          width={screenWidth - 40}
          height={expandedChart === 'subscription' ? 300 : 220}
          yAxisLabel=""
          chartConfig={chartConfig}
          verticalLabelRotation={0}
          fromZero
          style={styles.chart}
        />
      </TouchableOpacity>
    );
  };

  // Render gender distribution
  const renderGenderDistribution = () => {
    const stats = calculateStats();
    const data = [
      {
        name: "Male",
        population: stats.genderStats.male,
        color: "#2196F3",
        legendFontColor: "#FFF",
        legendFontSize: 12
      },
      {
        name: "Female",
        population: stats.genderStats.female,
        color: "#E91E63",
        legendFontColor: "#FFF",
        legendFontSize: 12
      },
      {
        name: "Other",
        population: stats.genderStats.other,
        color: "#9C27B0",
        legendFontColor: "#FFF",
        legendFontSize: 12
      }
    ];

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <View style={styles.chartTitleContainer}>
            <MaterialIcons name="people" size={20} color="#2196F3" />
            <Text style={styles.chartTitle}>Gender Distribution</Text>
          </View>
        </View>
        <PieChart
          data={data}
          width={screenWidth - 40}
          height={180}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
          style={styles.chart}
        />
      </View>
    );
  };

  // Render maintenance cost
  const renderMaintenanceCost = () => {
    const stats = calculateStats();
    const maintenanceByMonth = {};
    
    maintenanceData.forEach(item => {
      const month = moment(item.date).format('MMM YY');
      maintenanceByMonth[month] = (maintenanceByMonth[month] || 0) + (item.cost || 0);
    });

    const labels = Object.keys(maintenanceByMonth);
    const data = labels.map(label => maintenanceByMonth[label]);

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <View style={styles.chartTitleContainer}>
            <MaterialIcons name="handyman" size={20} color="#FF9800" />
            <Text style={styles.chartTitle}>Maintenance Costs</Text>
          </View>
        </View>
        <BarChart
          data={{
            labels: labels,
            datasets: [{ data }]
          }}
          width={screenWidth - 40}
          height={220}
          yAxisLabel="$"
          chartConfig={{
            ...chartConfig,
            color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
          }}
          verticalLabelRotation={30}
          fromZero
          style={styles.chart}
        />
      </View>
    );
  };

  // Render key metrics cards
  const renderKeyMetrics = () => {
    const stats = calculateStats();
    const totalMembers = membersData.length;
    const avgAttendance = attendanceData.length / 30; // Average per day (30 days)
    const revenue = membersData.reduce((sum, member) => sum + (member.monthlyFee || 0), 0);

    return (
      <View style={styles.metricsContainer}>
        <View style={styles.metricCard}>
          <View style={[styles.metricIcon, { backgroundColor: 'rgba(76, 175, 80, 0.2)' }]}>
            <MaterialIcons name="people" size={24} color="#4CAF50" />
          </View>
          <Text style={styles.metricValue}>{totalMembers}</Text>
          <Text style={styles.metricLabel}>Total Members</Text>
        </View>
        
        <View style={styles.metricCard}>
          <View style={[styles.metricIcon, { backgroundColor: 'rgba(33, 150, 243, 0.2)' }]}>
            <MaterialIcons name="directions-run" size={24} color="#2196F3" />
          </View>
          <Text style={styles.metricValue}>{avgAttendance.toFixed(1)}</Text>
          <Text style={styles.metricLabel}>Avg Daily Attendance</Text>
        </View>
        
        <View style={styles.metricCard}>
          <View style={[styles.metricIcon, { backgroundColor: 'rgba(255, 193, 7, 0.2)' }]}>
            <MaterialIcons name="attach-money" size={24} color="#FFC107" />
          </View>
          <Text style={styles.metricValue}>${revenue.toLocaleString()}</Text>
          <Text style={styles.metricLabel}>Monthly Revenue</Text>
        </View>
      </View>
    );
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
      <Text style={styles.header}>Gym Statistics Dashboard</Text>
      
      {renderKeyMetrics()}
      {renderAttendanceTrend()}
      {renderBatchDistribution()}
      {renderPlanDistribution()}
      {renderStatusDistribution()}
      {renderGenderDistribution()}
      {renderSubscriptionHistogram()}
      {renderMaintenanceCost()}
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Last updated: {moment().format('MMM D, YYYY h:mm A')}</Text>
      </View>
    </ScrollView>
  );
};

export default GymStats;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 20,
  },
  header: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  metricCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 15,
    width: '30%',
    alignItems: 'center',
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricValue: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricLabel: {
    color: '#AAA',
    fontSize: 12,
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  chartTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  timeRangeSelector: {
    flexDirection: 'row',
    backgroundColor: '#2D2D2D',
    borderRadius: 8,
    padding: 2,
  },
  timeRangeButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  activeTimeRange: {
    backgroundColor: '#4CAF50',
  },
  timeRangeText: {
    color: '#FFF',
    fontSize: 12,
  },
  chart: {
    borderRadius: 8,
    marginTop: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingText: {
    color: '#FFF',
    marginTop: 15,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
    padding: 20,
  },
  errorText: {
    color: '#F44336',
    fontSize: 16,
    marginTop: 15,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 20,
    alignItems: 'center',
  },
  retryText: {
    color: '#FFF',
    marginLeft: 8,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    color: '#666',
    fontSize: 12,
  },
});