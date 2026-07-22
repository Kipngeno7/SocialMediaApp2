import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";

// --- SYSTEM CONFIGURATION CONFIGS ---
const MIN_WITHDRAWAL_USD = 1.7;

export default function WalletScreen() {
  // --- CORE DATA STATES ---
  const [balance, setBalance] = useState<number>(45.50); // Sample balance starting value
  const [isBalanceVisible, setIsBalanceVisible] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // --- WITHDRAWAL WORKFLOW STATES ---
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [withdrawalPin, setWithdrawalPin] = useState<string>("");

  // --- PIN RECOVERY FLOW STATES ---
  // Screen views: 'MAIN' | 'FORGET_PIN_METHOD' | 'FORGET_PIN_VERIFY'
  const [currentView, setCurrentView] = useState<"MAIN" | "FORGET_PIN_METHOD" | "FORGET_PIN_VERIFY">("MAIN");
  const [recoveryMethod, setRecoveryMethod] = useState<"email" | "phone" | null>(null);
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [newPin, setNewPin] = useState<string>("");

  // --- MOCK DATABASE HELPER SYNC ---
  const fetchWalletMetrics = async () => {
    // Future integration anchor with your Supabase / Paystack Balance tables
  };

  useEffect(() => {
    fetchWalletMetrics();
  }, []);

  // --- TRANSACTIONAL EXECUTIONS ---
  const handleWithdrawalSubmission = async () => {
    const numericalAmount = parseFloat(withdrawAmount);

    // SPECIFICATION #5: Minimum amount parameter check
    if (isNaN(numericalAmount) || numericalAmount < MIN_WITHDRAWAL_USD) {
      Alert.alert("Invalid Amount", `The minimum amount to be withdrawn should be $${MIN_WITHDRAWAL_USD} USD.`);
      return;
    }

    // SPECIFICATION #4: Absolute capacity enforcement validation
    if (numericalAmount > balance) {
      Alert.alert("Withdrawal Denied", "You don't have enough balance.");
      return;
    }

    // SPECIFICATION #1: Pin validation gate
    if (withdrawalPin.length !== 4) {
      Alert.alert("Security Check", "Please enter your secret 4-digit PIN to withdraw money.");
      return;
    }

    setIsLoading(true);
    try {
      // Mock processing connecting straight down into Paystack global transfer/payout endpoints via Supabase
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      setBalance((prev) => prev - numericalAmount);
      Alert.alert("Success", `Withdrawal of $${numericalAmount.toFixed(2)} initiated successfully!`);
      setWithdrawAmount("");
      setWithdrawalPin("");
    } catch (error) {
      Alert.alert("System Error", "Unable to route request down financial node networks.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- RECOVERY SEQUENCING ACTIONS ---
  // SPECIFICATION #2: Forget pin trigger sequences
  const handleRequestResetCode = () => {
    if (!recoveryMethod) {
      Alert.alert("Selection Required", "Please select either phone number or email to receive code.");
      return;
    }
    
    Alert.alert(
      "Code Transmitted", 
      `A 6-digit secure code has been sent to your registered ${recoveryMethod === "email" ? "Email Address" : "Phone Number"}.`
    );
    setCurrentView("FORGET_PIN_VERIFY");
  };

  const handleVerifyAndResetPin = () => {
    if (verificationCode.length !== 6) {
      Alert.alert("Invalid Input", "Please supply the complete 6-digit validation code.");
      return;
    }

    if (newPin.length !== 4) {
      Alert.alert("Invalid Input", "Your new secret security PIN must be exactly 4 digits.");
      return;
    }

    Alert.alert("Security Update", "Your withdrawal PIN has been updated successfully.");
    // Clear recovery memory arrays
    setVerificationCode("");
    setNewPin("");
    setCurrentView("MAIN");
  };

  // --- RENDERING SUBSYSTEM VIEWS ---
  return (
    <SafeAreaView style={styles.masterContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollLayout}>
          
          {/* HEADER LAYER */}
          <View style={styles.headerNode}>
            <Text style={styles.headerTitle}>My Wallet</Text>
          </View>

          {currentView === "MAIN" && (
            <View style={styles.subCardContainer}>
              {/* BALANCE COMPONENT AND EYE ACCENTS */}
              <View style={styles.balanceDisplayCard}>
                <Text style={styles.balanceMetaLabel}>Current Earnings Balance</Text>
                <View style={styles.balanceActionRow}>
                  {/* SPECIFICATION #3: On/Off visibility logic toggle mapping */}
                  <Text style={styles.balanceValueText}>
                    {isBalanceVisible ? `$ ${balance.toFixed(2)}` : "••••••"}
                  </Text>
                  <TouchableOpacity 
                    style={styles.eyeToggleContainer}
                    onPress={() => setIsBalanceVisible(!isBalanceVisible)}
                  >
                    <Text style={styles.eyeIconText}>{isBalanceVisible ? "👁️ Hide" : "👁️ Show"}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* WITHDRAWAL TRANSACTION WRAPPERS */}
              <View style={styles.actionFormCard}>
                <Text style={styles.cardSectionHeading}>Withdrawal Application</Text>
                
                <Text style={styles.fieldLabel}>Amount to Withdraw (USD)</Text>
                <TextInput
                  style={styles.formInputField}
                  placeholder="0.00"
                  placeholderTextColor="#777"
                  keyboardType="numeric"
                  value={withdrawAmount}
                  onChangeText={setWithdrawAmount}
                />

                {/* SPECIFICATION #1: Secret 4 pin input security parameter */}
                <Text style={styles.fieldLabel}>Secret Security PIN (4 Digits)</Text>
                <TextInput
                  style={styles.formInputField}
                  placeholder="••••"
                  placeholderTextColor="#777"
                  keyboardType="numeric"
                  secureTextEntry={true}
                  maxLength={4}
                  value={withdrawalPin}
                  onChangeText={setWithdrawalPin}
                />

                {/* SPECIFICATION #2: Recovery path trigger node */}
                <TouchableOpacity 
                  style={styles.forgetPinAnchorLink}
                  onPress={() => setCurrentView("FORGET_PIN_METHOD")}
                >
                  <Text style={styles.forgetPinAnchorText}>Forgot Secret PIN?</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.primaryActionButton}
                  onPress={handleWithdrawalSubmission}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#121214" />
                  ) : (
                    <Text style={styles.primaryActionText}>Confirm Funds Release</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* SPECIFICATION #2: Choice route layout block */}
          {currentView === "FORGET_PIN_METHOD" && (
            <View style={styles.actionFormCard}>
              <Text style={styles.cardSectionHeading}>Reset Security PIN</Text>
              <Text style={styles.cardSectionSubheading}>Select verification delivery node channel:</Text>

              <TouchableOpacity 
                style={[styles.selectionChannelRow, recoveryMethod === "phone" && styles.selectedChannelActive]}
                onPress={() => setRecoveryMethod("phone")}
              >
                <Text style={styles.channelLabelText}>📱 Registered Phone Number</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.selectionChannelRow, recoveryMethod === "email" && styles.selectedChannelActive]}
                onPress={() => setRecoveryMethod("email")}
              >
                <Text style={styles.channelLabelText}>✉️ Registered Email Address</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.primaryActionButton} onPress={handleRequestResetCode}>
                <Text style={styles.primaryActionText}>Send 6-Digit Code</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelAnchorLink} onPress={() => setCurrentView("MAIN")}>
                <Text style={styles.cancelAnchorText}>Return to Main View</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* SPECIFICATION #2: Code confirmation view layer */}
          {currentView === "FORGET_PIN_VERIFY" && (
            <View style={styles.actionFormCard}>
              <Text style={styles.cardSectionHeading}>Confirm Verification</Text>
              
              <Text style={styles.fieldLabel}>Enter the 6-Digit Reset Code</Text>
              <TextInput
                style={styles.formInputField}
                placeholder="000000"
                placeholderTextColor="#777"
                keyboardType="numeric"
                maxLength={6}
                value={verificationCode}
                onChangeText={setVerificationCode}
              />

              <Text style={styles.fieldLabel}>Enter New Secret 4-Digit PIN</Text>
              <TextInput
                style={styles.formInputField}
                placeholder="••••"
                placeholderTextColor="#777"
                keyboardType="numeric"
                secureTextEntry={true}
                maxLength={4}
                value={newPin}
                onChangeText={setNewPin}
              />

              <TouchableOpacity style={styles.primaryActionButton} onPress={handleVerifyAndResetPin}>
                <Text style={styles.primaryActionText}>Confirm Reset PIN</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelAnchorLink} onPress={() => setCurrentView("MAIN") }>
                <Text style={styles.cancelAnchorText}>Return to Main View</Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- OPTIMIZED DESIGN STYLE SHEET ---
const styles = StyleSheet.create({
masterContainer: {flex: 1, backgroundColor: "#121214"},
scrollLayout: {
paddingHorizontal: 20,paddingBottom: 40,},
headerNode: {marginVertical: 25,
alignItems: "center",},headerTitle: 
{fontSize: 26,fontWeight: "bold",
color: "#ffffff",letterSpacing: 0.5,},
subCardContainer: {width: "100%",},
balanceDisplayCard: {
backgroundColor: "#1e1e24",
borderRadius: 16,padding: 22,borderWidth: 1,
borderColor: "#2a2a32",marginBottom: 20,
shadowColor: "#000",shadowOffset: {
 width: 0, height: 4 },shadowOpacity: 0.3,
shadowRadius: 5,},
balanceMetaLabel: {fontSize: 13,color: "#a0a0ab",
textTransform: "uppercase",letterSpacing: 1,
marginBottom: 8,},
balanceActionRow: {
flexDirection: "row",justifyContent: "space-between",
alignItems: "center",},
balanceValueText: {fontSize: 32,
fontWeight: "700",color: "#00f2ff", // Premium electric blue accents
},
eyeToggleContainer: {
backgroundColor: "rgba(0, 242, 255, 0.1)",
paddingVertical: 6,paddingHorizontal: 12,
borderRadius: 20,},eyeIconText: {
color: "#00f2ff",fontSize: 13,fontWeight: "600",},
actionFormCard: {
backgroundColor: "#1e1e24",borderRadius: 16,
padding: 22,borderWidth: 1,borderColor: "#2a2a32",},
cardSectionHeading: {fontSize: 18,
fontWeight: "600",color: "#ffffff",marginBottom: 6,},
cardSectionSubheading: {fontSize: 14,
color: "#a0a0ab",marginBottom: 20,},
fieldLabel: {
fontSize: 14,fontWeight: "500",
color: "#d4d4d8",marginTop: 16,
marginBottom: 8,},
formInputField: {
backgroundColor: "#141416",
borderRadius: 10,
paddingVertical: 14,
paddingHorizontal: 16,
color: "#ffffff",fontSize: 16,
borderWidth: 1,borderColor: "#2a2a32",},
forgetPinAnchorLink: {
alignSelf: "flex-end",
marginTop: 10,
marginBottom: 24,},
forgetPinAnchorText: {color: "#00f2ff",
fontSize: 13,fontWeight: "500",},
primaryActionButton: {
backgroundColor: "#00f2ff",
borderRadius: 12,
paddingVertical: 16,alignItems: "center",
justifyContent: "center",
marginTop: 20,
shadowColor: "#00f2ff",shadowOffset: {
 width: 0, height: 4 },
shadowOpacity: 0.2,shadowRadius: 6,},
primaryActionText: {color: "#121214",
fontSize: 16,fontWeight: "700",},
selectionChannelRow: {
backgroundColor: "#141416",
borderRadius: 12,
padding: 16,marginVertical: 8,
borderWidth: 1,borderColor: "#2a2a32",},
selectedChannelActive: {
borderColor: "#00f2ff",
backgroundColor: "rgba(0, 242, 255, 0.05)",},
channelLabelText: {
color: "#ffffff",fontSize: 15,fontWeight: "500",},
cancelAnchorLink: {alignItems: "center",
marginTop: 20,},
cancelAnchorText: {color: "#ef4444",
fontSize: 14,fontWeight: "600",},
});
