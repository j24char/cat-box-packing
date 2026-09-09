// src/screens/StatisticsScreen.tsx

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ImageBackground,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS, globalStyles } from '../constants/theme';
import { useAnalytics } from '../hooks/useAnalytics';
import { firebaseProjectId, isFirebaseConfigured } from '../services/analytics/firebaseClient';

type Props = NativeStackScreenProps<RootStackParamList, 'Stats'>;

const formatDate = (ms: number | null): string => {
  if (!ms) return '—';
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
};

const formatNum = (value: number | null): string => (value == null ? '—' : String(value));

const formatRetention = (value: boolean, mature: boolean): string => {
  if (!mature) return '—';
  return value ? 'YES' : 'NO';
};

export default function StatisticsScreen({ navigation }: Props) {
  const { snapshot, ready, syncResult, refresh, flush } = useAnalytics();

  return (
    <ImageBackground
      source={require('../../assets/images/background.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={[globalStyles.container, styles.transparentContainer]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={globalStyles.iconButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={[globalStyles.headerTitle, { marginBottom: 0 }]}>Statistics</Text>
          <TouchableOpacity
            style={globalStyles.iconButton}
            onPress={() => {
              refresh();
              flush();
            }}
          >
            <Text style={styles.backButtonText}>↻</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView}>
          {!ready || !snapshot ? (
            <Text style={styles.emptyText}>Collecting stats…</Text>
          ) : (
            <View style={styles.content}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Overview</Text>
                <Text style={styles.rowText}>
                  Anonymous installation: {snapshot.installationId.slice(0, 8)}…
                </Text>
                <Text style={styles.rowText}>
                  First played: {formatDate(snapshot.createdAtMs)}
                </Text>
                <Text style={styles.rowText}>
                  Firebase: {isFirebaseConfigured() ? `connected to ${firebaseProjectId()}` : 'NOT CONFIGURED'}
                </Text>
                <Text style={styles.rowText}>
                  Last sync: {formatDate(snapshot.lastSyncedAtMs)} {snapshot.pendingChanges > 0 ? `(${snapshot.pendingChanges} unsynced)` : ''}
                </Text>
                {syncResult && (
                  <Text style={styles.rowText}>
                    Sync: {syncResult.ok ? 'OK ✅' : `failed ❌ ${syncResult.error ?? ''}`}
                  </Text>
                )}
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Sessions</Text>
                <Text style={styles.rowText}>Total sessions: {snapshot.sessionCount}</Text>
                <Text style={styles.rowText}>
                  Gameplay duration/session — min {formatNum(snapshot.sessionDurationMinSec)}s
                  {' '}max {formatNum(snapshot.sessionDurationMaxSec)}s
                  {' '}avg {formatNum(snapshot.sessionDurationAvgSec)}s
                </Text>
                <Text style={styles.rowText}>Levels completed: {snapshot.levelsCompleted}</Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Retention</Text>
                <Text style={styles.rowText}>First active date: {snapshot.retention.firstActiveDate ?? '—'}</Text>
                <Text style={styles.rowText}>
                  D1: {formatRetention(snapshot.retention.d1, snapshot.retention.d1Mature)}
                  {' '}D2: {formatRetention(snapshot.retention.d2, snapshot.retention.d2Mature)}
                  {' '}D7: {formatRetention(snapshot.retention.d7, snapshot.retention.d7Mature)}
                </Text>
                <Text style={styles.rowText}>
                  D14: {formatRetention(snapshot.retention.d14, snapshot.retention.d14Mature)}
                  {' '}D30: {formatRetention(snapshot.retention.d30, snapshot.retention.d30Mature)}
                </Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Level interactions (drag & drop, rotate)</Text>
                {snapshot.levelStats.length === 0 ? (
                  <Text style={styles.rowText}>No level attempts recorded yet.</Text>
                ) : (
                  snapshot.levelStats.map((level) => (
                    <View key={level.levelId} style={styles.levelRow}>
                      <Text style={styles.levelLabel}>Level {level.levelId}</Text>
                      <Text style={styles.rowText}>
                        {level.attempts} attempt{level.attempts === 1 ? '' : 's'}, {level.completions} completed
                      </Text>
                      <Text style={styles.rowText}>
                        Interactions — min {formatNum(level.interactionsMin)}
                        {' '}max {formatNum(level.interactionsMax)}
                        {' '}avg {formatNum(level.interactionsAvg)}
                      </Text>
                      {level.completions > 0 && (
                        <Text style={styles.rowText}>
                          Completion time — min {formatNum(level.durationMin)}s
                          {' '}max {formatNum(level.durationMax)}s
                          {' '}avg {formatNum(level.durationAvg)}s
                        </Text>
                      )}
                    </View>
                  ))
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </ImageBackground>
  );
}
const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  transparentContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-start',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 24,
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  content: {
    width: '100%',
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  emptyText: {
    fontFamily: 'Fredoka-Regular',
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 40,
  },
  card: {
    backgroundColor: COLORS.cardboard,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.cardboardDark,
    padding: 12,
    marginBottom: 12,
  },
  cardTitle: {
    fontFamily: 'Fredoka-Bold',
    fontSize: 16,
    color: COLORS.textDark,
    marginBottom: 4,
  },
  rowText: {
    fontFamily: 'Fredoka-Regular',
    fontSize: 13,
    color: COLORS.textDark,
    marginTop: 2,
  },
  levelRow: {
    marginTop: 4,
    padding: 8,
    borderRadius: 10,
    backgroundColor: COLORS.primaryBg,
  },
  levelLabel: {
    fontFamily: 'Fredoka-Bold',
    fontSize: 14,
    color: COLORS.textDark,
  },
});