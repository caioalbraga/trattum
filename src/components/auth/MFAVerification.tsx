import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Shield, Mail, RefreshCw } from "lucide-react";
import { useMFA } from "@/hooks/useMFA";
import { toast } from "sonner";

interface MFAVerificationProps {
  onSuccess: () => void;
  onCancel?: () => void;
  userEmail?: string;
}

export function MFAVerification({ onSuccess, onCancel, userEmail }: MFAVerificationProps) {
  const [code, setCode] = useState("");
  const [trustDevice, setTrustDevice] = useState(true);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { loading, error, sendOTP, verifyOTP } = useMFA();

  // Countdown for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Send OTP on mount
  useEffect(() => {
    handleSendCode();
  }, []);

  const handleSendCode = async () => {
    const result = await sendOTP();
    if (result?.success) {
      setCodeSent(true);
      setCountdown(60); // 60 seconds cooldown
      toast.success("Código enviado para seu e-mail");
      
      // For development: show code in console
      if (result.debug_code) {
        console.log("[DEV] OTP Code:", result.debug_code);
        toast.info(`[DEV] Código: ${result.debug_code}`, { duration: 10000 });
      }
    } else {
      toast.error(error || "Erro ao enviar código");
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast.error("Digite o código de 6 dígitos");
      return;
    }

    const result = await verifyOTP(code, trustDevice);
    if (result?.success) {
      toast.success("Verificação concluída!");
      onSuccess();
    } else {
      toast.error(error || "Código inválido ou expirado");
      setCode("");
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6 p-6">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
        <Shield className="w-8 h-8 text-primary" />
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold font-serif">Verificação em Duas Etapas</h2>
        <p className="text-sm text-muted-foreground">
          {codeSent ? (
            <>
              Enviamos um código de 6 dígitos para{" "}
              <span className="font-medium text-foreground">
                {userEmail || "seu e-mail"}
              </span>
            </>
          ) : (
            "Aguarde enquanto enviamos o código..."
          )}
        </p>
      </div>

      {codeSent && (
        <>
          <div className="flex flex-col items-center gap-4">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={(value) => setCode(value)}
              disabled={loading}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>

            <button
              type="button"
              onClick={handleSendCode}
              disabled={countdown > 0 || loading}
              className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              {countdown > 0 
                ? `Reenviar em ${countdown}s` 
                : "Reenviar código"}
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="trust-device"
              checked={trustDevice}
              onCheckedChange={(checked) => setTrustDevice(checked === true)}
            />
            <Label 
              htmlFor="trust-device" 
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Confiar neste dispositivo por 7 dias
            </Label>
          </div>

          <div className="flex flex-col gap-2 w-full">
            <Button 
              onClick={handleVerify} 
              disabled={loading || code.length !== 6}
              className="w-full"
            >
              {loading ? "Verificando..." : "Verificar"}
            </Button>
            
            {onCancel && (
              <Button 
                variant="ghost" 
                onClick={onCancel}
                className="w-full"
              >
                Cancelar
              </Button>
            )}
          </div>
        </>
      )}

      {!codeSent && loading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Mail className="w-4 h-4 animate-pulse" />
          <span className="text-sm">Enviando código...</span>
        </div>
      )}
    </div>
  );
}
