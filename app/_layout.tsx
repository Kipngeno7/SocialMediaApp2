import { Stack } from "expo-router";
import { PostProvider } from "./context/PostContext";

export default function Layout() {
  return (
    <PostProvider>
      <Stack />
    </PostProvider>
  );
}
