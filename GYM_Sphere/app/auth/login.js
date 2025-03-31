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
import { useDispatch, useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";

import api from "../(services)/api/api";
import { loginAction } from "../(redux)/authSlice";

const { loginUser } = api;

const LoginSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

export default function Login() {
  const video = useRef(null);
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const mutation = useMutation({
    mutationFn: async (values) => {
      try {
        const data = await loginUser(values); // Call API function
        return data;
      } catch (error) {
        throw new Error(error.message);
      }
    },
    mutationKey: ["login"],
  });

  useEffect(() => {
    if (user) {
      router.replace("/(tabs)");
    }
  }, [user]);

  return (
    <View style={styles.container}>
      <View style={styles.videoContainer}>
        <Video
          ref={video}
          style={styles.video}
          source={{
            uri: "https://cdn.pixabay.com/video/2024/07/08/220150_large.mp4",
          }}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping
          onError={(error) => console.error("❌ Video Error:", error)}
        />
        <View style={styles.overlay} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>GYM-SPHERE</Text>
        <Text style={styles.subtitle}>Effortless Gym Management</Text>
        <Text style={styles.subtitle}>Welcome Back</Text>

        <Formik
          initialValues={{ email: "", password: "" }}
          validationSchema={LoginSchema}
          onSubmit={async (values) => {
            try {
              const data = await mutation.mutateAsync(values);

              if (!data || !data.id || !data.email) {
                throw new Error("Invalid response from server");
              }

              await AsyncStorage.setItem("token", data.token);

              // ✅ Correctly storing user data in Redux
              dispatch(loginAction({ id: data.id, email: data.email }));
              Alert.alert("Login Successful", "Welcome back to Gym-Sphere!");
              router.replace("/(tabs)");
            } catch (error) {
              console.error("❌ Login Error:", error);
              Alert.alert("Login Failed", "Invalid email or password. Please try again.");
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

              <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Login</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </Formik>

        <Text style={styles.footerText}>
          New here?{" "}
          <Text style={styles.signupLink} onPress={() => router.push("/auth/register")}>
            Register
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
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
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "500",
    fontStyle: "italic",
    color: "#E5E5E5",
    marginBottom: 30,
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
    backgroundColor: "#5A00E0",
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
