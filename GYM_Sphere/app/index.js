import * as React from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { Video, ResizeMode } from "expo-av";
import { useRouter } from "expo-router";

export default function App() {
  const video = React.useRef(null);
  const [status, setStatus] = React.useState({});
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Video
        ref={video}
        style={styles.video}
        source={{
          uri: "https://cdn.pixabay.com/video/2024/07/08/220150_large.mp4",
        }}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        onPlaybackStatusUpdate={(status) => setStatus(() => status)}
      />
      <View style={styles.overlay}>
        <Text style={styles.mainText}>GYM-SPHERE</Text>
        <Text style={styles.subText}>Effortless Gym Management</Text>
        <Text style={styles.tagline}>Simplifying fitness administration for you</Text>
      </View>
      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/auth/login")}
        >
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/auth/register")}
        >
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  mainText: {
    color: "white",
    fontSize: 60,
    fontWeight: "bold",
    textAlign: "center",
    elevation: 3,
    textShadowColor: "rgba(0, 0, 0, 0.5)",  // Shadow color
    textShadowOffset: { width: 2, height: 2 },  // X, Y offset
    textShadowRadius: 5  // Blur radius
  },
  subText: {
    color: "white",
    fontSize: 24,
    fontStyle: "italic",
    fontWeight: "bold",
    textAlign: "center",
    elevation: 3,
    textShadowColor: "rgba(0, 0, 0, 0.5)",  // Shadow color
    textShadowOffset: { width: 2, height: 2 },  // X, Y offset
    textShadowRadius: 5  // Blur radius
  },
  tagline: {
    color: "white",
    fontSize: 18,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 10,
    elevation: 3,
    textShadowColor: "rgba(0, 0, 0, 0.5)",  // Shadow color
    textShadowOffset: { width: 2, height: 2 },  // X, Y offset
    textShadowRadius: 5  // Blur radius

  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
  },
  button: {
    backgroundColor: "#6200ea",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    elevation: 3, // Adds a shadow effect on Android
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});