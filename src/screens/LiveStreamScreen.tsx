import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
// Replace the '@react-native-firebase/database' import with this:
import { getDatabase, ref, onValue } from 'firebase/database';

const { width, height } = Dimensions.get('window');

type LiveStreamScreenRouteProp = RouteProp<
  { params: { streamId: string } },
  'params'
>;

type Stream = {
  id: string;
  title: string;
  category: string;
  viewers: number;
  isLive: boolean;
};

export default function LiveStreamScreen() {
  const route = useRoute<LiveStreamScreenRouteProp>();
  const { streamId } = route.params;
  const [stream, setStream] = useState<Stream | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch the individual stream from Firebase
  useEffect(() => {
    const database = getDatabase();
    const streamRef = ref(database, `liveStreams/${streamId}`);
    const unsubscribe = onValue(streamRef, snapshot => {
      const data = snapshot.val();
      if (data) {
        setStream({
          id: streamId,
          title: data.title,
          category: data.category || 'Other',
          viewers: data.viewers || 0,
          isLive: data.isLive || false,
        });
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [streamId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!stream) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Stream not found or ended.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.videoPlaceholder}>
        <Text style={styles.title}>{stream.title}</Text>
        <Text style={styles.category}>{stream.category}</Text>
        <Text style={styles.viewers}>{stream.viewers} viewers</Text>
      </View>
      <View style={styles.chatPlaceholder}>
        <Text>Chat section coming soon...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlaceholder: {
    width: width,
    height: height * 0.5,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatPlaceholder: {
    flex: 1,
    padding: 10,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  category: {
    color: '#fff',
    fontSize: 16,
    marginTop: 5,
  },
  viewers: {
    color: '#fff',
    fontSize: 14,
    marginTop: 5,
  },
});
