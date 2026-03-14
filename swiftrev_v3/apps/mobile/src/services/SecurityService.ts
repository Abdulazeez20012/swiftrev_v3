import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

class SecurityService {
    async isSupported(): Promise<boolean> {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        return compatible && types.length > 0;
    }

    async isEnabled(): Promise<boolean> {
        const val = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
        return val === 'true';
    }

    async setEnabled(enabled: boolean): Promise<void> {
        await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, enabled.toString());
    }

    async authenticate(): Promise<boolean> {
        const supported = await this.isSupported();
        const enabled = await this.isEnabled();

        if (!supported || !enabled) return true;

        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Authenticate to access SwiftRev',
            fallbackLabel: 'Use Passcode',
        });

        return result.success;
    }
}

export const securityService = new SecurityService();
