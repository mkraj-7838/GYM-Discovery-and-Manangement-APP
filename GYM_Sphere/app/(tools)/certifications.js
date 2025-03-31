import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  TouchableWithoutFeedback,
  Dimensions
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000/api";
const { width, height } = Dimensions.get('window');

const CertificationScreen = () => {
  const [certifications, setCertifications] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    certificatePhoto: '',
    issuedBy: '',
    issueDate: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.95));
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    fetchCertifications();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  }, [certifications]);

  const fetchCertifications = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/user/certifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCertifications(response.data);
      setIsLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch certifications');
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setFormData({ ...formData, certificatePhoto: result.assets[0].uri });
      }
    } catch (err) {
      setError('Failed to pick image');
    }
  };

  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateDate = (date) => {
    // Simple date format validation (YYYY-MM-DD)
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(date)) {
      Alert.alert(
        'Invalid Date Format',
        'Please enter date in YYYY-MM-DD format',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    try {
      if (!formData.title || !formData.issuedBy || !formData.issueDate || !formData.certificatePhoto) {
        setError('Please fill all required fields');
        return;
      }

      if (!validateDate(formData.issueDate)) {
        return;
      }

      const token = await AsyncStorage.getItem('token');
      
      if (editingId) {
        await axios.put(`${API_BASE_URL}/user/certifications/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_BASE_URL}/user/certifications`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      resetForm();
      fetchCertifications();
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  const handleEdit = (cert) => {
    setFormData({
      title: cert.title,
      description: cert.description,
      certificatePhoto: cert.certificatePhoto,
      issuedBy: cert.issuedBy,
      issueDate: cert.issueDate.split('T')[0]
    });
    setEditingId(cert._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    Alert.alert(
      'Delete Certification',
      'Are you sure you want to delete this certification?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await axios.delete(`${API_BASE_URL}/user/certifications/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              fetchCertifications();
            } catch (err) {
              setError('Failed to delete certification');
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      certificatePhoto: '',
      issuedBy: '',
      issueDate: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const openImageModal = (imageUri) => {
    setSelectedImage(imageUri);
    setShowImageModal(true);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7E57C2" />
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Feather name="award" size={28} color="#7E57C2" style={styles.headerIcon} />
          <Text style={styles.headerText}>My Certifications</Text>
          
          {!showForm && (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowForm(true)}
            >
              <Feather name="plus" size={24} color="#7E57C2" />
            </TouchableOpacity>
          )}
        </View>

        {showForm && (
          <View style={[styles.formContainer, styles.cardWithBorder]}>
            <Text style={styles.formTitle}>
              {editingId ? 'Edit Certification' : 'Add New Certification'}
            </Text>
            
            {error ? (
              <View style={styles.errorContainer}>
                <Feather name="alert-circle" size={20} color="#ff6b6b" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Feather name="award" size={20} color="#7E57C2" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Title"
                placeholderTextColor="#888"
                value={formData.title}
                onChangeText={(text) => handleInputChange('title', text)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Feather name="user" size={20} color="#7E57C2" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Issued By"
                placeholderTextColor="#888"
                value={formData.issuedBy}
                onChangeText={(text) => handleInputChange('issuedBy', text)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Feather name="calendar" size={20} color="#7E57C2" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Issue Date (YYYY-MM-DD)"
                placeholderTextColor="#888"
                value={formData.issueDate}
                onChangeText={(text) => handleInputChange('issueDate', text)}
                onBlur={() => {
                  if (formData.issueDate && !validateDate(formData.issueDate)) {
                    setFormData({...formData, issueDate: ''});
                  }
                }}
              />
            </View>

            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              <Feather name="image" size={20} color="#7E57C2" />
              <Text style={styles.imagePickerText}>
                {formData.certificatePhoto ? 'Change Image' : 'Select Certificate Image'}
              </Text>
            </TouchableOpacity>

            {formData.certificatePhoto && (
              <TouchableOpacity onPress={() => openImageModal(formData.certificatePhoto)}>
                <Image
                  source={{ uri: formData.certificatePhoto }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            )}

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description"
              placeholderTextColor="#888"
              multiline
              numberOfLines={4}
              value={formData.description}
              onChangeText={(text) => handleInputChange('description', text)}
            />

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: '#7E57C2' }]}
                onPress={handleSubmit}
              >
                <Text style={styles.buttonText}>
                  {editingId ? 'Update' : 'Add'} Certification
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={resetForm}
              >
                <Text style={[styles.buttonText, { color: '#7E57C2' }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>My Certificates</Text>

        {certifications.length === 0 ? (
          <View style={[styles.emptyState, styles.cardWithBorder]}>
            <Feather name="award" size={48} color="#7E57C2" />
            <Text style={styles.emptyStateText}>
              No certifications added yet. {!showForm && (
                <Text onPress={() => setShowForm(true)} style={{color: '#7E57C2'}}>
                  Add your first certification
                </Text>
              )}
            </Text>
          </View>
        ) : (
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            {certifications.map(cert => (
              <View key={cert._id} style={[styles.certificateCard, styles.cardWithBorder]}>
                {cert.certificatePhoto && (
                  <TouchableOpacity onPress={() => openImageModal(cert.certificatePhoto)}>
                    <Image
                      source={{ uri: cert.certificatePhoto }}
                      style={styles.certificateImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                )}
                <View style={styles.certificateDetails}>
                  <Text style={styles.certificateTitle}>{cert.title}</Text>
                  <View style={styles.detailRow}>
                    <Feather name="user" size={16} color="#7E57C2" />
                    <Text style={styles.detailText}>{cert.issuedBy}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Feather name="calendar" size={16} color="#7E57C2" />
                    <Text style={styles.detailText}>{formatDate(cert.issueDate)}</Text>
                  </View>
                  <Text style={styles.certificateDescription}>{cert.description}</Text>
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEdit(cert)}
                  >
                    <Feather name="edit" size={18} color="#7E57C2" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(cert._id)}
                  >
                    <Feather name="trash-2" size={18} color="#ff6b6b" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </Animated.View>
        )}
      </ScrollView>

      {/* Image Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        onRequestClose={() => setShowImageModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowImageModal(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              <Image
                source={{ uri: selectedImage }}
                style={styles.fullImage}
                resizeMode="contain"
              />
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowImageModal(false)}
              >
                <Feather name="x" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 32,
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
    marginBottom: 24,
    justifyContent: 'space-between',
  },
  headerIcon: {
    marginRight: 12,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7E57C2',
  },
  addButton: {
    padding: 8,
  },
  cardWithBorder: {
    borderWidth: 1,
    borderColor: '#7E57C2',
    borderRadius: 12,
    shadowColor: '#7E57C2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  formContainer: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7E57C2',
    marginBottom: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#ff6b6b',
    marginLeft: 8,
    fontSize: 14,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: '#e0e0e0',
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    padding: 12,
    backgroundColor: '#2d2d2d',
    borderRadius: 8,
    marginBottom: 16,
  },
  imagePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  imagePickerText: {
    color: '#7E57C2',
    marginLeft: 10,
    fontSize: 16,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#2d2d2d',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  primaryButton: {
    flex: 1,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginRight: 8,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#2d2d2d',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#7E57C2',
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#7E57C2',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#1e1e1e',
  },
  emptyStateText: {
    color: '#888',
    marginTop: 16,
    textAlign: 'center',
    fontSize: 16,
  },
  certificateCard: {
    backgroundColor: '#1e1e1e',
    marginBottom: 16,
    overflow: 'hidden',
  },
  certificateImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#2d2d2d',
  },
  certificateDetails: {
    padding: 16,
  },
  certificateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7E57C2',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    color: '#e0e0e0',
    marginLeft: 8,
    fontSize: 14,
  },
  certificateDescription: {
    color: '#ccc',
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  editButton: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(126, 87, 194, 0.1)',
  },
  deleteButton: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width - 40,
    height: height - 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(126, 87, 194, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CertificationScreen;