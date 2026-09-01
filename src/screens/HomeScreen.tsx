// src/screens/HomeScreen.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  SafeAreaView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GameButton } from '../components/GameButton';
import { COLORS, FONTS } from '../constants/theme';

type RootStackParamList = {
  Home: undefined;
  LevelSelect: undefined;
  Game: { levelId: number };
};

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  return (
    <ImageBackground
      source={require('../../assets/images/homescreen.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      {/* Dark overlay mask to ensure button readability over background graphic */}
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <View style={styles.contentContainer}>
            {/* Title Block */}
            <View style={styles.titleContainer}>
              {/* <Text style={[styles.titleText, styles.titleOutline]}>
                CAT BOX
              </Text>
              <Text style={styles.titleText}>CAT BOX</Text>

              <Text style={[styles.subTitleText, styles.subTitleOutline]}>
                PACKING
              </Text>
              <Text style={styles.subTitleText}>PACKING</Text> */}
            </View>

            {/* Menu Buttons */}
            <View style={styles.buttonContainer}>
              <GameButton
                title="PLAY GAME"
                variant="primary"
                onPress={() => navigation.navigate('LevelSelect')}
              />
              <GameButton
                title="QUICK PLAY"
                variant="secondary"
                onPress={() => navigation.navigate('Game', { levelId: 1 })}
              />
            </View>
          </View>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 249, 245, 0)', // Warm semi-transparent tint
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 40,
    position: 'relative',
  },
  titleText: {
    fontFamily: FONTS.title,
    fontSize: 44,
    color: '#FF8A8A',
    textAlign: 'center',
    lineHeight: 50,
  },
  titleOutline: {
    position: 'absolute',
    color: COLORS.textDark,
    top: 3,
    left: 0,
    right: 0,
  },
  subTitleText: {
    fontFamily: FONTS.title,
    fontSize: 38,
    color: '#FFC857',
    textAlign: 'center',
    lineHeight: 44,
  },
  subTitleOutline: {
    position: 'absolute',
    color: COLORS.textDark,
    top: 3,
    left: 0,
    right: 0,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 280,
    marginBottom: 20,
  },
});

export default HomeScreen;