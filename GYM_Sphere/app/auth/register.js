import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { Formik } from "formik";
import * as Yup from "yup";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import api from "../(services)/api/api"; // Replace with actual API function

const { registerUser } = api;

const RegisterSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password"), null], "Passwords must match")
    .required("Confirm Password is required"),
});

export default function Register() {
  const video = useRef(null);
  const [status, setStatus] = useState({});
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: api.registerUser,  // ✅ Use api.registerUser instead
    mutationKey: ["register"],
  });

  return (
    <View style={styles.container}>
      {/* Background Video with Overlay */}
      <View style={styles.videoContainer}>
        <Video
          ref={video}
          style={styles.video}
          source={{
            uri: "https://cdn.pixabay.com/video/2024/07/08/220150_large.mp4", // ✅ Same Video as Login
          }}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping
          onPlaybackStatusUpdate={(status) => setStatus(() => status)}
        />
        <View style={styles.overlay} />
      </View>

      {/* Foreground Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join Gym-Sphere Today!</Text>

        <Formik
          initialValues={{ email: "", password: "", confirmPassword: "" }}
          validationSchema={RegisterSchema}
          onSubmit={async (values) => {
            console.log("Submitting values:", values);
            try {
              const data = await mutation.mutateAsync(values);
              console.log("Registration successful:", data);
              Alert.alert("Success", "Account created successfully!");
              router.replace("/auth/login");
            } catch (error) {
              console.error("Register Error:", error);
              if (error.response) {
                console.error("Error data:", error.response.data);
                console.error("Error status:", error.response.status);
                console.error("Error headers:", error.response.headers);
              } else if (error.request) {
                console.error("No response received:", error.request);
              } else {
                console.error("Error:", error.message);
              }
              Alert.alert("Registration Failed", "Please try again.");
            }
          }}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <View style={styles.form}>
              <TextInput
                style={[styles.input, errors.email && touched.email ? styles.inputError : {}]}
                placeholder="Email"
                placeholderTextColor="#ddd"
                onChangeText={handleChange("email")}
                onBlur={handleBlur("email")}
                value={values.email}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email && touched.email && <Text style={styles.errorText}>{errors.email}</Text>}

              <TextInput
                style={[styles.input, errors.password && touched.password ? styles.inputError : {}]}
                placeholder="Password"
                placeholderTextColor="#ddd"
                onChangeText={handleChange("password")}
                onBlur={handleBlur("password")}
                value={values.password}
                secureTextEntry
                autoCapitalize="none"
              />
              {errors.password && touched.password && <Text style={styles.errorText}>{errors.password}</Text>}

              <TextInput
                style={[styles.input, errors.confirmPassword && touched.confirmPassword ? styles.inputError : {}]}
                placeholder="Confirm Password"
                placeholderTextColor="#ddd"
                onChangeText={handleChange("confirmPassword")}
                onBlur={handleBlur("confirmPassword")}
                value={values.confirmPassword}
                secureTextEntry
                autoCapitalize="none"
              />
              {errors.confirmPassword && touched.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}

              <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Register</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </Formik>

        <Text style={styles.footerText}>
          Already have an account?{" "}
          <Text style={styles.signupLink} onPress={() => router.back()}>
            Login
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  videoContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  video: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)", // ✅ Semi-transparent black overlay
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
    textShadowColor: "rgba(0, 0, 0, 0.5)",  // Shadow color
    textShadowOffset: { width: 2, height: 2 },  // X, Y offset
    textShadowRadius: 5  // Blur radius
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "500",
    fontStyle: "italic",
    color: "#E5E5E5",
    marginBottom: 30,
    textShadowColor: "rgba(0, 0, 0, 0.5)",  // Shadow color
    textShadowOffset: { width: 2, height: 2 },  // X, Y offset
    textShadowRadius: 5  // Blur radius
  },
  form: {
    width: "100%",
  },
  input: {
    height: 50,
    borderColor: "#444",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: "#222",
    color: "#fff",
  },
  inputError: {
    borderColor: "red",
  },
  errorText: {
    color: "red",
    fontSize: 14,
    marginBottom: 10,
  },
  button: {
    height: 50,
    backgroundColor: "#5A00E0", // Purple button
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  footerText: {
    color: "#E5E5E5",
    marginTop: 20,
    fontSize: 16,
  },
  signupLink: {
    color: "#5A00E0",
    fontWeight: "bold",
  },
});

