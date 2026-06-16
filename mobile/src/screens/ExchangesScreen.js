import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { useAuth } from '../context/AuthContext';
import ClassDiscussion from '../components/ClassDiscussion';
import Feed from '../components/Feed';
import { colors, shadow } from '../theme';

// Espaces d'échange : bascule entre la discussion de classe et les annonces.
// L'admin n'a pas accès aux espaces de classe (uniquement les annonces).
export default function ExchangesScreen({ route }) {
  const { user } = useAuth();
  const canClass = user?.role !== 'admin';
  const wanted = route?.params?.tab;
  const [tab, setTab] = useState(wanted === 'annonces' || !canClass ? 'annonces' : (wanted || 'classe'));

  // Arrivée depuis une notification : sélectionne le bon onglet.
  useEffect(() => {
    if (route?.params?.tab) {
      setTab(route.params.tab === 'annonces' || !canClass ? 'annonces' : 'classe');
    }
  }, [route?.params?.tab, route?.params?.ts, canClass]);

  const focusPost = route?.params?.focusPost;
  const focusMsg = route?.params?.focusMsg;
  const ts = route?.params?.ts;

  return (
    <View style={styles.flex}>
      <View style={styles.toggle}>
        {canClass && (
          <TouchableOpacity style={[styles.tBtn, tab === 'classe' && styles.tOn]} onPress={() => setTab('classe')}>
            <Text style={[styles.tText, tab === 'classe' && styles.tTextOn]}>Ma classe</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.tBtn, tab === 'annonces' && styles.tOn]} onPress={() => setTab('annonces')}>
          <Text style={[styles.tText, tab === 'annonces' && styles.tTextOn]}>Annonces</Text>
        </TouchableOpacity>
      </View>

      {tab === 'classe' && canClass
        ? <ClassDiscussion focusMsg={focusMsg} focusTs={ts} />
        : <Feed focusPost={focusPost} fo