import React, { useState } from "react";
import { View, Text, Button, Image, StyleSheet, ActivityIndicator } from "react-native";
import * as ImagePicker from "react-native-image-picker";
import { Video } from "expo-av"; // for showing video preview
import { Image as ImageCompressor, Video as VideoCompressor } from "react-native-compressor";

export default function App() {
  const [media, setMedia] = useState(null);
  const [compressedUri, setCompressedUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState("");

  // Pick image or video
  const pickMedia = () => {
    ImagePicker.launchImageLibrary({ mediaType: "mixed" }, async (response) => {
      if (response.didCancel || !response.assets) return;

      const asset = response.assets[0];
      setMedia(asset);
      setCompressedUri(null);
      setInfo("");

      try {
        setLoading(true);

        if (asset.type?.startsWith("image")) {
          // compress image
          const result = await ImageCompressor.compress(asset.uri, {
            maxWidth: 1080,
            quality: 0.7,
          });
          setCompressedUri(result);
          setInfo(`Image: original ${Math.round(asset.fileSize / 1024)} KB → compressed`);
        } else if (asset.type?.startsWith("video")) {
          // compress video
          const result = await VideoCompressor.compress(asset.uri, {
            compressionMethod: "auto",
          });
          setCompressedUri(result);
          setInfo(`Video: original ${Math.round(asset.fileSize / 1024 / 1024)} MB → compressed`);
        }
      } catch (err) {
        console.log("Compression error:", err);
        setInfo("Compression failed");
      } finally {
        setLoading(false);
      }
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>RN Media Compressor</Text>
      <Button title="Pick photo or video" onPress={pickMedia} />

      {loading && <ActivityIndicator size="large" style={{ margin: 20 }} />}

      {media && media.type?.startsWith("image") && (
        <Image source={{ uri: media.uri }} style={styles.preview} />
      )}

      {media && media.type?.startsWith("video") && (
        <Video
          source={{ uri: media.uri }}
          style={styles.preview}
          useNativeControls
          resizeMode="contain"
        />
      )}

      {compressedUri && (
        <>
          <Text style={styles.info}>{info}</Text>
          <Text style={styles.uri}>Compressed file: {compressedUri}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 20 },
  preview: { width: 250, height: 250, marginTop: 20, borderRadius: 8 },
  info: { marginTop: 15, fontSize: 14, fontWeight: "500" },
  uri: { marginTop: 5, fontSize: 12, color: "gray" },
});
