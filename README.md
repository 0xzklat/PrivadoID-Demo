# RemeSov: Oaxaca Remittance Demo

LATAM's 40M unbanked can't access $160Bn remittances due to:  

- Invasive KYC: Data leaks & surveillance fears (e.g., Venezuela crackdowns).  
- Poor UX: No offline access for rural users (30% MX lacks reliable internet).  
- Fraud Risks: AI deepfakes & ID scams surging 25% in 2025.  

Result: $10Bn+ lost annually to churn & delays.

RemeSov is a React Native application that enables privacy-preserving identity verification and remittances using Zero-Knowledge Proofs (ZKP) on the Solana blockchain. It scans Mexican CURP, Brazilian CPF, or Argentine DNI, generates ZK proofs to verify age (>18) and residency without leaking sensitive data (e.g., CURP redacted, only age/residency verified), and provides instant, offline Single Sign-On (SSO) to platforms like Bitso and Nubank. Inspired by Verifik's zk Face Proof trends, RemeSov prioritizes full privacy, voice-guided simplicity for user trust, and offline ZK + AI fraud checks for robust security.

## Highlights

- **Privacy-First**: Sensitive data (CURP, DNI, CPF) is redacted; only age and residency are verified via ZKPs, ensuring no leaks.
- **Multi-ID Support**: Scans Mexican CURP, Brazilian CPF, and Argentine DNI for broad compatibility.
- **Instant Offline SSO**: Enables secure, offline authentication to Bitso, Nubank, and similar platforms using ZK proofs.
- **Voice Simplicity**: Bilingual (Spanish/Portuguese) text-to-speech (TTS) guides users, building trust through clear, accessible instructions.
- **Offline ZK + AI Security**: Combines offline ZKP generation with AI fraud detection (regex and algorithmic checks) for secure, compliant identity verification.
- **Solana-Powered Remittances**: Executes $100 remittances via SPEI to Oxxo with mock Chainalysis KYT checks on Solana devnet.

## Features

- **ID Scanning**: Uses `react-native-vision-camera` and `react-native-text-recognition` to extract CURP, DNI, or CPF from ID images.
- **AI Fraud Detection**: Validates ID formats, state codes, and check digits with regex and algorithmic checks, ensuring robust fraud prevention.
- **Zero-Knowledge Proofs**: Generates ZK proofs using `snarkjs` and `circomlibjs` to prove age and residency without revealing raw ID data.
- **Solana Integration**: Executes compliant transactions on Solana devnet with mock compliance checks.
- **Bilingual TTS**: Provides audio feedback in English and Spanish for accessibility and trust.
- **Secure Storage**: Stores keys and proofs securely with `react-native-secure-storage`.
- **Responsive UI**: Built with Expo, using Poppins fonts and a clean, mobile-friendly design.

## Prerequisites

- Node.js >= 16.x
- Yarn or npm
- Expo CLI: `npm install -g expo-cli`
- Solana CLI: For funding test accounts (`solana airdrop`)
- Android Studio (for Android) or Xcode (for iOS) for native builds
- A physical device with camera support (iOS/Android)
- JDK 11+ (for Android builds)
- Ruby (for iOS builds with CocoaPods)

## Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/RemeSov-oaxaca-demo.git
   cd RemeSov-oaxaca-demo
   ```

2. **Install Dependencies**:
   ```bash
   yarn install
   ```

3. **Set Up Assets**:
   - Place `circuit.wasm` and `circuit.zkey` in the `assets/` folder for ZKP generation.
   - Ensure assets are correctly referenced in `RemeSovDemo.tsx`.

4. **Configure Solana**:
   - Generate a Solana keypair for testing: `solana-keygen new --outfile ~/.config/solana/id.json`.
   - Fund the payer account: `solana airdrop 1 <your-public-key> --url devnet`.
   - Replace `YOUR_TEST_RECIPIENT_PUBLIC_KEY` in `RemeSovDemo.tsx` with a valid Solana public key.

5. **Configure Android Manifest for Camera Permissions**:
   - Open `android/app/src/main/AndroidManifest.xml`.
   - Ensure the following permissions are added inside the `<manifest>` tag:
     ```xml
     <uses-permission android:name="android.permission.CAMERA" />
     <uses-feature android:name="android.hardware.camera" android:required="true" />
     ```
   - Example `AndroidManifest.xml` snippet:
     ```xml
     <manifest xmlns:android="http://schemas.android.com/apk/res/android"
         package="com.yourapp.RemeSov">
         <uses-permission android:name="android.permission.CAMERA" />
         <uses-feature android:name="android.hardware.camera" android:required="true" />
         <application
             android:label="RemeSov"
             android:icon="@mipmap/ic_launcher">
             <!-- Other configurations -->
         </application>
     </manifest>
     ```
   - If using Expo's managed workflow with custom dev clients, run `npx expo prebuild` to generate the `android/` folder, then modify the manifest as above.

6. **Set Up Native Build Environment**:
   - **Android**:
     - Install Android Studio and set up an Android Virtual Device (AVD) or connect a physical device.
     - Ensure `ANDROID_HOME` environment variable is set (e.g., `export ANDROID_HOME=$HOME/Android/Sdk` on macOS/Linux).
   - **iOS**:
     - Install Xcode and CocoaPods: `gem install cocoapods`.
     - Run `npx pod-install` in the project root to install iOS dependencies.
     - Ensure you have an Apple Developer account for signing (optional for simulator).

## Running the App
**Note**: `react-native-vision-camera` and `react-native-text-recognition` require native modules, so Expo Go is **not supported**. You must build and run a custom native app.

1. **Build and Run on Android**:
   - Ensure an Android emulator is running or a device is connected with USB debugging enabled.
   - Run:
     ```bash
     npx expo run:android
     ```
   - This compiles the native app and installs it on the device/emulator.

2. **Build and Run on iOS**:
   - Ensure an iOS simulator is running or a device is connected.
   - Run:
     ```bash
     npx expo run:ios
     ```
   - This compiles the native app and installs it on the simulator/device.

3. **Development Server**:
   - Start the Metro bundler (if not already running):
     ```bash
     npx expo start
     ```
   - The app will connect to the Metro bundler for hot reloading.

## Usage
1. **Scan ID**: Point the camera at a Mexican CURP, Brazilian CPF, or Argentine DNI to extract the ID.
2. **Generate ZK Proof**: Validate the ID offline and create a ZK proof for age and residency, ensuring full privacy (e.g., CURP redacted, only age/residency verified).
3. **SSO Authentication**: Use the ZK proof for instant, offline SSO to Bitso, Nubank, or similar platforms.
4. **Claim Remittance**: Submit the proof to Solana devnet for a $100 remittance via SPEI to Oxxo (optional demo feature).
5. **Audio Feedback**: Follow bilingual (English/Spanish) TTS instructions for a trusted, accessible experience.

## Project Structure
```
RemeSov-oaxaca-demo/
├── android/               # Native Android project (generated by prebuild)
├── ios/                   # Native iOS project (generated by prebuild)
├── assets/
│   ├── circuit.wasm       # ZKP circuit file
│   └── circuit.zkey       # ZKP proving key  
├── package.json           # Dependencies and scripts
├── RemeSovDemo.tsx      # Main app component
└── README.md              # This file
```

## Dependencies

- `react-native`: Core framework
- `expo`: For asset management and fonts
- `@expo-google-fonts/poppins`: Poppins font family
- `react-native-vision-camera`: Camera functionality
- `react-native-text-recognition`: OCR for CURP/DNI/CPF extraction
- `react-native-tts`: Text-to-speech
- `react-native-secure-storage`: Secure key storage
- `@solana/web3.js`: Solana blockchain integration
- `react-native-snarkjs`: ZKP generation
- `circomlibjs`: Poseidon hash for ZKP inputs

## Notes

- **Chainalysis Integration**: The compliance check is mocked. For production, obtain a Chainalysis KYT API key and update the `complianceCheck` function.
- **ZKP Serialization**: The proof serialization in `claimRemittance` is a placeholder. Implement proper serialization as per the `groth16-sol-verifier` Solana program.
- **Testing**: Ensure the Solana payer account has sufficient funds on devnet. Use a physical device for camera functionality.
- **Camera Permissions**:
  - Android: Permissions are declared in `AndroidManifest.xml`. Users will be prompted at runtime.
  - iOS: Permissions are handled automatically by `react-native-vision-camera` via `Camera.requestCameraPermissionsAsync()`.
- **ID Support**: Currently supports CURP, with placeholder regex for DNI/CPF. Extend `fraudAI` and `parseCURP` functions for full DNI/CPF validation.

## Limitations
- Requires native builds due to `react-native-vision-camera` and `react-native-text-recognition` dependencies.
- ZKP circuit files (`circuit.wasm`, `circuit.zkey`) must be included in `assets/`.
- Chainalysis API is mocked; production requires a real API key.
- Simplified date validation in CURP; enhance for DNI/CPF and edge cases (e.g., leap years).
- DNI/CPF parsing is not fully implemented; extend regex and validation logic for production.

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature-name`.
3. Commit changes: `git commit -m "Add feature"`.
4. Push to the branch: `git push origin feature-name`.
5. Open a pull request.

## License

MIT License. See [LICENSE](LICENSE.txt) for details.

## Acknowledgments

- Built for the Oaxaca remittance demo, addressing the $160B remittance market and financial platform SSO.
- Powered by Solana, ZKPs, and AI for secure, private, and user-friendly authentication.