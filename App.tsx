import { StatusBar } from 'expo-status-bar';
import PricingHomeScreen from './src/features/pricing/presentation/screens/PricingHomeScreen';

export default function App() {
  return (
    <>
      <PricingHomeScreen />
      <StatusBar style="auto" />
    </>
  );
}