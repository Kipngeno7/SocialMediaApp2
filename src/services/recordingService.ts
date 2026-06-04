import { Audio } from "expo-av";

export const startRecording = async () => {
  await Audio.requestPermissionsAsync();

  const recording = new Audio.Recording();
  await recording.prepareToRecordAsync(
    Audio.RecordingOptionsPresets.HIGH_QUALITY
  );
  await recording.startAsync();
  return recording;
};

export const stopRecording = async (recording: any) => {
  await recording.stopAndUnloadAsync();
  return recording.getURI();
};
