import {
  StyleSheet,
  Platform,
  TextInput,
  TouchableOpacity,
  View,
  Text,
} from "react-native";
import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    try {
      // Form validation
      if (!email || !password) {
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

      // Mock login success
      console.log("Logging in with:", email, password);
      setError(""); // Clear any previous errors on success
    } catch (error) {
      setError("An error occurred during login");
      console.error(error); // Log the actual error for debugging
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.loginContainer}>
        <Text style={styles.title}>Welcome Back!</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

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
            placeholder="Enter your password"
            secureTextEntry
            placeholderTextColor="#666"
          />
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            (!email || !password) && styles.buttonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!email || !password}
        >
          <Text style={styles.buttonText}>Login</Text>
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
