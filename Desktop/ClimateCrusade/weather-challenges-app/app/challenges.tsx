import { View, Text, StyleSheet, FlatList } from 'react-native';
import { StatusBar } from 'expo-status-bar';

type Challenge = {
  id: string;
  title: string;
  description: string;
  points: number;
};

const SAMPLE_CHALLENGES: Challenge[] = [
  {
    id: '1',
    title: 'Reduce Water Usage',
    description: 'Use 20% less water this week during drought conditions',
    points: 50,
  },
  {
    id: '2',
    title: 'Energy Conservation',
    description: 'Cut energy usage during extreme heat by using fans instead of AC',
    points: 75,
  },
  {
    id: '3',
    title: 'Winter Preparedness',
    description: 'Create a winter emergency kit for freezing conditions',
    points: 100,
  },
];

export default function Challenges() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weather Challenges</Text>
      <Text style={styles.subtitle}>Complete challenges based on your local weather</Text>
      
      <FlatList
        data={SAMPLE_CHALLENGES}
        keyExtractor={item => item.id}
        style={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDescription}>{item.description}</Text>
            <Text style={styles.cardPoints}>{item.points} points</Text>
          </View>
        )}
      />
      
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  cardPoints: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'green',
  },
}); 