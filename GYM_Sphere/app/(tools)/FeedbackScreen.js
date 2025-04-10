import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  RefreshControl, 
  Alert,
  ActivityIndicator,
  FlatList,
  Modal,
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';


const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000/api";


const FeedbackListScreen = () => {
  const [feedback, setFeedback] = useState([]);
  const [filteredFeedback, setFilteredFeedback] = useState([]);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const modalAnim = useRef(new Animated.Value(0)).current;



  const [selectedFeedback, setSelectedFeedback] = useState(null);


  const navigation = useNavigation();

  const handleSelectFeedback = (feedbackItem) => {
    setSelectedFeedback(feedbackItem);
    // Start the modal animation
    modalAnim.setValue(0);
    Animated.timing(modalAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleCloseModal = () => {
    Animated.timing(modalAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setSelectedFeedback(null));
  };

  const modalTranslateY = modalAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Dimensions.get('window').height, 0],
  });

  const modalOpacity = modalAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const fetchMembers = async () => {
    try {
      setIsLoading(true);
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
        throw new Error(data.message || "Invalid data format");
      }
      setMembers(data);
    } catch (err) {
      console.error("Error fetching members:", err);
      Alert.alert("Error", err.message || "Failed to load members");
      setMembers([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const fetchFeedback = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");
      
      const response = await fetch(`${API_BASE_URL}/feedback`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      if (response.ok) {
        const memberPhones = members.map(m => m.phone);
        const feedbackWithMemberData = data.data
          .filter(fb => fb.member?.phone && memberPhones.includes(fb.member.phone))
          .map(fb => {
            const member = members.find(m => m.phone === fb.member.phone);
            return {
              ...fb,
              member: {
                phone: fb.member.phone,
                name: member?.name || 'Anonymous',
                email: member?.email,
                profilePic: member?.profilePic ? 
                  { uri: member.profilePic } : 
                  getAvatarSource(member?.name)
              }
            };
          });
        
        setFeedback(feedbackWithMemberData);
        setFilteredFeedback(feedbackWithMemberData);
      } else {
        throw new Error(data.message || "Failed to fetch feedback");
      }
    } catch (error) {
      console.error("Error fetching feedback:", error);
      Alert.alert("Error", error.message || "Failed to load feedback");
    }
  };

  const getAvatarSource = (name) => {
    return { uri: `https://api.dicebear.com/7.x/initials/png?seed=${encodeURIComponent(name)}&size=100&background=1E88E5&color=fff` };
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/feedback/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (response.ok) {
        fetchFeedback();
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to update status");
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const handleDelete = async (id) => {
    Alert.alert(
      "Delete Feedback",
      "Are you sure you want to delete this feedback?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Delete", 
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token");
              const response = await fetch(`${API_BASE_URL}/feedback/${id}`, {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });
              
              if (response.ok) {
                fetchFeedback();
              } else {
                const error = await response.json();
                throw new Error(error.message || "Failed to delete feedback");
              }
            } catch (error) {
              Alert.alert("Error", error.message);
            }
          }
        }
      ]
    );
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMembers().then(fetchFeedback);
  }, []);

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    if (members.length > 0) {
      fetchFeedback();
    }
  }, [members]);

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredFeedback(feedback);
    } else {
      setFilteredFeedback(feedback.filter(item => item.status === statusFilter));
    }
  }, [statusFilter, feedback]);

  const renderFeedbackCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <Image 
            source={item.member.profilePic} 
            style={styles.avatar} 
          />
          <View>
            <Text style={styles.userName}>{item.member.name}</Text>
            <Text style={styles.userPhone}>{item.member.phone}</Text>
          </View>
        </View>
        
        <View style={[styles.statusBadge, 
          item.status === 'pending' && styles.statusPending,
          item.status === 'reviewed' && styles.statusReviewed,
          item.status === 'archived' && styles.statusArchived
        ]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      
      <View style={styles.ratingsContainer}>
        <View style={styles.ratingItem}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.ratingText}>{item.ratings.overall}/5</Text>
        </View>
        <Text style={styles.recommendationText}>
          {item.recommendation === 'yes' ? 'Recommends' : 
           item.recommendation === 'no' ? 'Does not recommend' : 'Unsure'}
        </Text>
      </View>
      
      {item.feedback.comments && (
        <Text style={styles.commentText} numberOfLines={2}>
          "{item.feedback.comments}"
        </Text>
      )}
      
      <View style={styles.cardFooter}>
      <TouchableOpacity 
          style={styles.detailsButton}
          onPress={() => handleSelectFeedback(item)}
        >
          <Text style={styles.detailsButtonText}>View Details</Text>
        </TouchableOpacity>
        
        <View style={styles.actionButtons}>
          {item.status !== 'reviewed' && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleStatusChange(item._id, 'reviewed')}
            >
              <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
            </TouchableOpacity>
          )}
          
          {item.status !== 'archived' && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleStatusChange(item._id, 'archived')}
            >
              <MaterialIcons name="archive" size={24} color="#FF9800" />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleDelete(item._id)}
          >
            <MaterialIcons name="delete" size={24} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (isLoading && feedback.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  const renderFeedbackDetailModal = () => {
    if (!selectedFeedback) return null;

    return (
      <Modal
        transparent
        visible={!!selectedFeedback}
        onRequestClose={handleCloseModal}
        animationType="none" // We're handling animation manually
      >
        <Animated.View style={[styles.modalOverlay, { opacity: modalOpacity }]}>
          <Animated.View 
            style={[
              styles.modalContent,
              { transform: [{ translateY: modalTranslateY }] }
            ]}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Feedback Details</Text>
              <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            <ScrollView contentContainerStyle={styles.modalScrollContent}>
              {/* Member Info */}
              <View style={styles.detailSection}>
                <View style={styles.userInfo}>
                  <Image 
                    source={selectedFeedback.member.profilePic} 
                    style={styles.detailAvatar} 
                  />
                  <View>
                    <Text style={styles.detailUserName}>{selectedFeedback.member.name}</Text>
                    <Text style={styles.detailUserInfo}>{selectedFeedback.member.phone}</Text>
                    {selectedFeedback.member.email && (
                      <Text style={styles.detailUserInfo}>{selectedFeedback.member.email}</Text>
                    )}
                  </View>
                </View>
              </View>
              
              {/* Ratings */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Ratings</Text>
                <View style={styles.ratingsGrid}>
                  {Object.entries(selectedFeedback.ratings).map(([key, value]) => (
                    <View key={key} style={styles.ratingRow}>
                      <Text style={styles.ratingLabel}>
                        {key.charAt(0).toUpperCase() + key.slice(1)}:
                      </Text>
                      <View style={styles.starsContainer}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Ionicons
                            key={star}
                            name={star <= value ? 'star' : 'star-outline'}
                            size={20}
                            color="#FFD700"
                          />
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
              
              {/* Feedback Comments */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Feedback</Text>
                {selectedFeedback.feedback.likes && (
                  <View style={styles.commentBlock}>
                    <Text style={styles.commentLabel}>What they liked:</Text>
                    <Text style={styles.commentText}>{selectedFeedback.feedback.likes}</Text>
                  </View>
                )}
                
                {selectedFeedback.feedback.improvements && (
                  <View style={styles.commentBlock}>
                    <Text style={styles.commentLabel}>Improvements suggested:</Text>
                    <Text style={styles.commentText}>{selectedFeedback.feedback.improvements}</Text>
                  </View>
                )}
                
                {selectedFeedback.feedback.comments && (
                  <View style={styles.commentBlock}>
                    <Text style={styles.commentLabel}>Additional comments:</Text>
                    <Text style={styles.commentText}>{selectedFeedback.feedback.comments}</Text>
                  </View>
                )}
              </View>
              
              {/* Recommendation */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Recommendation</Text>
                <View style={[
                  styles.recommendationBadge,
                  selectedFeedback.recommendation === 'yes' && styles.recommendationYes,
                  selectedFeedback.recommendation === 'no' && styles.recommendationNo,
                  selectedFeedback.recommendation === 'maybe' && styles.recommendationMaybe,
                ]}>
                  <Text style={styles.recommendationText}>
                    {selectedFeedback.recommendation === 'yes' ? 'Recommends' : 
                     selectedFeedback.recommendation === 'no' ? 'Does not recommend' : 
                     'Unsure about recommending'}
                  </Text>
                </View>
              </View>
              
              {/* Evidence */}
              {selectedFeedback.evidence?.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Attachments ({selectedFeedback.evidence.length})</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {selectedFeedback.evidence.map((file, index) => (
                      <View key={index} style={styles.evidenceItem}>
                        <MaterialIcons name="insert-photo" size={40} color="#6C63FF" />
                        <Text style={styles.evidenceText} numberOfLines={1}>{file.filename}</Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
              
              {/* Dates */}
              <View style={styles.detailSection}>
                <View style={styles.dateRow}>
                  <Text style={styles.dateLabel}>Submitted:</Text>
                  <Text style={styles.dateText}>
                    {new Date(selectedFeedback.createdAt).toLocaleString()}
                  </Text>
                </View>
                {selectedFeedback.updatedAt && (
                  <View style={styles.dateRow}>
                    <Text style={styles.dateLabel}>Last Updated:</Text>
                    <Text style={styles.dateText}>
                      {new Date(selectedFeedback.updatedAt).toLocaleString()}
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Member Feedback</Text>
        <View style={styles.headerRight} />
      </View>
      
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, statusFilter === 'all' && styles.filterButtonActive]}
          onPress={() => setStatusFilter('all')}
        >
          <Text style={styles.filterButtonText}>All</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterButton, statusFilter === 'pending' && styles.filterButtonActive]}
          onPress={() => setStatusFilter('pending')}
        >
          <Text style={styles.filterButtonText}>Pending</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterButton, statusFilter === 'reviewed' && styles.filterButtonActive]}
          onPress={() => setStatusFilter('reviewed')}
        >
          <Text style={styles.filterButtonText}>Reviewed</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterButton, statusFilter === 'archived' && styles.filterButtonActive]}
          onPress={() => setStatusFilter('archived')}
        >
          <Text style={styles.filterButtonText}>Archived</Text>
        </TouchableOpacity>
      </View>
      
      {filteredFeedback.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#6C63FF']}
              tintColor="#6C63FF"
            />
          }
        >
          <Ionicons name="document-text-outline" size={60} color="#555" />
          <Text style={styles.emptyText}>No feedback found</Text>
          <Text style={styles.emptySubText}>Pull down to refresh</Text>
        </ScrollView>
      ) : (
        <FlatList
          data={filteredFeedback}
          renderItem={renderFeedbackCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#6C63FF']}
              tintColor="#6C63FF"
            />
          }
        />
      )}
      {renderFeedbackDetailModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerRight: {
    width: 40,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#333',
  },
  filterButtonActive: {
    backgroundColor: '#6C63FF',
  },
  filterButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 18,
    marginTop: 16,
  },
  emptySubText: {
    color: '#888',
    fontSize: 14,
    marginTop: 8,
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  userPhone: {
    color: '#888',
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPending: {
    backgroundColor: 'rgb(255, 213, 0)',
  },
  statusReviewed: {
    backgroundColor: 'rgb(1, 255, 9)',
  },
  statusArchived: {
    backgroundColor: 'rgb(249, 158, 0)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ratingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  ratingText: {
    color: '#FFFFFF',
    marginLeft: 4,
    fontSize: 14,
  },
  recommendationText: {
    color: '#6C63FF',
    fontSize: 14,
    fontWeight: '500',
  },
  commentText: {
    color: '#DDD',
    fontSize: 14,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 12,
  },
  detailsButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#6C63FF',
  },
  detailsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: 12,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: Dimensions.get('window').height * 0.85,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  modalScrollContent: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  detailUserName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  detailUserInfo: {
    color: '#AAAAAA',
    fontSize: 14,
    marginTop: 4,
  },
  sectionTitle: {
    color: '#6C63FF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
  },
  ratingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  ratingRow: {
    width: '48%',
    marginBottom: 12,
  },
  ratingLabel: {
    color: '#DDD',
    fontSize: 14,
    marginBottom: 5,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  commentBlock: {
    marginBottom: 15,
  },
  commentLabel: {
    color: '#6C63FF',
    fontSize: 14,
    marginBottom: 5,
  },
  commentText: {
    color: '#DDD',
    fontSize: 14,
    lineHeight: 20,
  },
  recommendationBadge: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  recommendationYes: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  recommendationNo: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
  },
  recommendationMaybe: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
  },
  recommendationText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  evidenceItem: {
    width: 100,
    alignItems: 'center',
    marginRight: 15,
    padding: 10,
    backgroundColor: '#252525',
    borderRadius: 8,
  },
  evidenceText: {
    color: '#AAA',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dateLabel: {
    color: '#AAA',
    fontSize: 14,
  },
  dateText: {
    color: '#FFF',
    fontSize: 14,
  },
});

export default FeedbackListScreen;