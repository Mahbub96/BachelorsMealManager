import { View } from "react-native";
import Login from "@/components/Login";
import Signup from "@/components/Signup";
import Dashboard from "@/components/Dashboard";

export default function HomeScreen() {
  return (
    <View style={{ flex: 1 }}>
      {/* <Login /> */}
      {/* <Signup /> */}
      <Dashboard />
    </View>
  );
}
