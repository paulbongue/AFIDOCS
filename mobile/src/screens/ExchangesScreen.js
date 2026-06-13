import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { useAuth } from '../context/AuthContext';
import ClassDiscussion from '../components/ClassDiscussion';
import Feed from '../components/Feed';
import { colors } from '../theme';

// Espaces d'échange : bascule entre la discussion de classe et les annonces.
// L'admin n'a pas accès aux espaces de classe (uniquement les annonces).
export default function ExchangesScreen() {
  const { user } = useAuth();
  const canClass = user?.role !== 'admin';
  const [tab, setTab] = useState(canClass ? 'classe' : 'annonces');

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

      {tab === 'classe' && canClass ? <ClassDiscussion /> : <Feed />}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  toggle: { flexDirection: 'row', gap: 8, padding: 12, backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border },
  tBtn: { flex: 1, paddingVertical: 9, borderRadius: 20, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border },
  tOn: { backgroundColor: colors.red, borderColor: colors.red },
  tText: { fontWeight: '800', color: colors.textMuted, fontSize: 13 },
  tTextOn: { color: '#fff' },
});
