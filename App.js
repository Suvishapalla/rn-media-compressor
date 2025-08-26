import React, {useState} from 'react';
import {View, Text, Button, Image, Platform} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {Image as RNImage, Video} from 'react-native-compressor';
import RNFS from 'react-native-fs';

export default function App() {
  const [log, setLog] = useState('');
  const [previewUri, setPreviewUri] = useState(null);
  const [afterSize, setAfterSize] = useState(null);

  const pick = async () => {
    setLog('Opening library...');
    const res = await launchImageLibrary({
      mediaType: 'mixed',
      selectionLimit: 1,
      includeExtra: true
    });

    const a = res.assets?.[0];
    if (!a?.uri) {
      setLog('No file selected');
      return;
    }

    try {
      const isVideo = !!a.duration || (a.type?.startsWith('video/') ?? false);
      setLog(`Selected ${isVideo ? 'video' : 'image'}\nOriginal size: ${formatBytes(a.fileSize || 0)}`);

      let outPath;

      if (isVideo) {
        // sensible defaults. reduce width and bitrate automatically
        outPath = await Video.compress(a.uri, {
          compressionMethod: 'auto'
        });
      } else {
        // downscale long edge and apply quality
        outPath = await RNImage.compress(a.uri, {
          maxWidth: 1600,
          quality: 0.8
        });
      }

      setPreviewUri(outPath);

      // read size of the output file
      const stat = await RNFS.stat(outPath.replace('file://', ''));
      setAfterSize(formatBytes(Number(stat.size)));
      setLog(l => l + `\nCompressed to: ${outPath}`);
    } catch (e) {
      setLog(`Error: ${String(e)}`);
    }
  };

  return (
    <View style={{flex: 1, padding: 16, gap: 12, justifyContent: 'center'}}>
      <Text style={{fontSize: 18, fontWeight: '600'}}>RN Media Compressor</Text>
      <Button title="Pick photo or video" onPress={pick} />

      {previewUri && previewUri.match(/\.(jpg|jpeg|png|heic|webp)$/i) ? (
        <Image source={{uri: previewUri}} style={{width: 200, height: 200, resizeMode: 'cover'}} />
      ) : null}

      {afterSize ? <Text>Compressed size: {afterSize}</Text> : null}
      <Text selectable style={{fontSize: 12, color: '#555'}}>{log}</Text>
    </View>
  );
}

function formatBytes(n) {
  if (!n || isNaN(n)) return 'unknown';
  const k = 1024;
  const units = ['B','KB','MB','GB'];
  const i = Math.floor(Math.log(n) / Math.log(k));
  return `${(n/Math.pow(k, i)).toFixed(1)} ${units[i]}`;
}
