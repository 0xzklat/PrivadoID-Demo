import React, { useState, useEffect } from 'react';
import { View, Text, Button, Alert, StyleSheet } from 'react-native';
import * as Camera from 'expo-camera';
import Tts from 'react-native-tts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Web3 from '@solana/web3.js';
import snarkjs from 'snarkjs';
import { useFonts, Poppins_400Regular, Poppins_700Bold } from '@expo-google-fonts/poppins';

// Your functions here (fraudAI, generateZKProof, claimRemittance)

export default function App() {
  // State and logic here
  return (
    <View style={styles.container}>
      <Text>Hello PrivadoID</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1F44', justifyContent: 'center', alignItems: 'center' },
});

// Mock fraud AI to detect invalid CURP format
const fraudAI = (id: string) => {
  const anomalies = id.length !== 18 || !/^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/.test(id);
  return anomalies ? 'Fraud Detected' : 'Clear';
};

// Generate offline ZK proof using snarkjs mock
const generateZKProof = async (curp: string) => {
  if (fraudAI(curp) !== 'Clear') throw new Error('Fraud Detected');
  const input = { age: 55, isResident: 1 }; // Mock from CURP
  // Mock snarkjs (replace with real circuit post-MVP)
  const proof = { mockProof: '123' }; // snarkjs.plonk.fullProve(input, 'circuit.wasm', 'zkey_final.zkey');
  const publicSignals = { ageOver18: 1, fraudFree: 1 };
  await AsyncStorage.setItem('zkProof', JSON.stringify({ proof, publicSignals }));
  return { proof, publicSignals };
};

const claimRemittance = async (proof: any) => {
  const connection = new Web3.Connection(Web3.clusterApiUrl('devnet'));
  // Mock tx
  return { success: true, fiatRamp: 'SPEI to Oxxo', amount: 100 };
};

const [step, setStep] = useState(0); // 0: Greeting, 1: Scan, 2: Proof, 3: Claim
const [curp, setCurp] = useState('');
const [proof, setProof] = useState(null);
const [scanning, setScanning] = useState(false);
const [fontsLoaded] = useFonts({ Poppins_400Regular, Poppins_700Bold });

useEffect(() => {
  Tts.setDefaultLanguage('es-MX');
  Tts.setDefaultPitch(1.2);
  if (step === 0) Tts.speak('¡Hola, abuela! Escanea tu CURP para $100 seguros.');
}, [step]);

// Handle CURP scan
const handleScan = async () => {
  const { status } = await Camera.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Error', 'Camera permission needed');
    return;
  }
  setScanning(true);
  setTimeout(() => {
    setCurp('GARC550101HDFRRC07'); // Mock scan
    setScanning(false);
    Tts.speak('CURP escaneada en 10 segundos. Verificando privacidad.');
    setStep(1);
  }, 3000);
};

// Handle ZK proof generation
const handleProof = async () => {
  Tts.speak('Generando prueba privada sin internet...');
  try {
    const zkProof = await generateZKProof(curp);
    setProof(zkProof);
    Tts.speak('¡Prueba lista! Sin datos guardados.');
    setStep(2);
  } catch (error) {
    Tts.speak('Error: CURP inválida.');
    Alert.alert('Error', error.message);
  }
};

// Handle remittance claim
const handleClaim = async () => {
  Tts.speak('Conectando a Bitso offline... Reclamando $100.');
  try {
    const result = await claimRemittance(proof);
    Alert.alert('¡Éxito!', `Remesa de $${result.amount} lista en Oxxo via SPEI.`);
    Tts.speak('¡Gracias! PrivadoID te cuida.');
    setStep(3);
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};

if (!fontsLoaded) return null;

return (
  <View style={styles.container}>
    <Text style={styles.title}>PrivadoID: Oaxaca Demo (30s)</Text>
    <Text style={styles.subtitle}>Step {step + 1}/4</Text>
    {step === 0 && <Button title="Escanear CURP" onPress={handleScan} color="#008080" />}
    {step === 1 && <Text style={styles.info}>CURP: {curp}</Text>}
    {step === 1 && <Button title="Generar Prueba ZK" onPress={handleProof} color="#008080" />}
    {step === 2 && <Text style={styles.info}>Prueba: {proof ? 'ZK + AI OK' : 'Generando...'}</Text>}
    {step === 2 && <Button title="Reclamar $100" onPress={handleClaim} color="#008080" />}
    {step === 3 && <Text style={styles.info}>¡Remesa Segura en Oxxo!</Text>}
    {scanning && <Camera.Camera style={styles.camera} />}
    <Text style={styles.footer}>ZK Compliance + Solana Speed para $160B Remesas</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1F44', justifyContent: 'center', padding: 20 },
  title: { fontFamily: 'Poppins_700Bold', fontSize: 24, color: '#FFD166', textAlign: 'center' },
  subtitle: { fontFamily: 'Poppins_400Regular', fontSize: 18, color: '#F5F5F5', textAlign: 'center' },
  info: { fontFamily: 'Poppins_400Regular', fontSize: 16, color: '#F5F5F5', margin: 10 },
  camera: { flex: 1, marginVertical: 20 },
  footer: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#008080', textAlign: 'center' }
});

if (!permission.granted) {
// Camera permissions are not granted yet
return (
  <View style={styles.container}>
    <Text style={{ textAlign: 'center' }}>We need your permission to show the camera</Text>
    <Button onPress={requestPermission} title="grant permission" />
  </View>
);

}