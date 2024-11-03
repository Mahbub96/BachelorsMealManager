import {
  StyleSheet,
  Platform,
  TextInput,
  TouchableOpacity,
  View,
  Text,
} from "react-native";
import { useState } from "react";

export default function Signup() {
  const [name, setName] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    try {
      // Form validation
      if (!name || !roomNumber || !email || !password || !confirmPassword) {
        setError("Please fill in all fields");
        return;
      }

      if (!email.includes("@")) {
        setError("Please enter a valid email address");
        return;
      }

      if (password.length < 6) {
        setError("Password must be at least 6 characters long");
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      // Mock signup success
      console.log("Signing up with:", name, roomNumber, email, password);
      setError(""); // Clear any previous errors on success
    } catch (error) {
      setError("An error occurred during signup");
      console.error(error); // Log the actual error for debugging
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.loginContainer}>
        <Text style={styles.title}>Create Account</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, styles.textInput]}
            value={name}
            onChangeText={(text) => {
              setName(text);
              setError(""); // Clear error when user types
            }}
            placeholder="Enter your name"
            autoCapitalize="words"
            placeholderTextColor="#666"
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, styles.textInput]}
            value={roomNumber}
            onChangeText={(text) => {
              setRoomNumber(text.trim());
              setError(""); // Clear error when user types
            }}
            placeholder="Enter room number"
            keyboardType="numeric"
            placeholderTextColor="#666"
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, styles.textInput]}
            value={email}
            onChangeText={(text) => {
              setEmail(text.trim());
              setError(""); // Clear error when user types
            }}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#666"
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, styles.textInput]}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError(""); // Clear error when user types
            }}
            placeholder="Create password"
            secureTextEntry
            placeholderTextColor="#666"
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, styles.textInput]}
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setError(""); // Clear error when user types
            }}
            placeholder="Confirm password"
            secureTextEntry
            placeholderTextColor="#666"
          />
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            (!name || !roomNumber || !email || !password || !confirmPassword) &&
              styles.buttonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={
            !name || !roomNumber || !email || !password || !confirmPassword
          }
        >
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  loginContainer: {
    gap: 20,
    padding: 20,
    borderRadius: 10,
    backgroundColor: Platform.select({
      ios: "rgba(255,255,255,0.8)",
      android: "rgba(255,255,255,0.9)",
    }),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#000",
  },
  inputContainer: {
    gap: 8,
  },
  input: {
    backgroundColor: "transparent",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 12,
    fontSize: 16,
    color: "#000",
  },
  button: {
    marginTop: 10,
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  error: {
    color: "#ff3b30",
    textAlign: "center",
  },
});
