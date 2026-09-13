import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.azad.codname',
  appName: 'CODNAME',
  webDir: '.',
  backgroundColor: '#05070b',
  loggingBehavior: 'none',
  android: {
    backgroundColor: '#05070b'
  },
  ios: {
    contentInset: 'automatic'
  }
};

export default config;
