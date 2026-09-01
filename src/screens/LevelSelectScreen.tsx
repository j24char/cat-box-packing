import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ImageBackground } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { SAMPLE_LEVELS } from '../models/Level';
import { COLORS, globalStyles } from '../constants/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'LevelSelect'>;

export default function LevelSelectScreen({ navigation }: Props) {
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
          <Text style={[globalStyles.headerTitle, { marginBottom: 0 }]}>Select Level</Text>
          <View style={{ width: 48 }} />
        </View>

        <FlatList
          data={SAMPLE_LEVELS}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.levelCard}
              onPress={() => navigation.navigate('Game', { levelId: item.id })}
              activeOpacity={0.8}
            >
              <Text style={styles.levelNumber}>{item.id}</Text>
              <Text style={styles.levelTitle} numberOfLines={1}>
                {item.title}
              </Text>
            </TouchableOpacity>
          )}
        />
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
    backgroundColor: 'transparent',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 20,
    marginTop: 40,
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  levelCard: {
    ...globalStyles.menuCard,
    flex: 1,
    margin: 8,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardboard,
  },
  levelNumber: {
    fontFamily: 'Fredoka-Bold',
    fontSize: 32,
    color: COLORS.textDark,
  },
  levelTitle: {
    fontFamily: 'Fredoka-Regular',
    fontSize: 12,
    color: COLORS.textDark,
    marginTop: 4,
  },
});