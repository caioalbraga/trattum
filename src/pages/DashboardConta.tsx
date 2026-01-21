import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { User, MapPin, CreditCard, AlertTriangle, Camera } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  profileSchema, 
  enderecoSchema, 
  type ProfileFormData, 
  type EnderecoFormData 
} from '@/lib/validation-schemas';
import { 
  encryptProfile, 
  decryptProfile, 
  encryptEndereco, 
  decryptEndereco 
} from '@/lib/crypto-client';

interface Pedido {
  id: string;
  valor: number;
  status: string;
  descricao: string | null;
  created_at: string;
}

export default function DashboardConta() {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { nome: '', whatsapp: '', cpf: '' },
  });

  const enderecoForm = useForm<EnderecoFormData>({
    resolver: zodResolver(enderecoSchema),
    defaultValues: {
      cep: '', logradouro: '', numero: '', complemento: '',
      bairro: '', cidade: '', estado: '',
    },
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        // Decrypt sensitive fields
        const decrypted = await decryptProfile(profileData);
        profileForm.reset({
          nome: decrypted?.nome || '',
          whatsapp: decrypted?.whatsapp || '',
          cpf: decrypted?.cpf || '',
        });
        setFotoUrl(profileData.foto_url);
      }

      // Fetch endereco
      const { data: enderecoData } = await supabase
        .from('enderecos')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single();

      if (enderecoData) {
        // Decrypt sensitive fields
        const decrypted = await decryptEndereco(enderecoData);
        enderecoForm.reset({
          cep: decrypted?.cep || '',
          logradouro: decrypted?.logradouro || '',
          numero: decrypted?.numero || '',
          complemento: decrypted?.complemento || '',
          bairro: decrypted?.bairro || '',
          cidade: decrypted?.cidade || '',
          estado: enderecoData.estado || '', // estado is not encrypted
        });
      }

      // Fetch pedidos
      const { data: pedidosData } = await supabase
        .from('pedidos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setPedidos(pedidosData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleProfileSave = async (data: ProfileFormData) => {
    if (!user) return;
    setLoading(true);

    try {
      // Encrypt sensitive fields before saving
      const encryptedData = await encryptProfile({
        nome: data.nome.trim(),
        whatsapp: data.whatsapp.trim(),
        cpf: data.cpf.trim(),
      });

      const { error } = await supabase
        .from('profiles')
        .update(encryptedData)
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success('Dados pessoais atualizados!');
    } catch (error) {
      toast.error('Erro ao atualizar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleEnderecoSave = async (data: EnderecoFormData) => {
    if (!user) return;
    setLoading(true);

    try {
      // Encrypt sensitive address fields
      const encryptedData = await encryptEndereco({
        cep: data.cep.trim(),
        logradouro: data.logradouro.trim(),
        numero: data.numero.trim(),
        complemento: data.complemento.trim(),
        bairro: data.bairro.trim(),
        cidade: data.cidade.trim(),
      });

      // Add non-encrypted field
      const fullData = {
        ...encryptedData,
        estado: data.estado.trim().toUpperCase(),
      };

      // Check if address exists
      const { data: existing } = await supabase
        .from('enderecos')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single();

      if (existing) {
        await supabase
          .from('enderecos')
          .update(fullData)
          .eq('id', existing.id);
      } else {
        await supabase
          .from('enderecos')
          .insert({ ...fullData, user_id: user.id, is_default: true });
      }

      toast.success('Endereço atualizado!');
    } catch (error) {
      toast.error('Erro ao atualizar endereço');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    toast.info('Entre em contato com o suporte para excluir sua conta.');
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // For now, just show a placeholder - implement storage later
    toast.info('Upload de foto será implementado em breve.');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pago': return 'bg-teal/10 text-teal';
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'enviado': return 'bg-blue-100 text-blue-800';
      case 'entregue': return 'bg-green-100 text-green-800';
      case 'cancelado': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const initials = profileForm.watch('nome')?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-serif text-3xl lg:text-4xl font-semibold text-foreground">
            Minha Conta
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie suas informações pessoais e configurações.
          </p>
        </div>

        <Tabs defaultValue="dados" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto">
            <TabsTrigger value="dados" className="py-3">
              <User className="w-4 h-4 mr-2" />
              Dados Pessoais
            </TabsTrigger>
            <TabsTrigger value="endereco" className="py-3">
              <MapPin className="w-4 h-4 mr-2" />
              Endereço
            </TabsTrigger>
            <TabsTrigger value="faturamento" className="py-3">
              <CreditCard className="w-4 h-4 mr-2" />
              Faturamento
            </TabsTrigger>
            <TabsTrigger value="perigo" className="py-3">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Zona de Perigo
            </TabsTrigger>
          </TabsList>

          {/* Dados Pessoais */}
          <TabsContent value="dados" className="mt-6">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="font-serif text-xl">Detalhes da Conta</CardTitle>
                <CardDescription>
                  Atualize suas informações pessoais
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Avatar */}
                <div className="flex items-center gap-4 mb-8">
                  <div className="relative">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={fotoUrl || undefined} />
                      <AvatarFallback className="text-lg bg-secondary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
                      <Camera className="w-4 h-4 text-primary-foreground" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />
                    </label>
                  </div>
                  <div>
                    <p className="font-medium">{profileForm.watch('nome') || 'Seu nome'}</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                </div>

                <form onSubmit={profileForm.handleSubmit(handleProfileSave)} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome Completo</Label>
                      <Input
                        id="nome"
                        {...profileForm.register('nome')}
                        placeholder="Seu nome completo"
                      />
                      {profileForm.formState.errors.nome && (
                        <p className="text-sm text-destructive">{profileForm.formState.errors.nome.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">WhatsApp</Label>
                      <Input
                        id="whatsapp"
                        {...profileForm.register('whatsapp')}
                        placeholder="(11) 99999-9999"
                      />
                      {profileForm.formState.errors.whatsapp && (
                        <p className="text-sm text-destructive">{profileForm.formState.errors.whatsapp.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 max-w-sm">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      {...profileForm.register('cpf')}
                      placeholder="000.000.000-00"
                    />
                    {profileForm.formState.errors.cpf && (
                      <p className="text-sm text-destructive">{profileForm.formState.errors.cpf.message}</p>
                    )}
                  </div>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Endereço */}
          <TabsContent value="endereco" className="mt-6">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="font-serif text-xl">Endereço de Entrega</CardTitle>
                <CardDescription>
                  Defina seu endereço principal para entregas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={enderecoForm.handleSubmit(handleEnderecoSave)} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="cep">CEP</Label>
                      <Input
                        id="cep"
                        {...enderecoForm.register('cep')}
                        placeholder="00000-000"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="logradouro">Logradouro</Label>
                      <Input
                        id="logradouro"
                        {...enderecoForm.register('logradouro')}
                        placeholder="Rua, Avenida..."
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="numero">Número</Label>
                      <Input
                        id="numero"
                        {...enderecoForm.register('numero')}
                        placeholder="123"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="complemento">Complemento</Label>
                      <Input
                        id="complemento"
                        {...enderecoForm.register('complemento')}
                        placeholder="Apto, Bloco..."
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="bairro">Bairro</Label>
                      <Input
                        id="bairro"
                        {...enderecoForm.register('bairro')}
                        placeholder="Bairro"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cidade">Cidade</Label>
                      <Input
                        id="cidade"
                        {...enderecoForm.register('cidade')}
                        placeholder="Cidade"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estado">Estado</Label>
                      <Input
                        id="estado"
                        {...enderecoForm.register('estado')}
                        placeholder="SP"
                        maxLength={2}
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Salvando...' : 'Salvar Endereço'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Faturamento */}
          <TabsContent value="faturamento" className="mt-6">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="font-serif text-xl">Faturamento e Pedidos</CardTitle>
                <CardDescription>
                  Histórico de transações e gestão de planos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pedidos.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum pedido realizado ainda.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {pedidos.map((pedido) => (
                      <div
                        key={pedido.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-border/40"
                      >
                        <div>
                          <p className="font-medium">
                            {pedido.descricao || 'Pedido'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(pedido.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(pedido.status)}`}>
                            {pedido.status}
                          </span>
                          <span className="font-semibold">
                            R$ {pedido.valor.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Zona de Perigo */}
          <TabsContent value="perigo" className="mt-6">
            <Card className="card-elevated border-destructive/20">
              <CardHeader>
                <CardTitle className="font-serif text-xl text-destructive">Zona de Perigo</CardTitle>
                <CardDescription>
                  Ações irreversíveis para sua conta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg border border-border/40">
                  <div>
                    <p className="font-medium">Sair da Conta</p>
                    <p className="text-sm text-muted-foreground">
                      Encerre sua sessão atual
                    </p>
                  </div>
                  <Button variant="outline" onClick={signOut}>
                    Sair
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                  <div>
                    <p className="font-medium text-destructive">Excluir Conta</p>
                    <p className="text-sm text-muted-foreground">
                      Exclua permanentemente sua conta e todos os dados
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">Excluir Conta</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. Isso excluirá permanentemente sua conta
                          e removerá seus dados de nossos servidores.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAccount}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Sim, excluir minha conta
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
