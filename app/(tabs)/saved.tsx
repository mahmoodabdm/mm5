import { Feather } from '@expo/vector-icons';
import React from 'react';
import { FlatList, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Paper, useApp } from '@/context/AppContext';

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { palette, savedPapers, removePaper, setPapers } = useApp();

  const openPaper = (paper: Paper) => {
    setPapers(savedPapers);
    router.push({ pathname: '/paper/[id]', params: { id: paper.id } });
  };

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <FlatList
        data={savedPapers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: 110, paddingHorizontal: 18, flexGrow: 1 }}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.eyebrow, { color: palette.primary }]}>مكتبتي</Text>
            <Text style={[styles.title, { color: palette.foreground }]}>الأبحاث المحفوظة</Text>
            <Text style={[styles.subtitle, { color: palette.mutedForeground }]}>تظل متاحة عندك حتى بدون نت.</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: palette.secondary }]}><Feather name="bookmark" size={28} color={palette.primary} /></View>
            <Text style={[styles.emptyTitle, { color: palette.foreground }]}>ماكو أبحاث محفوظة</Text>
            <Text style={[styles.emptyText, { color: palette.mutedForeground }]}>اضغط علامة الحفظ على أي ورقة حتى ترجع لها بوقت ثاني.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => openPaper(item)} style={({ pressed }) => [styles.card, { backgroundColor: palette.card, borderColor: palette.border, opacity: pressed ? 0.92 : 1 }]}>
            <View style={styles.row}>
              <View style={[styles.source, { backgroundColor: palette.secondary }]}><Text style={[styles.sourceText, { color: palette.primary }]}>{item.source}</Text></View>
              <Text style={[styles.year, { color: palette.mutedForeground }]}>{item.year || '—'}</Text>
            </View>
            <Text style={[styles.paperTitle, { color: palette.foreground }]} numberOfLines={3}>{item.title}</Text>
            <Text style={[styles.abstract, { color: palette.mutedForeground }]} numberOfLines={2}>{item.abstract}</Text>
            <View style={styles.actions}>
              <Pressable onPress={() => void Share.share({ message: `${item.title}\n${item.url}` })} hitSlop={10}><Feather name="share-2" size={18} color={palette.mutedForeground} /></Pressable>
              <Pressable onPress={() => removePaper(item.id)} hitSlop={10}><Feather name="trash-2" size={18} color={palette.destructive} /></Pressable>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { alignItems: 'flex-end', marginBottom: 22 },
  eyebrow: { fontSize: 13, fontWeight: '700' },
  title: { fontSize: 25, fontWeight: '700', marginTop: 5 },
  subtitle: { fontSize: 13, marginTop: 7 },
  card: { borderRadius: 17, borderWidth: 1, padding: 16, marginBottom: 12, shadowColor: '#122033', shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  row: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  source: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7 },
  sourceText: { fontSize: 10, fontWeight: '700' },
  year: { fontSize: 12 },
  paperTitle: { fontSize: 16, lineHeight: 24, fontWeight: '700', textAlign: 'right' },
  abstract: { fontSize: 13, lineHeight: 20, textAlign: 'right', marginTop: 10 },
  actions: { flexDirection: 'row', gap: 19, marginTop: 14 },
  empty: { alignItems: 'center', justifyContent: 'center', flex: 1, paddingHorizontal: 35 },
  emptyIcon: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  emptyText: { fontSize: 13, lineHeight: 21, textAlign: 'center', marginTop: 8 },
});