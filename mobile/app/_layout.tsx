import '../global.css';
import { Tabs } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import { LayoutDashboard, Wallet, Globe, ShoppingCart, Shield, Radio, Play, Pause, X, Volume2, VolumeX } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Audio } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

export default function RootLayout() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-[#0F1013]">
      <Tabs
        initialRouteName="index"
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            bottom: insets.bottom > 0 ? insets.bottom : 16,
            left: 16,
            right: 16,
            height: 64,
            borderRadius: 32,
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            paddingBottom: 0,
            paddingTop: 0,
            elevation: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.3,
            shadowRadius: 15,
          },
          tabBarBackground: () => (
            <View style={{ flex: 1, borderRadius: 36, overflow: 'hidden' }}>
              <BlurView
                intensity={85}
                tint="systemMaterialDark"
                style={StyleSheet.absoluteFill}
              />
              <View style={[StyleSheet.absoluteFill, { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 36 }]} />
            </View>
          ),
          tabBarActiveTintColor: '#ffffff',
          tabBarInactiveTintColor: 'rgba(255,255,255,0.3)',
          tabBarShowLabel: false,
          tabBarItemStyle: {
            height: 64,
            width: '100%',
            justifyContent: 'center',
            alignItems: 'center',
          }
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Accueil',
            tabBarIcon: ({ color, focused }) => (
              <View style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', backgroundColor: focused ? 'rgba(88,101,242,0.15)' : 'transparent' }}>
                <LayoutDashboard size={24} color={focused ? '#5865F2' : color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="bank"
          options={{
            title: 'Banque',
            tabBarIcon: ({ color, focused }) => (
              <View style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', backgroundColor: focused ? 'rgba(88,101,242,0.15)' : 'transparent' }}>
                <Wallet size={24} color={focused ? '#5865F2' : color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="social"
          options={{
            title: 'Social',
            tabBarIcon: ({ color, focused }) => (
              <View style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', backgroundColor: focused ? 'rgba(88,101,242,0.15)' : 'transparent' }}>
                <Globe size={24} color={focused ? '#5865F2' : color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="shop"
          options={{
            title: 'Boutique',
            tabBarIcon: ({ color, focused }) => (
              <View style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', backgroundColor: focused ? 'rgba(88,101,242,0.15)' : 'transparent' }}>
                <ShoppingCart size={24} color={focused ? '#5865F2' : color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profil',
            tabBarIcon: ({ color, focused }) => (
              <View style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', backgroundColor: focused ? 'rgba(237,66,69,0.15)' : 'transparent' }}>
                <Shield size={24} color={focused ? '#ED4245' : color} />
              </View>
            ),
          }}
        />
      </Tabs>

      {/* Global Radio Component Overlay */}
      <RadioPlayerNative insets={insets} />
    </View>
  );
}

// ─── Composant RadioPlayer Native ─────────────────────────────────
function RadioPlayerNative({ insets }: { insets: any }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [songInfo, setSongInfo] = useState({ 
    title: 'Luna FM', 
    artist: 'Station en direct', 
    art: '',
    streamUrl: 'https://a13.asurahosting.com/listen/lunfm/radio.mp3'
  });

  // Fetch AzuraCast metadata
  useEffect(() => {
    const fetchNowPlaying = async () => {
      try {
        const res = await fetch('https://a13.asurahosting.com/api/nowplaying', {
          headers: { 'Authorization': 'Bearer 4c4d1bee818be58c:e27f5a7cb9c34e7a50044315504dce59' }
        });
        const data = await res.json();
        let stationData = null;
        if (Array.isArray(data)) {
          stationData = data.find((s: any) =>
            s.station?.shortcode === 'lunfm' ||
            s.station?.name?.toLowerCase().includes('luna')
          ) || data[0];
        } else if (data.now_playing) {
          stationData = data;
        }

        if (stationData?.now_playing?.song) {
          setSongInfo({
            title: stationData.now_playing.song.title || 'Luna\'FM',
            artist: stationData.now_playing.song.artist || 'Station en direct',
            art: stationData.now_playing.song.art || '',
            streamUrl: stationData.station?.listen_url || 'https://a13.asurahosting.com/listen/lunfm/radio.mp3'
          });
        }
      } catch (err) {
        console.log('Failed to fetch AzuraCast metadata', err);
      }
    };

    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 10000);
    return () => clearInterval(interval);
  }, []);

  async function togglePlay() {
    try {
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
        } else {
          await sound.playAsync();
        }
        setIsPlaying(!isPlaying);
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: songInfo.streamUrl },
          { shouldPlay: true, volume: isMuted ? 0 : volume }
        );
        setSound(newSound);
        setIsPlaying(true);
      }
    } catch (e) {
      console.log('Audio error', e);
    }
  }

  async function toggleMute() {
    if (sound) {
      const newMute = !isMuted;
      await sound.setVolumeAsync(newMute ? 0 : volume);
      setIsMuted(newMute);
    } else {
      setIsMuted(!isMuted);
    }
  }

  useEffect(() => {
    let isActive = true;
    const updateVolume = async () => {
      if (sound) {
        try {
          const status = await sound.getStatusAsync();
          if (status.isLoaded && isActive) {
            await sound.setVolumeAsync(isMuted ? 0 : volume);
          }
        } catch (e) {}
      }
    };
    updateVolume();
    return () => { isActive = false; };
  }, [volume, isMuted, sound]);

  useEffect(() => {
    return sound ? () => { sound.unloadAsync(); } : undefined;
  }, [sound]);

  if (!isMinimized) {
    return (
      <View className="absolute inset-0 z-50 bg-[#0F1013]" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        {/* Abstract Background Blur Nodes */}
        <View style={{ position: 'absolute', top: -100, left: -50, width: 300, height: 300, borderRadius: 150, backgroundColor: '#5865F2', opacity: 0.15, transform: [{ scale: 1.5 }] }} />
        <View style={{ position: 'absolute', bottom: -100, right: -50, width: 300, height: 300, borderRadius: 150, backgroundColor: '#ED4245', opacity: 0.1, transform: [{ scale: 1.2 }] }} />

        <View className="flex-1 p-6">
          <View className="flex-row justify-between items-center mb-12 mt-4">
            <TouchableOpacity onPress={() => setIsMinimized(true)} className="w-12 h-12 bg-white/10 rounded-2xl items-center justify-center border border-white/5">
              <X color="white" size={24} />
            </TouchableOpacity>
            <Text className="text-[10px] font-black text-gray-400 uppercase tracking-[4px]">LECTEUR LIVE</Text>
            <View className="w-12 h-12" />
          </View>

          <View className="w-full aspect-square bg-white/5 rounded-[40px] mb-12 items-center justify-center border border-white/10 overflow-hidden shadow-2xl"
            style={{ shadowColor: '#5865F2', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.4, shadowRadius: 30 }}>
            {songInfo.art ? (
              <Image source={{ uri: songInfo.art }} style={StyleSheet.absoluteFill} className="opacity-80" />
            ) : (
              <>
                <BlurView intensity={20} style={StyleSheet.absoluteFill} />
                {isPlaying ? (
                  <Radio color="#5865F2" size={120} />
                ) : (
                  <Radio color="rgba(255,255,255,0.1)" size={120} />
                )}
              </>
            )}

            {/* Gloss Overlay */}
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%', backgroundColor: 'rgba(255,255,255,0.03)' }} />
          </View>

          <View className="mb-10 items-center px-4">
            <Text className="text-3xl font-black text-white mb-2 tracking-tight text-center" numberOfLines={2}>{songInfo.title}</Text>
            <View className="flex-row items-center">
              <View className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-green-500' : 'bg-red-500'} mr-2`} />
              <Text className="text-gray-400 font-bold uppercase tracking-widest text-[11px]">
                {isPlaying ? songInfo.artist : 'Station en pause'}
              </Text>
            </View>
          </View>

          {/* Volume Control */}
          <View className="flex-row items-center gap-4 px-6 mb-12">
            <TouchableOpacity onPress={toggleMute}>
              {isMuted ? <VolumeX color="#ED4245" size={24} /> : <Volume2 color="white" size={24} />}
            </TouchableOpacity>
            <View className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
               <View className="h-full bg-discord-blurple" style={{ width: `${volume * 100}%` }} />
            </View>
            <Text className="text-[10px] font-black text-discord-muted w-8">{Math.round(volume * 100)}%</Text>
          </View>

          <View className="flex-row items-center justify-center mt-auto mb-16 gap-8">
            <TouchableOpacity onPress={togglePlay}
              className="w-24 h-24 bg-[#5865F2] rounded-full flex items-center justify-center shadow-2xl"
              style={{ shadowColor: '#5865F2', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20 }}>
              {isPlaying ? <Pause color="white" size={40} /> : <Play color="white" size={40} style={{ marginLeft: 6 }} />}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Floating Minimized Player
  return (
    <View
      className="absolute left-4 right-4 z-40 rounded-[30px] overflow-hidden border border-white/20 shadow-2xl"
      style={{ bottom: insets.bottom > 0 ? insets.bottom + 88 : 108, shadowColor: '#000', shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.5, shadowRadius: 20 }}
    >
      <View style={StyleSheet.absoluteFill} className="bg-[#121313]/40" />
      <BlurView intensity={90} tint="systemMaterialDark" style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 8, paddingHorizontal: 12 }}>
        <TouchableOpacity onPress={() => setIsMinimized(false)} className="flex-row items-center flex-1 pr-4 py-1">
          <View className={`w-12 h-12 rounded-2xl items-center justify-center overflow-hidden ${isPlaying ? 'bg-[#5865F2]/20' : 'bg-white/5'} border border-white/5`}>
            {songInfo.art ? (
              <Image source={{ uri: songInfo.art }} style={StyleSheet.absoluteFill} />
            ) : (
              <Radio color={isPlaying ? '#5865F2' : 'rgba(255,255,255,0.4)'} size={22} />
            )}
          </View>
          <View className="ml-4 flex-1">
            <Text className="text-[13px] font-black text-white uppercase tracking-wider" numberOfLines={1}>{songInfo.title}</Text>
            <Text className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5" numberOfLines={1}>
              {isPlaying ? songInfo.artist : 'Appuyez pour ouvrir'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={togglePlay} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5">
          {isPlaying ? <Pause color="white" size={22} /> : <Play color="white" size={22} style={{ marginLeft: 2 }} />}
        </TouchableOpacity>
      </BlurView>
    </View>
  );
}
