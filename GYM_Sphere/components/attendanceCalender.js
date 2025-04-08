import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000/api";

const AttendanceCalendar = ({ memberId }) => {
  const [currentMonth, setCurrentMonth] = useState(moment());
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/attendance/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch attendance data');
      }

      const data = await response.json();
      // Filter data for the specific member and current month
      const filteredData = data.filter(item => 
        item.memberId === memberId && 
        moment(item.date).month() === currentMonth.month() &&
        moment(item.date).year() === currentMonth.year()
      );
      
      setAttendanceData(filteredData);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, [memberId, currentMonth]);

  const changeMonth = (months) => {
    setCurrentMonth(moment(currentMonth).add(months, 'month'));
  };

  const renderCalendarHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => changeMonth(-1)}>
        <AntDesign name="left" size={20} color="#333" />
      </TouchableOpacity>
      
      <Text style={styles.monthText}>
        {currentMonth.format('MMMM YYYY')}
      </Text>
      
      <TouchableOpacity onPress={() => changeMonth(1)}>
        <AntDesign name="right" size={20} color="#333" />
      </TouchableOpacity>
    </View>
  );

  const renderDayNames = () => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <View style={styles.dayNames}>
        {dayNames.map(day => (
          <Text key={day} style={styles.dayName}>{day}</Text>
        ))}
      </View>
    );
  };

  const renderCalendarDays = () => {
    const monthStart = moment(currentMonth).startOf('month');
    const monthEnd = moment(currentMonth).endOf('month');
    const startDate = moment(monthStart).startOf('week');
    const endDate = moment(monthEnd).endOf('week');
    
    const days = [];
    let day = startDate;
    
    while (day <= endDate) {
      days.push(day);
      day = moment(day).add(1, 'day');
    }

    // Get present dates
    const presentDates = attendanceData
      .filter(item => item.attendanceStatus === 'Present')
      .map(item => moment(item.date).date());

    return (
      <View style={styles.daysContainer}>
        {days.map((date, i) => {
          const isCurrentMonth = date.month() === currentMonth.month();
          const isPresent = isCurrentMonth && presentDates.includes(date.date());
          
          return (
            <View 
              key={i} 
              style={[
                styles.dayContainer,
                !isCurrentMonth && styles.nonMonthDay,
                isPresent && styles.presentDay
              ]}
            >
              <Text style={[
                styles.dayText,
                !isCurrentMonth && styles.nonMonthDayText,
                isPresent && styles.presentDayText
              ]}>
                {date.date()}
              </Text>
              {isPresent && (
                <View style={styles.presentIndicator}>
                  <AntDesign name="check" size={12} color="white" />
                </View>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#4CAF50" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={fetchAttendanceData}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderCalendarHeader()}
      {renderDayNames()}
      {renderCalendarDays()}
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <View style={[styles.statIndicator, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.statText}>Present: {
            attendanceData.filter(item => item.attendanceStatus === 'Present').length
          } days</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  dayNames: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  dayName: {
    width: 32,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
    borderRadius: 16,
  },
  dayText: {
    fontSize: 14,
    color: '#333',
  },
  nonMonthDay: {
    opacity: 0.3,
  },
  nonMonthDayText: {
    color: '#999',
  },
  presentDay: {
    backgroundColor: '#4CAF50',
  },
  presentDayText: {
    color: 'white',
    fontWeight: 'bold',
  },
  presentIndicator: {
    position: 'absolute',
    bottom: 2,
  },
  statsContainer: {
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  statIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statText: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#F44336',
    marginBottom: 10,
  },
  retryText: {
    color: '#1A73E8',
    fontWeight: 'bold',
  },
});

export default AttendanceCalendar;