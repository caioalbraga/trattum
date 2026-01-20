import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Users,
  Loader2,
  Filter,
  MessageCircle,
  User,
  Ban
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Profile {
  id: string;
  user_id: string;
  nome: string | null;
  whatsapp: string | null;
  cpf: string | null;
  created_at: string;
  tratamento_status?: string;
  avaliacao_status?: string;
}

export default function AdminCRM() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch treatments to get status
      const { data: tratamentosData } = await supabase
        .from('tratamentos')
        .select('user_id, status');

      // Fetch evaluations to identify blocked users
      const { data: avaliacoesData } = await supabase
        .from('avaliacoes')
        .select('user_id, status, imc, score_risco');

      // Merge data
      const mergedProfiles = (profilesData || []).map(profile => {
        const tratamento = tratamentosData?.find(t => t.user_id === profile.user_id);
        const avaliacao = avaliacoesData?.find(a => a.user_id === profile.user_id);
        return {
          ...profile,
          tratamento_status: tratamento?.status,
          avaliacao_status: avaliacao?.status,
        };
      });

      setProfiles(mergedProfiles);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast({
        title: "Erro ao carregar pacientes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = (profile: Profile) => {
    const phone = profile.whatsapp?.replace(/\D/g, '');
    if (!phone) {
      toast({
        title: "WhatsApp não cadastrado",
        description: "Este paciente não possui número de WhatsApp.",
        variant: "destructive",
      });
      return;
    }

    const message = encodeURIComponent(
      `Olá ${profile.nome || 'Paciente'}, sou da equipe clínica da Trattum. Vi seu interesse e gostaria de...`
    );
    
    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
  };

  const filteredProfiles = profiles.filter(p => {
    const matchesSearch = !searchTerm || 
      p.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.whatsapp?.includes(searchTerm) ||
      p.cpf?.includes(searchTerm);

    let matchesFilter = true;
    if (filterType === 'blocked') {
      matchesFilter = p.avaliacao_status === 'bloqueado';
    } else if (filterType === 'no_treatment') {
      matchesFilter = p.tratamento_status === 'nenhum' || !p.tratamento_status;
    } else if (filterType === 'active') {
      matchesFilter = p.tratamento_status === 'ativo';
    }

    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (profile: Profile) => {
    if (profile.avaliacao_status === 'bloqueado') {
      return <Badge variant="destructive">Impedido</Badge>;
    }
    if (profile.tratamento_status === 'ativo') {
      return <Badge variant="default">Ativo</Badge>;
    }
    if (profile.tratamento_status === 'nenhum') {
      return <Badge variant="secondary">Sem tratamento</Badge>;
    }
    return <Badge variant="outline">Novo</Badge>;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-serif text-3xl font-bold">CRM de Pacientes</h1>
          <p className="text-muted-foreground">
            Gerenciamento e retenção de pacientes
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card 
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setFilterType('all')}
          >
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Total de Pacientes</p>
              <p className="text-2xl font-bold">{profiles.length}</p>
            </CardContent>
          </Card>
          <Card 
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setFilterType('active')}
          >
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Com Tratamento Ativo</p>
              <p className="text-2xl font-bold text-emerald-600">
                {profiles.filter(p => p.tratamento_status === 'ativo').length}
              </p>
            </CardContent>
          </Card>
          <Card 
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setFilterType('no_treatment')}
          >
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Sem Tratamento</p>
              <p className="text-2xl font-bold text-amber-600">
                {profiles.filter(p => p.tratamento_status === 'nenhum' || !p.tratamento_status).length}
              </p>
            </CardContent>
          </Card>
          <Card 
            className="cursor-pointer hover:bg-muted/50 transition-colors border-destructive/20"
            onClick={() => setFilterType('blocked')}
          >
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Ban className="h-4 w-4 text-destructive" />
                <p className="text-sm text-muted-foreground">Impedidos (IMC&lt;27 / Idade&lt;18)</p>
              </div>
              <p className="text-2xl font-bold text-destructive">
                {profiles.filter(p => p.avaliacao_status === 'bloqueado').length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, WhatsApp ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Com tratamento ativo</SelectItem>
              <SelectItem value="no_treatment">Sem tratamento</SelectItem>
              <SelectItem value="blocked">Impedidos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif flex items-center gap-2">
              <Users className="h-5 w-5" />
              Pacientes ({filteredProfiles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum paciente encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProfiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-4 w-4" />
                          </div>
                          <span className="font-medium">
                            {profile.nome || 'Sem nome'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {profile.whatsapp || '-'}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {profile.cpf || '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(profile.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(profile)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openWhatsApp(profile)}
                          className="gap-2"
                        >
                          <MessageCircle className="h-4 w-4" />
                          WhatsApp
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
