import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, Smartphone, Mail, Trash2, Monitor } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface TrustedDevice {
  id: string;
  device_name: string;
  trusted_at: string;
  expires_at: string;
  last_used_at: string;
  ip_address: string;
}

interface MFASettings {
  id: string;
  mfa_enabled: boolean;
  preferred_method: 'email' | 'totp';
  totp_verified: boolean;
}

export function MFASettings() {
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch MFA settings
  const { data: mfaSettings, isLoading: loadingSettings } = useQuery({
    queryKey: ['mfa-settings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('mfa_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as MFASettings | null;
    },
  });

  // Fetch trusted devices
  const { data: trustedDevices, isLoading: loadingDevices } = useQuery({
    queryKey: ['trusted-devices'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('trusted_devices')
        .select('*')
        .eq('user_id', user.id)
        .gt('expires_at', new Date().toISOString())
        .order('last_used_at', { ascending: false });

      if (error) throw error;
      return data as TrustedDevice[];
    },
  });

  // Toggle MFA
  const toggleMFA = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (mfaSettings) {
        // Update existing settings
        const { error } = await supabase
          .from('mfa_settings')
          .update({ mfa_enabled: enabled })
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        // Create new settings
        const { error } = await supabase
          .from('mfa_settings')
          .insert({ user_id: user.id, mfa_enabled: enabled });
        if (error) throw error;
      }
    },
    onSuccess: (_, enabled) => {
      queryClient.invalidateQueries({ queryKey: ['mfa-settings'] });
      toast.success(enabled 
        ? 'Verificação em duas etapas ativada' 
        : 'Verificação em duas etapas desativada'
      );
    },
    onError: () => {
      toast.error('Erro ao atualizar configurações');
    },
  });

  // Update preferred method
  const updateMethod = useMutation({
    mutationFn: async (method: 'email' | 'totp') => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('mfa_settings')
        .update({ preferred_method: method })
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mfa-settings'] });
      toast.success('Método de verificação atualizado');
    },
    onError: () => {
      toast.error('Erro ao atualizar método');
    },
  });

  // Remove trusted device
  const removeDevice = useMutation({
    mutationFn: async (deviceId: string) => {
      const { error } = await supabase
        .from('trusted_devices')
        .delete()
        .eq('id', deviceId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trusted-devices'] });
      toast.success('Dispositivo removido');
    },
    onError: () => {
      toast.error('Erro ao remover dispositivo');
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isEnabled = mfaSettings?.mfa_enabled ?? false;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <CardTitle className="font-serif">Verificação em Duas Etapas</CardTitle>
          </div>
          <CardDescription>
            Adicione uma camada extra de segurança à sua conta. Quando ativado, você
            precisará verificar sua identidade em dispositivos não confiáveis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Label htmlFor="mfa-toggle">Ativar 2FA</Label>
                <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
                  Em breve
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Exigir código de verificação em novos dispositivos
              </p>
            </div>
            <Switch
              id="mfa-toggle"
              checked={false}
              disabled={true}
            />
          </div>

          {isEnabled && (
            <div className="space-y-2">
              <Label>Método de verificação preferido</Label>
              <Select
                value={mfaSettings?.preferred_method || 'email'}
                onValueChange={(value) => updateMethod.mutate(value as 'email' | 'totp')}
                disabled={updateMethod.isPending}
              >
                <SelectTrigger className="w-full sm:w-[250px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>Código por e-mail</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="totp" disabled>
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4" />
                      <span>App autenticador (em breve)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Dispositivos confiáveis não precisam verificar por 7 dias.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Monitor className="w-5 h-5 text-primary" />
            <CardTitle className="font-serif">Dispositivos Confiáveis</CardTitle>
          </div>
          <CardDescription>
            Dispositivos que foram verificados e não precisam de 2FA por 7 dias.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingDevices ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : trustedDevices && trustedDevices.length > 0 ? (
            <div className="space-y-3">
              {trustedDevices.map((device) => (
                <div
                  key={device.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <Monitor className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{device.device_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Último uso: {formatDate(device.last_used_at)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Expira: {formatDate(device.expires_at)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeDevice.mutate(device.id)}
                    disabled={removeDevice.isPending}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum dispositivo confiável registrado.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
