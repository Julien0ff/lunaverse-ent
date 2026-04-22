import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Wallet, Gift, ArrowUpRight, ArrowDownRight, History } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Dashboard() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView 
      className="flex-1 bg-discord-dark flex-col"
      contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: 100, paddingHorizontal: 16 }}
    >
      <View className="mb-6">
        <Text className="text-4xl font-black text-white tracking-tight leading-none">
          Salut, <Text className="text-discord-blurple">Julien</Text> !
        </Text>
        <Text className="text-discord-muted mt-2 font-medium">Bon retour sur l'ENT LunaVerse.</Text>
      </View>

      <View className="bg-[#18191C]/60 border border-white/10 rounded-2xl p-6 shadow-lg mb-6 overflow-hidden">
        <Text className="text-discord-muted text-xs font-black uppercase tracking-widest mb-2">Solde LunaVerse</Text>
        <View className="flex-row items-end">
          <Text className="text-5xl font-black text-white tracking-tighter">1500</Text>
          <Text className="text-2xl text-discord-blurple font-black ml-1 mb-1">€</Text>
        </View>

        <View className="flex-row gap-4 mt-8">
          <TouchableOpacity className="flex-1 bg-discord-blurple rounded-xl py-3 flex-row items-center justify-center">
            <ArrowUpRight size={20} color="white" />
            <Text className="text-white font-bold ml-2">Transférer</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 bg-white/10 border border-white/10 rounded-xl py-3 flex-row items-center justify-center">
            <History size={20} color="white" />
            <Text className="text-white font-bold ml-2">Historique</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="bg-[#18191C]/60 border border-discord-success/20 rounded-2xl p-6 shadow-lg mb-6">
        <View className="flex-row items-center justify-between mb-6">
          <View className="w-12 h-12 bg-discord-success/20 rounded-2xl items-center justify-center">
            <Gift size={24} color="#57F287" />
          </View>
          <View className="bg-discord-success/20 px-2 py-1 rounded-lg">
            <Text className="text-[10px] font-black uppercase tracking-widest text-discord-success">Disponible</Text>
          </View>
        </View>
        <Text className="text-xs font-black text-discord-muted uppercase tracking-widest mb-1">Daily Reward</Text>
        <Text className="text-3xl font-black text-white mb-4">50 €</Text>
        
        <TouchableOpacity className="w-full bg-discord-success rounded-xl py-3 items-center justify-center shadow-lg">
          <Text className="text-[#1E2124] font-bold">Récupérer maintenant</Text>
        </TouchableOpacity>
      </View>

      <Text className="text-xs font-black text-discord-muted uppercase tracking-widest px-2 mb-4 mt-2">Activité récente</Text>
      <View className="bg-[#18191C]/60 border border-white/10 rounded-2xl p-2 mb-6">
        {[1, 2, 3].map((i) => (
          <View key={i} className="flex-row items-center p-3">
            <View className="w-10 h-10 bg-discord-success/20 rounded-xl items-center justify-center">
              <ArrowDownRight size={20} color="#57F287" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-sm font-bold text-white">Salaire Hebdomadaire</Text>
              <Text className="text-[10px] font-bold text-discord-muted uppercase tracking-widest">12 Octobre</Text>
            </View>
            <Text className="text-sm font-black text-discord-success">+500 €</Text>
          </View>
        ))}
      </View>

    </ScrollView>
  );
}
