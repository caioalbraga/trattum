import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, Loader2, UserCog, Trash2, ShieldCheck } from 'lucide-react';

interface FoundUser {
  id: string;
  email: string;
  nome: string;
  role: string;
  created_at: string;
}

const roleLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  user: { label: 'Paciente', variant: 'secondary' },
  admin: { label: 'Administrador', variant: 'default' },
  medico: { label: 'Médico', variant: 'outline' },
  assistente: { label: 'Assistente', variant: 'outline' },
  nutricionista: { label: 'Nutricionista', variant: 'outline' },
};

export default function AdminUsuarios() {
  const [searchEmail, setSearchEmail] = useState('');
  const [foundUser, setFoundUser] = useState<FoundUser | null>(null);
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [updatingRole, setUpdatingRole] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [decryptedName, setDecryptedName] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchEmail.trim()) return;
    
    setSearching(true);
    setFoundUser(null);
    setNotFound(false);
    setDecryptedName(null);

    try {
      const { data, error } = await supabase.functions.invoke('admin-search-user', {
        body: { email: searchEmail.trim() },
      });

      if (error) throw error;

      if (!data.user) {
        setNotFound(true);
        return;
      }

      setFoundUser(data.user);
      setSelectedRole(data.user.role);

      // Try to decrypt the name
      if (data.user.nome && data.user.nome.includes(':')) {
        try {
          const { data: decData } = await supabase.functions.invoke('decrypt-data', {
            body: { data: data.user.nome, field: 'nome' },
          });
          if (decData?.decrypted) {
            setDecryptedName(decData.decrypted);
          }
        } catch {
          // Use raw name
        }
      } else {
        setDecryptedName(data.user.nome);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Erro ao buscar',
        description: 'Não foi possível realizar a busca.',
        variant: 'destructive',
      });
    } finally {
      setSearching(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!foundUser || !selectedRole || selectedRole === foundUser.role) return;

    setUpdatingRole(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-update-role', {
        body: { targetUserId: foundUser.id, newRole: selectedRole },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({
        title: 'Role atualizada',
        description: `Usuário agora é ${roleLabels[selectedRole]?.label || selectedRole}.`,
      });

      setFoundUser({ ...foundUser, role: selectedRole });
    } catch (error: any) {
      console.error('Update role error:', error);
      toast({
        title: 'Erro ao atualizar role',
        description: error.message || 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!foundUser) return;

    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
        body: { targetUserId: foundUser.id },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({
        title: 'Usuário removido',
        description: 'O usuário foi removido permanentemente.',
      });

      setFoundUser(null);
      setSearchEmail('');
      setDeleteDialogOpen(false);
    } catch (error: any) {
      console.error('Delete user error:', error);
      toast({
        title: 'Erro ao remover usuário',
        description: error.message || 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const displayName = decryptedName || foundUser?.nome || '';

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground flex items-center gap-2">
            <UserCog className="h-6 w-6" />
            Gerenciamento de Usuários
          </h1>
          <p className="text-muted-foreground mt-1">
            Busque, altere permissões ou remova usuários do sistema.
          </p>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Buscar Usuário</CardTitle>
            <CardDescription>Digite o email completo do usuário</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="email@exemplo.com"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-9"
                />
              </div>
              <Button onClick={handleSearch} disabled={searching || !searchEmail.trim()}>
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}
              </Button>
            </div>

            {notFound && (
              <p className="text-sm text-destructive mt-3">
                Nenhum usuário encontrado com este email.
              </p>
            )}
          </CardContent>
        </Card>

        {/* User Found */}
        {foundUser && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Usuário Encontrado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* User Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Nome</span>
                  <p className="font-medium">{displayName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Email</span>
                  <p className="font-medium">{foundUser.email}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Role Atual</span>
                  <div className="mt-0.5">
                    <Badge variant={roleLabels[foundUser.role]?.variant || 'secondary'}>
                      {roleLabels[foundUser.role]?.label || foundUser.role}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Change Role */}
              <div className="border-t border-border/60 pt-4 space-y-3">
                <Label className="text-sm font-medium">Alterar Role</Label>
                <div className="flex gap-2">
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Paciente</SelectItem>
                      <SelectItem value="medico">Médico</SelectItem>
                      <SelectItem value="assistente">Assistente</SelectItem>
                      <SelectItem value="nutricionista">Nutricionista</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleUpdateRole}
                    disabled={updatingRole || selectedRole === foundUser.role}
                    size="sm"
                  >
                    {updatingRole ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                    Confirmar
                  </Button>
                </div>
              </div>

              {/* Delete User */}
              <div className="border-t border-border/60 pt-4">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover Usuário
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Remoção</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja remover este usuário? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <div className="text-sm text-muted-foreground">
              <p><strong>Nome:</strong> {displayName}</p>
              <p><strong>Email:</strong> {foundUser?.email}</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDeleteUser} disabled={deleting}>
                {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Sim, Remover
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
