import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { searchPapers } from '@/lib/research';
import { Paper, useApp } from '@/context/AppContext';

const filters = ['الكل', 'ذكاء اصطناعي', 'طب', 'هندسة'];

function AdBanner({ palette }: { palette: ReturnType<typeof useApp>['palette'] }) {
  return (
    <View style={[styles.ad, { backgroundColor: palette.secondary, borderColor: palette.border }]}>
      <View style={[styles.adBadge, { backgroundColor: palette.primary }]}>
        <Text style={styles.adBadgeText}>إعلان</Text>
      </View>
      <View style={styles.adCopy}>
        <Text style={[styles.adTitle, { color: palette.foreground }]}>مساحة إعلانية</Text>
        <Text style={[styles.adSub, { color: palette.mutedForeground }]}>ca-app-pub-... · AdMob banner</Text>
      </View>
      <Feather name="more-horizontal" size={20} color={palette.mutedForeground} />
    </View>
  );
}

function ShimmerCard({ palette }: { palette: ReturnType<typeof useApp>['palette'] }) {
  return (
    <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
      <View style={[styles.shimmerLine, { backgroundColor: palette.muted, width: '86%' }]} />
      <View style={[styles.shimmerLine, { backgroundColor: palette.muted, width: '63%' }]} />
      <View style={[styles.shimmerLine, { backgroundColor: palette.muted, width: '100%', height: 46 }]} />
      <View style={[styles.shimmerLine, { backgroundColor: palette.muted, width: '42%' }]} />
    </View>
  );
}

function PaperCard({ paper, palette, saved, onSave, onPress }: {
  paper: Paper; palette: ReturnType<typeof useApp>['palette']; saved: boolean; onSave: () => void; onPress: () => void;
}) {
  const share = () => void Share.share({ message: `${paper.title}\n${paper.url}` });
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, { backgroundColor: palette.card, borderColor: palette.border, opacity: pressed ? 0.92 : 1 }]}>
      <View style={styles.cardTop}>
        <View style={[styles.sourcePill, { backgroundColor: paper.isFallback ? '#FFF7E5' : paper.source === 'arXiv' ? '#FFF0E1' : palette.secondary }]}>
          <Text style={[styles.sourceText, { color: paper.isFallback ? '#9A6A00' : paper.source === 'arXiv' ? '#A85C13' : palette.primary }]}>{paper.isFallback ? 'بيانات تجريبية' : paper.source}</Text>
        </View>
        <Text style={[styles.year, { color: palette.mutedForeground }]}>{paper.year || '—'}</Text>
      </View>
      <Text style={[styles.paperTitle, { color: palette.foreground }]} numberOfLines={3}>{paper.title}</Text>
      <Text style={[styles.authors, { color: palette.mutedForeground }]} numberOfLines={1}>{paper.authors.join('، ') || 'مؤلفون غير معروفين'}</Text>
      <Text style={[styles.abstract, { color: palette.mutedForeground }]} numberOfLines={3}>{paper.abstract}</Text>
      <View style={styles.cardBottom}>
        <View style={styles.citation}>
          <Feather name="bar-chart-2" size={15} color={palette.primary} />
          <Text style={[styles.citationText, { color: palette.mutedForeground }]}>{paper.citationCount.toLocaleString('ar-IQ')} استشهاد</Text>
        </View>
        <View style={styles.iconActions}>
          <Pressable testID={`save-${paper.id}`} onPress={(event) => { event.stopPropagation(); onSave(); }} hitSlop={10}>
            <Feather name="bookmark" size={20} color={saved ? palette.primary : palette.mutedForeground} />
          </Pressable>
          <Pressable onPress={(event) => { event.stopPropagation(); share(); }} hitSlop={10}>
            <Feather name="share-2" size={19} color={palette.mutedForeground} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { palette, isDark, toggleTheme, savePaper, removePaper, isSaved, setPapers } = useApp();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('الكل');
  const [results, setResults] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const runSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setNotice('');
    setHasSearched(true);
    try {
      const next = await searchPapers(query.trim(), category);
      setResults(next);
      setPapers(next);
      if (next.some((paper) => paper.isFallback)) {
        setNotice('تعذّر الوصول للمصادر حالياً. نعرض بيانات تجريبية حتى تظل تقدر تجرّب التطبيق.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'صار خلل بالبحث، جرّب مرة ثانية.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSaved = (paper: Paper) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    isSaved(paper.id) ? removePaper(paper.id) : savePaper(paper);
  };

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <FlatList
        data={loading ? [] : results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: 115, paddingHorizontal: 18 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={runSearch} tintColor={palette.primary} />}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <View>
                <Text style={[styles.eyebrow, { color: palette.primary }]}>الباحث العلمي</Text>
                <Text style={[styles.greeting, { color: palette.foreground }]}>هلا بيك، شتدور اليوم؟</Text>
              </View>
              <Pressable testID="theme-toggle" onPress={toggleTheme} style={[styles.themeButton, { backgroundColor: palette.card, borderColor: palette.border }]}>
                <Feather name={isDark ? 'sun' : 'moon'} size={19} color={palette.primary} />
              </Pressable>
            </View>
            <View style={[styles.searchBox, { backgroundColor: palette.card, borderColor: palette.input }]}>
              <Feather name="search" size={21} color={palette.primary} />
              <TextInput
                testID="research-search"
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={runSearch}
                placeholder="ابحث عن موضوع علمي..."
                placeholderTextColor={palette.mutedForeground}
                returnKeyType="search"
                style={[styles.searchInput, { color: palette.foreground }]}
              />
              {query.length > 0 ? (
                <Pressable onPress={() => setQuery('')} hitSlop={8}><Feather name="x-circle" size={18} color={palette.mutedForeground} /></Pressable>
              ) : null}
            </View>
            <View style={styles.filterRow}>
              {filters.map((item) => (
                <Pressable key={item} onPress={() => setCategory(item)} style={[styles.filter, { backgroundColor: category === item ? palette.primary : palette.card, borderColor: category === item ? palette.primary : palette.border }]}>
                  <Text style={[styles.filterText, { color: category === item ? palette.primaryForeground : palette.mutedForeground }]}>{item}</Text>
                </Pressable>
              ))}
            </View>
            <AdBanner palette={palette} />
            {notice ? (
              <View style={[styles.noticeBox, { backgroundColor: '#FFF7E5', borderColor: '#F1D38A' }]}>
                <Feather name="info" size={18} color="#9A6A00" />
                <Text style={styles.noticeText}>{notice}</Text>
              </View>
            ) : null}
            <View style={styles.sectionHeading}>
              <Text style={[styles.sectionTitle, { color: palette.foreground }]}>{hasSearched ? 'نتائج البحث' : 'اكتشف أوراق علمية'}</Text>
              {results.length > 0 ? <Text style={[styles.resultCount, { color: palette.mutedForeground }]}>{results.length} نتيجة</Text> : null}
            </View>
            {loading ? <View>{[1, 2, 3].map((item) => <ShimmerCard key={item} palette={palette} />)}</View> : null}
            {error ? (
              <View style={[styles.errorBox, { backgroundColor: palette.card, borderColor: '#F3B5B8' }]}>
                <Feather name="wifi-off" size={22} color={palette.destructive} />
                <Text style={[styles.errorText, { color: palette.foreground }]}>{error}</Text>
                <Pressable onPress={runSearch} style={[styles.retry, { backgroundColor: palette.primary }]}><Text style={styles.retryText}>إعادة المحاولة</Text></Pressable>
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <PaperCard paper={item} palette={palette} saved={isSaved(item.id)} onSave={() => toggleSaved(item)} onPress={() => router.push({ pathname: '/paper/[id]', params: { id: item.id } })} />
        )}
        ListEmptyComponent={!loading && !error ? (
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: palette.secondary }]}><Feather name={hasSearched ? 'search' : 'book-open'} size={28} color={palette.primary} /></View>
            <Text style={[styles.emptyTitle, { color: palette.foreground }]}>{hasSearched ? 'ما لكينا نتائج بعد' : 'ابدأ بسؤال علمي'}</Text>
            <Text style={[styles.emptyText, { color: palette.mutedForeground }]}>{hasSearched ? 'جرّب كلمات أوسع أو غيّر التصنيف.' : 'اكتب موضوعك، وأنا أجيبلك أحدث الأبحاث من مصادر علمية موثوقة.'}</Text>
          </View>
        ) : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  eyebrow: { fontSize: 13, fontWeight: '700', textAlign: 'right', letterSpacing: 0.4 },
  greeting: { fontSize: 25, fontWeight: '700', marginTop: 5, textAlign: 'right' },
  themeButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  searchBox: { height: 58, borderRadius: 17, borderWidth: 1, paddingHorizontal: 16, flexDirection: 'row-reverse', alignItems: 'center', gap: 11, shadowColor: '#0B57D0', shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  searchInput: { flex: 1, fontSize: 16, textAlign: 'right', paddingVertical: 0 },
  filterRow: { flexDirection: 'row-reverse', gap: 8, marginTop: 15, marginBottom: 18 },
  filter: { paddingHorizontal: 15, paddingVertical: 9, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 13, fontWeight: '600' },
  ad: { borderRadius: 16, borderWidth: 1, padding: 13, flexDirection: 'row-reverse', alignItems: 'center', gap: 11, marginBottom: 24 },
  adBadge: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 7 },
  adBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  adCopy: { flex: 1, alignItems: 'flex-end' },
  adTitle: { fontSize: 12, fontWeight: '700' },
  adSub: { fontSize: 10, marginTop: 3 },
  sectionHeading: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 19, fontWeight: '700', textAlign: 'right' },
  resultCount: { fontSize: 12 },
  card: { borderRadius: 17, borderWidth: 1, padding: 16, marginBottom: 12, shadowColor: '#122033', shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  cardTop: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sourcePill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7 },
  sourceText: { fontSize: 10, fontWeight: '700' },
  year: { fontSize: 12 },
  paperTitle: { fontSize: 16, lineHeight: 24, fontWeight: '700', textAlign: 'right' },
  authors: { fontSize: 12, textAlign: 'right', marginTop: 7 },
  abstract: { fontSize: 13, lineHeight: 21, textAlign: 'right', marginTop: 11 },
  cardBottom: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 },
  citation: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  citationText: { fontSize: 11 },
  iconActions: { flexDirection: 'row', gap: 18 },
  shimmerLine: { height: 14, borderRadius: 7, marginBottom: 13 },
  empty: { alignItems: 'center', paddingHorizontal: 35, paddingVertical: 44 },
  emptyIcon: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  emptyText: { fontSize: 13, lineHeight: 21, textAlign: 'center', marginTop: 8 },
  errorBox: { borderRadius: 16, borderWidth: 1, padding: 16, alignItems: 'center', gap: 9, marginBottom: 15 },
  errorText: { fontSize: 13, lineHeight: 20, textAlign: 'center' },
  retry: { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9, marginTop: 3 },
  retryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  noticeBox: { borderRadius: 14, borderWidth: 1, padding: 12, flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 16 },
  noticeText: { flex: 1, color: '#765300', fontSize: 12, lineHeight: 19, textAlign: 'right' },
});
