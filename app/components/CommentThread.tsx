import React, { useState } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import ElasticSpring from "./ElasticSpring"; // your custom animation component
import { Post } from "../context/PostContext"; // ensure Post type exists

// ✅ Props types
type Comment = {
  id: string;
  text: string;
  user: string;
};

type CommentThreadProps = {
  post: Post;
  comments: Comment[];
  onAddComment?: (postId: string, comment: Comment) => void;
};

export default function CommentThread({ post, comments, onAddComment }: CommentThreadProps) {
  const [newComment, setNewComment] = useState("");

  // Shared animation value for newly added comment
  const springScale = useSharedValue(0);

  const handleAddComment = () => {
    if (newComment.trim() === "") return;

    const comment: Comment = {
      id: Date.now().toString(),
      text: newComment,
      user: "You", // or get from user context
    };

    // Trigger spring animation
    springScale.value = 0; // reset
    springScale.value = withSpring(1, { damping: 8, stiffness: 150 });

    // Pass new comment to parent/context
    if (onAddComment) onAddComment(post.id, comment);

    setNewComment("");
  };

  // Animated style for each new comment
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: springScale.value }],
    opacity: springScale.value,
  }));

  const renderComment = ({ item }: { item: Comment }) => (
    <ElasticSpring>
      <View style={styles.comment}>
        <Text style={styles.user}>{item.user}:</Text>
        <Text style={styles.text}>{item.text}</Text>
      </View>
    </ElasticSpring>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Comments</Text>
      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        renderItem={renderComment}
      />

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Add a comment..."
          value={newComment}
          onChangeText={setNewComment}
          style={styles.input}
        />
        <TouchableOpacity onPress={handleAddComment} style={styles.button}>
          <Text style={styles.buttonText}>Post</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ✅ Styles
const styles = StyleSheet.create({
  container: { padding: 10, backgroundColor: "#fff", flex: 1 },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  comment: { flexDirection: "row", marginBottom: 6, padding: 6, backgroundColor: "#f5f5f5", borderRadius: 10 },
  user: { fontWeight: "bold", marginRight: 6 },
  text: { flex: 1 },
  inputContainer: { flexDirection: "row", marginTop: 10, alignItems: "center" },
  input: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 20, paddingHorizontal: 12, height: 40 },
  button: { marginLeft: 8, backgroundColor: "#6200EE", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  buttonText: { color: "#fff", fontWeight: "bold" },
});
