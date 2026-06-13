import React from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import { colors } from '../theme';
import { Wordmark } from '../components/Logo';
import Avatar from '../components/Avatar';

import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import ResourceListScreen from '../screens/ResourceListScreen';
import ResourceDetailScreen from '../screens/ResourceDetailScreen';
import PreviewScreen from '../screens/PreviewScreen';
import DownloadsScreen from '../screens/DownloadsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ExchangesScreen from '../screens/ExchangesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PublishScreen from '../screens/PublishScreen';
import MyResourcesScreen from '../screens/MyResourcesScreen';
import AdminScreen from '../screens/AdminScreen';
import AdminControlScreen from '../screens/AdminControlScreen';
import AdminModerationScreen from '../screens/AdminModerationScreen';
import AdminPublishScreen from '../screens/AdminPublishScreen';
import AdminPedagogieScreen from '../screens/AdminPedagogieScreen';
import AdminUsersScreen from '../screens/AdminUsersScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// En-tête rouge brique commun (wordmark AFI-DOCS centré + avatar à droite).
function redHeader(navigation, { back = false } = {}) {
  return {
    headerStyle: { backgroundColor: colors.red },
    headerTintColor: '#fff',
    headerShadowVisible: false,
    headerTitleAlign: 'center',
    headerTitle: () => <Wordmark color="#fff" size={20} />,
    headerRight: () => <HeaderAvatar navigation={navigation} />,
  };
}

function HeaderAvatar({ navigation }) {
  const { user } = useAuth();
  return (
    <TouchableOpacity onPress={() => navigation.navigate('Profil')} style={{ marginRight: 6 }}>
      <Avatar name={user?.name} size={32} bg={colors.navy} />
    </TouchableOpacity>
  );
}

function TabIcon({ emoji, color, focused }) {
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
      <Text style={{ fontSize: 18, color }}>{emoji}</Text>
    </View>
  );
}

function RessourcesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="RessourcesList"
        component={ResourceListScreen}
        options={({ navigation }) => redHeader(navigation)}
      />
      <Stack.Screen
        name="RessourceDetail"
        component={ResourceDetailScreen}
        options={({ navigation }) => redHeader(navigation, { back: true })}
      />
      <Stack.Screen
        name="RessourcePreview"
        component={PreviewScreen}
        options={({ navigation }) => redHeader(navigation, { back: true })}
      />
    </Stack.Navigator>
  );
}

function PublierStack() {
  return (
    <Stack.Navigator screenOptions={({ navigation }) => redHeader(navigation)}>
      <Stack.Screen name="PublishHome" component={PublishScreen} />
      <Stack.Screen name="MesRessources" component={MyResourcesScreen} />
    </Stack.Navigator>
  );
}

function AdminStack() {
  return (
    <Stack.Navigator screenOptions={({ navigation }) => redHeader(navigation)}>
      <Stack.Screen name="AdminHome" component={AdminScreen} />
      <Stack.Screen name="AdminControl" component={AdminControlScreen} />
      <Stack.Screen name="AdminModeration" component={AdminModerationScreen} />
      <Stack.Screen name="AdminPublish" component={AdminPublishScreen} />
      <Stack.Screen name="AdminPedagogie" component={AdminPedagogieScreen} />
      <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const { unread } = useNotifications();
  const { user } = useAuth();
  const role = user?.role;
  const insets = useSafeAreaInsets(); // marge basse (boutons/gestes du téléphone)
  return (
    <Tab.Navigator
      initialRouteName="Ressources"
      screenOptions={({ navigation }) => ({
        ...redHeader(navigation),
        tabBarActiveTintColor: colors.red,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          height: 64 + insets.bottom, paddingBottom: 9 + insets.bottom, paddingTop: 7,
          backgroundColor: colors.surface,
          borderTopColor: colors.border, borderTopWidth: 1,
          // légère élévation pour détacher la barre du contenu
          shadowColor: '#101828', shadowOpacity: 0.06, shadowRadius: 8,
          shadowOffset: { width: 0, height: -2 }, elevation: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarItemStyle: { paddingTop: 2 },
      })}
    >
      <Tab.Screen
        name="Accueil"
        component={HomeScreen}
        options={{ tabBarIcon: ({ color, focused }) => <TabIcon emoji="🏠" color={color} focused={focused} /> }}
      />
      <Tab.Screen
        name="Ressources"
        component={RessourcesStack}
        options={{ headerShown: false, tabBarIcon: ({ color, focused }) => <TabIcon emoji="📚" color={color} focused={focused} /> }}
      />
      {/* Onglet spécifique au rôle */}
      {role === 'delegue' && (
        <Tab.Screen
          name="Publier"
          component={PublierStack}
          options={{ headerShown: false, tabBarIcon: ({ color, focused }) => <TabIcon emoji="⬆️" color={color} focused={focused} /> }}
        />
      )}
      {role === 'admin' && (
        <Tab.Screen
          name="Admin"
          component={AdminStack}
          options={{ headerShown: false, tabBarIcon: ({ color, focused }) => <TabIcon emoji="⚙️" color={color} focused={focused} /> }}
        />
      )}
      <Tab.Screen
        name="Échanges"
        component={ExchangesScreen}
        options={{ tabBarIcon: ({ color, focused }) => <TabIcon emoji="💬" color={color} focused={focused} /> }}
      />
      {role !== 'admin' && (
        <Tab.Screen
          name="Hors-ligne"
          component={DownloadsScreen}
          options={{ tabBarIcon: ({ color, focused }) => <TabIcon emoji="📥" color={color} focused={focused} /> }}
        />
      )}
      <Tab.Screen
        name="Notifs"
        component={NotificationsScreen}
        options={{
          tabBarBadge: unread > 0 ? (unread > 9 ? '9+' : unread) : undefined,
          tabBarIcon: ({ color, focused }) => <TabIcon emoji="🔔" color={color} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ color, focused }) => <TabIcon emoji="👤" color={color} focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { user } = useAuth();

  return user ? <MainTabs /> : (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabIcon: { width: 44, height: 30, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tabIconActive: { backgroundColor: colors.salmon },
});
