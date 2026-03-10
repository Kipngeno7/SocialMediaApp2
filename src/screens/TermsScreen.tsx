import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

export default function TermsScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Terms and Services</Text>
      
      <Text style={styles.sectionTitle}>1. Acceptable Use</Text>
      <Text style={styles.text}>
        Users must not post illegal content, hate speech, harassment, or spam. All content should comply with local laws.
      </Text>

      <Text style={styles.sectionTitle}>2. Account Responsibility</Text>
      <Text style={styles.text}>
        You are responsible for your account, including password security. Sharing accounts is prohibited.
      </Text>

      <Text style={styles.sectionTitle}>3. Monetization Rules</Text>
      <Text style={styles.text}>
        Users can donate or withdraw funds according to platform policies. Fraudulent activity may lead to account suspension.
      </Text>

      <Text style={styles.sectionTitle}>4. Privacy</Text>
      <Text style={styles.text}>
        Personal data will be handled according to our Privacy Policy. Do not share sensitive information publicly.
      </Text>

      <Text style={styles.sectionTitle}>5. Enforcement</Text>
      <Text style={styles.text}>
        Violations of these terms may result in warnings, temporary suspension, or permanent account deletion.
      </Text>

      <Text style={styles.sectionTitle}>6. Updates</Text>
      <Text style={styles.text}>
        Terms may change at any time. Users are responsible for reviewing updates.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 15, marginBottom: 5 },
  text: { fontSize: 16, lineHeight: 22 }
});
