import { StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/context/AuthContext';

export default function DashboardScreen() {
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Hello {user?.firstName ?? 'there'} 👋</Text>
      <Text style={styles.subheading}>Your EduVault mobile dashboard is coming soon.</Text>
      <Text style={styles.body}>
        Build native experiences for course resources, assessments, and notifications using the existing
        Render backend.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f5f7fb',
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a2b49',
    marginBottom: 12,
  },
  subheading: {
    fontSize: 16,
    color: '#42506b',
    marginBottom: 18,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4f5d7a',
  },
});
