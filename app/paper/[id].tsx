import { Feather } from '@expo/vector-icons';
import Clipboard from 'expo-clipboard';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Paper, useApp } from '@/context/AppContext';
import { summarizeAbstract } from '@/lib/research';

export default function PaperDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { palette, papers, savedPapers, isSaved, savePaper, removePaper, registerPaperView } = useApp();
  const paper = useMemo<Paper | undefined>(() => papers.find((item) => item.id === id) || savedPapers.find((item) => item.id === id), [id, papers, savedPapers]);
  const [summary, setSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAd, setShowAd] = useState(false);
  const viewed = useRef(false);

  useEffect(() => {
    if (!viewed.current) {
      viewed.current = true;
      setShowAd(registerPaperView());
    }
  }, [registerPaperView]);

  if (!paper) {
    return <View style={[styles.missing, { backgroundColor: palette.background }]}><Text style={[styles.missingText, { color: palette.foreground }]}>ما لكينا الورقة المطلوبة.</Text></View>;
  }

  const toggleSave = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    isSaved(paper.id) ? removePaper(paper.id) : savePaper(paper);
  };

  const runSummary = async () => {
    setSummaryLoading(true);
    setError('');
    try {
      setSummary(await summarizeAbstract(paper));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر التلخيص حالياً.');
    } finally {
      setSummaryLoading(false);
    }
  };

  const copy = async () => {
    await Clipboard.setStringAsync(`${paper.title}\n\n${paper.abstract}`);
    Alert.alert('تم النسخ', 'نسخت عنوان الورقة وملخصها للحافظة.');
  };

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: 45, paddingHorizontal: 18 }}>
        <View style={styles.nav}>
          <Pressable onPress={() => router.back()} hitSlop={12}><Feather name="arrow-right" size={24} color={palette.foreground} /></Pressable>
          <Text style={[styles.navLabel, { color: palette.mutedForeground }]}>تفاصيل البحث</Text>
          <Pressable onPress={() => void Share.share({ message: `${paper.title}\n${paper.url}` })} hitSlop={12}><Feather name="share-2" size={20} color={palette.primary} /></Pressable>
        </View>
        <View style={[styles.metaRow, { borderBottomColor: palette.border }]}>
          <View style={[styles.source, { backgroundColor: paper.source === 'arXiv' ? '#FFF0E1' : palette.secondary }]}><Text style={[styles.sourceText, { color: paper.source === 'arXiv' ? '#A85C13' : palette.primary }]}>{paper.source}</Text></View>
          <Text style={[styles.meta, { color: palette.mutedForeground }]}>{paper.year || 'سنة غير متوفرة'} · {paper.citationCount.toLocaleString('ar-IQ')} استشهاد</Text>
        </View>
        <Text style={[styles.title, { color: palette.foreground }]}>{paper.title}</Text>
        <Text style={[styles.authors, { color: palette.mutedForeground }]}>{paper.authors.join('، ') || 'مؤلفون غير معروفين'}</Text>
        <View style={[styles.abstractBox, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={[styles.sectionLabel, { color: palette.primary }]}>الملخص الكامل</Text>
          <Text style={[styles.abstract, { color: palette.foreground }]}>{paper.abstract}</Text>
        </View>
        {summary ? (
          <View style={[styles.summaryBox, { backgroundColor: palette.secondary, borderColor: palette.accent }]}>
            <View style={styles.summaryHeading}><Feather name="cpu" size={18} color={palette.primary} /><Text style={[styles.sectionLabel, { color: palette.primary }]}>ملخص بالذكاء الاصطناعي</Text></View>
            <Text style={[styles.abstract, { color: palette.foreground }]}>{summary}</Text>
          </View>
        ) : null}
        {error ? <Text style={[styles.error, { color: palette.destructive }]}>{error}</Text> : null}
        <View style={styles.actions}>
          <Pressable onPress={runSummary} disabled={summaryLoading} style={({ pressed }) => [styles.primaryAction, { backgroundColor: palette.primary, opacity: pressed || summaryLoading ? 0.82 : 1 }]}>
            {summaryLoading ? <ActivityIndicator color={palette.primaryForeground} /> : <Feather name="zap" size={18} color={palette.primaryForeground} />}
            <Text style={[styles.primaryActionText, { color: palette.primaryForeground }]}>{summary ? 'إعادة التلخيص' : 'تلخيص بالذكاء الاصطناعي'}</Text>
          </Pressable>
          <View style={styles.secondaryActions}>
            <Pressable onPress={toggleSave} style={[styles.secondaryAction, { backgroundColor: palette.card, borderColor: palette.border }]}>
              <Feather name="bookmark" size={18} color={palette.primary} />
              <Text style={[styles.secondaryText, { color: palette.foreground }]}>{isSaved(paper.id) ? 'محفوظة' : 'حفظ'}</Text>
            </Pressable>
            <Pressable onPress={copy} style={[styles.secondaryAction, { backgroundColor: palette.card, borderColor: palette.border }]}>
              <Feather name="copy" size={18} color={palette.primary} />
              <Text style={[styles.secondaryText, { color: palette.foreground }]}>نسخ</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
      <Modal visible={showAd} transparent animationType="fade" onRequestClose={() => setShowAd(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: palette.card }]}>
            <View style={[styles.modalIcon, { backgroundColor: palette.secondary }]}><Feather name="monitor" size={25} color={palette.primary} /></View>
            <Text style={[styles.modalTitle, { color: palette.foreground }]}>إعلان بيني</Text>
            <Text style={[styles.modalText, { color: palette.mutedForeground }]}>ca-app-pub-... · interstitial placeholder</Text>
            <Pressable onPress={() => setShowAd(false)} style={[styles.modalButton, { backgroundColor: palette.primary }]}><Text style={styles.modalButtonText}>متابعة القراءة</Text></Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  nav: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  navLabel: { fontSize: 13, fontWeight: '600' },
  metaRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, borderBottomWidth: 1 },
  source: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8 },
  sourceText: { fontSize: 11, fontWeight: '700' },
  meta: { fontSize: 12 },
  title: { fontSize: 25, lineHeight: 35, fontWeight: '700', textAlign: 'right', marginTop: 18 },
  authors: { fontSize: 13, lineHeight: 21, textAlign: 'right', marginTop: 10 },
  abstractBox: { borderWidth: 1, borderRadius: 17, padding: 16, marginTop: 22 },
  summaryBox: { borderWidth: 1, borderRadius: 17, padding: 16, marginTop: 14 },
  summaryHeading: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 11 },
  sectionLabel: { fontSize: 13, fontWeight: '700', textAlign: 'right' },
  abstract: { fontSize: 15, lineHeight: 27, textAlign: 'right', marginTop: 10 },
  actions: { marginTop: 18, gap: 10 },
  primaryAction: { height: 54, borderRadius: 15, flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 9 },
  primaryActionText: { fontSize: 14, fontWeight: '700' },
  secondaryActions: { flexDirection: 'row-reverse', gap: 10 },
  secondaryAction: { height: 50, flex: 1, borderRadius: 14, borderWidth: 1, flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 8 },
  secondaryText: { fontSize: 14, fontWeight: '600' },
  error: { fontSize: 12, textAlign: 'right', marginTop: 12 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(3, 10, 20, 0.72)', alignItems: 'center', justifyContent: 'center', padding: 25 },
  modalCard: { borderRadius: 22, padding: 24, width: '100%', alignItems: 'center' },
  modalIcon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalText: { fontSize: 11, marginTop: 8, textAlign: 'center' },
  modalButton: { borderRadius: 12, paddingHorizontal: 22, paddingVertical: 12, marginTop: 20 },
  modalButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  missingText: { fontSize: 16 },
});