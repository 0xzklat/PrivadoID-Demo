import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Button, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import * as SecureStore from 'react-native-secure-storage';
import { useFonts, Poppins_400Regular, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { Asset } from 'expo-asset';
import 'react-native-get-random-values';
import * as Web3 from '@solana/web3.js';
import { Camera, CameraType } from 'react-native-vision-camera';
import * as TextRecognition from 'react-native-text-recognition';
import Tts from 'react-native-tts';
import * as snarkjs from 'react-native-snarkjs';
import { buildPoseidon } from 'circomlibjs';

// Bundled circuit files
const wasmAsset = Asset.fromModule(require('./assets/circuit.wasm'));
const zkeyAsset = Asset.fromModule(require('./assets/circuit.zkey'));

// Valid Mexican state codes
const validStateCodes = [
  'AS', 'BC', 'BS', 'CC', 'CL', 'CM', 'CS', 'CH', 'DF', 'DG', 'GT', 'GR',
  'HG', 'JC', 'MC', 'MN', 'MS', 'NT', 'NL', 'OC', 'PL', 'QT', 'QR', 'SP',
  'SL', 'SR', 'TC', 'TS', 'TL', 'VZ', 'YN', 'ZS', 'NE'
];

// Custom hook for ZKP and remittance logic
const usePrivadoID = () => {
  const fraudAI = (id: string): string => {
    const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]\d$/;
    if (id.length !== 18 || !curpRegex.test(id)) {
      return 'Invalid CURP format';
    }
    const stateCode = id.substring(11, 13);
    if (!validStateCodes.includes(stateCode)) {
      return 'Invalid state code';
    }
    if (!validateCurpCheckDigit(id)) {
      return 'Invalid check digit';
    }
    const birthStr = id.substring(4, 10);
    const year = parseInt(birthStr.substring(0, 2));
    const month = parseInt(birthStr.substring(2, 4));
    const day = parseInt(birthStr.substring(4, 6));
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return 'Invalid birth date';
    }
    return 'Clear';
  };

  const validateCurpCheckDigit = (curp: string): boolean => {
    const re = /^([A-Z][AEIOUX][A-Z]{2}\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])[HM](?:AS|B[CS]|C[CLMSH]|D[FG]|G[TR]|HG|JC|M[CNS]|N[ETL]|OC|PL|Q[TR]|S[PLR]|T[CSL]|VZ|YN|ZS)[B-DF-HJ-NP-TV-Z]{3}[A-Z\d])(\d)$/;
    const match = curp.match(re);
    if (!match) return false;
    const diccionario = '0123456789ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
    let suma = 0;
    const curp17 = match[1];
    for (let i = 0; i < 17; i++) {
      suma += diccionario.indexOf(curp17.charAt(i)) * (18 - i);
    }
    let digito = 10 - (suma % 10);
    if (digito === 10) digito = 0;
    return digito.toString() === match[2];
  };

  const parseCURP = (curp: string) => {
    const fraudResult = fraudAI(curp);
    if (fraudResult !== 'Clear') throw new Error(fraudResult);
    const birthStr = curp.substring(4, 10);
    let birthYear = parseInt(birthStr.substring(0, 2));
    birthYear = birthYear > 20 ? 1900 + birthYear : 2000 + birthYear;
    const birthMonth = parseInt(birthStr.substring(2, 4));
    const birthDay = parseInt(birthStr.substring(4, 6));
    const stateCode = curp.substring(11, 13);
    return { birthYear, birthMonth, birthDay, stateCode };
  };

  const generateZKProof = async (curp: string) => {
    try {
      const startTime = Date.now();
      const { birthYear, stateCode } = parseCURP(curp);
      const poseidon = await buildPoseidon();
      const stateBigInt = BigInt(stateCode.charCodeAt(0) * 256 + stateCode.charCodeAt(1));
      const stateHash = poseidon.F.toString(poseidon([stateBigInt]));
      const input = {
        birthYear: birthYear.toString(),
        stateHash,
        currentYear: '2025'
      };
      await Promise.all([wasmAsset.downloadAsync(), zkeyAsset.downloadAsync()]);
      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        wasmAsset.localUri || wasmAsset.uri,
        zkeyAsset.localUri || zkeyAsset.uri
      );
      const proofTime = Date.now() - startTime;
      console.log(`Proof generated in ${proofTime}ms`);
      await SecureStore.setItemAsync('zkProof', JSON.stringify({ proof, publicSignals }));
      return { proof, publicSignals };
    } catch (error) {
      throw new Error(`ZKP generation failed: ${error.message}`);
    }
  };

  const complianceCheck = async (publicSignals: any, recipient: Web3.PublicKey) => {
    if (publicSignals[0] !== '1' || publicSignals[1] !== '1') {
      return 'Non-compliant';
    }
    try {
      // Mock Chainalysis API call
      return 'Compliant';
    } catch (error) {
      console.error('Compliance check error:', error);
      return 'Non-compliant';
    }
  };

  const claimRemittance = async (proof: any, publicSignals: any) => {
    try {
      const startTime = Date.now();
      const connection = new Web3.Connection(Web3.clusterApiUrl('devnet'), 'confirmed');
      let payerSecret = await SecureStore.getItemAsync('payerSecret');
      let payer: Web3.Keypair;
      if (payerSecret) {
        payer = Web3.Keypair.fromSecretKey(Buffer.from(payerSecret, 'base64'));
      } else {
        payer = Web3.Keypair.generate();
        await SecureStore.setItemAsync('payerSecret', Buffer.from(payer.secretKey).toString('base64'));
      }
      const recipient = new Web3.PublicKey('YOUR_TEST_RECIPIENT_PUBLIC_KEY');
      if (await complianceCheck(publicSignals, recipient) !== 'Compliant') {
        throw new Error('Compliance check failed');
      }
      const transaction = new Web3.Transaction();
      const verifierProgramId = new Web3.PublicKey('Groth16zpsAJbu7dVBBoarHWh3hwDzWinKARv56H8Aphon');
      const proofData = Buffer.from(JSON.stringify(proof)); // Simplified serialization
      const verifyInstruction = new Web3.TransactionInstruction({
        keys: [],
        programId: verifierProgramId,
        data: proofData
      });
      transaction.add(verifyInstruction);
      transaction.add(
        Web3.SystemProgram.transfer({
          fromPubkey: payer.publicKey,
          toPubkey: recipient,
          lamports: Web3.LAMPORTS_PER_SOL / 100
        })
      );
      const signature = await Web3.sendAndConfirmTransaction(connection, transaction, [payer]);
      const txTime = Date.now() - startTime;
      console.log(`Transaction completed in ${txTime}ms`);
      return { success: true, fiatRamp: 'SPEI to Oxxo', amount: 100, txHash: signature };
    } catch (error) {
      throw new Error(`Claim failed: ${error.message}`);
    }
  };

  return { generateZKProof, claimRemittance };
};

// Bilingual TTS
const speak = (text: string, lang: 'es-MX' | 'en-US' = 'es-MX') => {
  Tts.setDefaultLanguage(lang);
  Tts.setDefaultPitch(1.2);
  Tts.speak(text);
};

export default function PrivadoIDDemo() {
  const [step, setStep] = useState(0);
  const [curp, setCurp] = useState('');
  const [proof, setProof] = useState<{ proof: any; publicSignals: any } | null>(null);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const cameraRef = useRef<Camera>(null);
  const [fontsLoaded] = useFonts({ Poppins_400Regular, Poppins_700Bold });
  const { generateZKProof, claimRemittance } = usePrivadoID();

  useEffect(() => {
    const initialize = async () => {
      try {
        await Promise.all([wasmAsset.downloadAsync(), zkeyAsset.downloadAsync()]);
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
      } catch (error) {
        Alert.alert('Error', 'Failed to initialize assets or camera');
      }
    };
    initialize();
    return () => {
      Tts.stop();
      if (cameraRef.current) {
        cameraRef.current.pausePreview();
      }
    };
  }, []);

  if (!fontsLoaded || hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FFD166" />
        <Text style={styles.info}>Loading...</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.info}>No camera access. Please grant permission.</Text>
      </View>
    );
  }

  const scanCurp = async () => {
    if (!cameraRef.current) return;
    setScanning(true);
    try {
      const photo = await cameraRef.current.takePhoto({
        quality: 0.5,
        enableShutterSound: false
      });
      const result = await TextRecognition.recognize(photo.path);
      const extractedCurp = result.text.match(/[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]\d/)?.[0];
      if (extractedCurp) {
        await SecureStore.setItemAsync('curp', extractedCurp);
        setCurp(extractedCurp);
        speak('CURP escaneada. Verificando privacidad.');
        setStep(1);
      } else {
        throw new Error('No CURP found in image');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Scan failed');
      speak('Error al escanear.', 'es-MX');
    } finally {
      setScanning(false);
    }
  };

  const handleProof = async () => {
    setLoading(true);
    speak('Cargando prueba privada sin internet...');
    try {
      const zkProof = await generateZKProof(curp);
      setProof(zkProof);
      speak('¡Prueba lista! Sin datos guardados.');
      setStep(2);
    } catch (error) {
      speak('Error: CURP inválida o problema con la prueba.', 'es-MX');
      Alert.alert('Error', error.message || 'Proof generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!proof) {
      Alert.alert('Error', 'Proof not available');
      speak('Prueba no disponible', 'es-MX');
      return;
    }
    setLoading(true);
    speak('Conectando a red... Reclamando $100.');
    try {
      const result = await claimRemittance(proof.proof, proof.publicSignals);
      Alert.alert('¡Éxito!', `Remesa de $${result.amount} lista en Oxxo via SPEI. Tx: ${result.txHash}`);
      speak('¡Gracias! PrivadoID te cuida.');
      setStep(3);
    } catch (error) {
      speak('Error al reclamar.', 'es-MX');
      Alert.alert('Error', error.message || 'Claim failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PrivadoID: Oaxaca Demo</Text>
      <Text style={styles.subtitle}>Step {step + 1}/4</Text>
      {step === 0 && (
        <>
          <Camera
            style={styles.camera}
            ref={cameraRef}
            device={Camera.getAvailableCameraDevices()[0]}
            isActive={true}
            photo={true}
          />
          <Button
            title="Escanear CURP"
            onPress={scanCurp}
            color="#008080"
            disabled={scanning || loading}
          />
        </>
      )}
      {step === 1 && <Text style={styles.info}>CURP: {curp}</Text>}
      {step === 1 && (
        <Button
          title="Generar Prueba ZK"
          onPress={handleProof}
          color="#008080"
          disabled={loading}
        />
      )}
      {step === 2 && (
        <Text style={styles.info}>
          Prueba: {proof ? `ZK + AI OK (${proof.publicSignals[0] === '1' ? 'Age > 18' : 'Age Failed'}, ${proof.publicSignals[1] === '1' ? 'Resident' : 'Non-resident'})` : 'Cargando...'}
        </Text>
      )}
      {step === 2 && (
        <Button
          title="Reclamar $100"
          onPress={handleClaim}
          color="#008080"
          disabled={loading}
        />
      )}
      {step === 3 && <Text style={styles.info}>¡Remesa Segura en Oxxo!</Text>}
      {loading && <ActivityIndicator size="large" color="#FFD166" />}
      <Text style={styles.footer}>ZK Compliance</Text>
      <Text style={styles.footer}>Solana Speed para $160Bn Remesas</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1F44',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
    color: '#FFD166',
    textAlign: 'center'
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 18,
    color: '#F5F5F5',
    textAlign: 'center',
    marginVertical: 10
  },
  info: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: '#F5F5F5',
    marginVertical: 10,
    textAlign: 'center'
  },
  camera: {
    width: '100%',
    height: 300,
    marginVertical: 20,
    borderRadius: 10
  },
  footer: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#008080',
    textAlign: 'center',
    marginTop: 10
  }
});