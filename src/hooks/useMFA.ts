import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { generateDeviceFingerprint, getDeviceName } from '@/lib/device-fingerprint';

interface MFACheckResult {
  mfa_required: boolean;
  reason?: string;
  preferred_method?: 'email' | 'totp';
  totp_configured?: boolean;
  device_name?: string;
  expires_at?: string;
}

interface MFASendResult {
  success: boolean;
  message?: string;
  debug_code?: string; // Only in development
}

interface MFAVerifyResult {
  success: boolean;
  message?: string;
  device_trusted?: boolean;
}

export function useMFA() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkMFARequired = useCallback(async (): Promise<MFACheckResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const deviceFingerprint = await generateDeviceFingerprint();

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await supabase.functions.invoke('mfa-check-device', {
        body: { device_fingerprint: deviceFingerprint },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data as MFACheckResult;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendOTP = useCallback(async (): Promise<MFASendResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await supabase.functions.invoke('mfa-send-otp', {
        body: {},
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data as MFASendResult;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyOTP = useCallback(async (
    code: string,
    trustDevice: boolean = false
  ): Promise<MFAVerifyResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const deviceFingerprint = await generateDeviceFingerprint();
      const deviceName = getDeviceName();

      const response = await supabase.functions.invoke('mfa-verify-otp', {
        body: {
          code,
          device_fingerprint: deviceFingerprint,
          device_name: deviceName,
          trust_device: trustDevice,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data as MFAVerifyResult;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    checkMFARequired,
    sendOTP,
    verifyOTP,
  };
}
