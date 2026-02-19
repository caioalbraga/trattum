import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings,
  Loader2,
  Package,
  Tag,
  Plus,
  Pencil,
  Save
} from 'lucide-react';
import { couponCodeSchema } from '@/lib/validation-schemas';

interface Produto {
  id: string;
  nome: string;
  preco: number;
  preco_original: number | null;
  ativo: boolean;
  updated_at: string;
}

interface Cupom {
  id: string;
  codigo: string;
  desconto_percentual: number;
  ativo: boolean;
  validade: string | null;
  uso_maximo: number | null;
  uso_atual: number;
}

export default function AdminConfiguracoes() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Product edit state
  const [editingProduct, setEditingProduct] = useState<Produto | null>(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  
  // Coupon edit state
  const [editingCoupon, setEditingCoupon] = useState<Cupom | null>(null);
  const [couponDialogOpen, setCouponDialogOpen] = useState(false);
  const [couponErrors, setCouponErrors] = useState<Record<string, string>>({});
  
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [produtosRes, cuponsRes] = await Promise.all([
        supabase.from('configuracoes_produtos').select('*').order('nome'),
        supabase.from('cupons').select('*').order('codigo'),
      ]);

      if (produtosRes.error) throw produtosRes.error;
      if (cuponsRes.error) throw cuponsRes.error;

      setProdutos(produtosRes.data || []);
      setCupons(cuponsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Erro ao carregar configurações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveProduct = async () => {
    if (!editingProduct) return;
    
    setSaving(true);
    try {
      if (editingProduct.id) {
        // Update existing
        const { error } = await supabase
          .from('configuracoes_produtos')
          .update({
            nome: editingProduct.nome,
            preco: editingProduct.preco,
            preco_original: editingProduct.preco_original,
            ativo: editingProduct.ativo,
          })
          .eq('id', editingProduct.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('configuracoes_produtos')
          .insert({
            nome: editingProduct.nome,
            preco: editingProduct.preco,
            preco_original: editingProduct.preco_original,
            ativo: editingProduct.ativo,
          });

        if (error) throw error;
      }

      toast({
        title: "Produto salvo",
        description: `${editingProduct.nome} foi salvo com sucesso.`,
      });

      setProductDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Erro ao salvar",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleCoupon = async (cupom: Cupom) => {
    try {
      const { error } = await supabase
        .from('cupons')
        .update({ ativo: !cupom.ativo })
        .eq('id', cupom.id);

      if (error) throw error;

      toast({
        title: cupom.ativo ? "Cupom desativado" : "Cupom ativado",
        description: `${cupom.codigo} foi ${cupom.ativo ? 'desativado' : 'ativado'}.`,
      });

      fetchData();
    } catch (error) {
      console.error('Error toggling coupon:', error);
      toast({
        title: "Erro ao atualizar cupom",
        variant: "destructive",
      });
    }
  };

  const saveCoupon = async () => {
    if (!editingCoupon) return;
    
    // Validate coupon data using zod schema
    const validation = couponCodeSchema.safeParse({
      codigo: editingCoupon.codigo,
      desconto_percentual: editingCoupon.desconto_percentual,
      uso_maximo: editingCoupon.uso_maximo,
    });

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach(err => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setCouponErrors(errors);
      toast({
        title: "Erro de validação",
        description: "Corrija os campos destacados.",
        variant: "destructive",
      });
      return;
    }

    setCouponErrors({});
    setSaving(true);
    
    try {
      const validatedData = {
        codigo: validation.data.codigo,
        desconto_percentual: validation.data.desconto_percentual,
        ativo: editingCoupon.ativo,
        uso_maximo: validation.data.uso_maximo,
      };

      if (editingCoupon.id) {
        // Update existing
        const { error } = await supabase
          .from('cupons')
          .update(validatedData)
          .eq('id', editingCoupon.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('cupons')
          .insert(validatedData);

        if (error) throw error;
      }

      toast({
        title: "Cupom salvo",
        description: `${validation.data.codigo} foi salvo com sucesso.`,
      });

      setCouponDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving coupon:', error);
      toast({
        title: "Erro ao salvar cupom",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
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
          <h1 className="font-serif text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">
            Controle de produtos e cupons em tempo real
          </p>
        </div>

        {/* Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-serif flex items-center gap-2">
                <Package className="h-5 w-5" />
                Produtos do Pacote
              </CardTitle>
              <CardDescription>
                Gerencie os produtos incluídos no pacote Trattum
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setEditingProduct({
                  id: '',
                  nome: '',
                  preco: 0,
                  preco_original: null,
                  ativo: true,
                  updated_at: new Date().toISOString(),
                });
                setProductDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Preço Atual</TableHead>
                  <TableHead>Preço Original</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {produtos.map((produto) => (
                  <TableRow key={produto.id}>
                    <TableCell className="font-medium">{produto.nome}</TableCell>
                    <TableCell className="text-emerald-600 font-medium">
                      {formatCurrency(produto.preco)}
                    </TableCell>
                    <TableCell className="text-muted-foreground line-through">
                      {produto.preco_original ? formatCurrency(produto.preco_original) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={produto.ativo ? 'default' : 'secondary'}>
                        {produto.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingProduct(produto);
                          setProductDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Coupons */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-serif flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Cupons de Desconto
              </CardTitle>
              <CardDescription>
                Gerencie cupons promocionais
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setEditingCoupon({
                  id: '',
                  codigo: '',
                  desconto_percentual: 10,
                  ativo: true,
                  validade: null,
                  uso_maximo: null,
                  uso_atual: 0,
                });
                setCouponDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Cupom
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Desconto</TableHead>
                  <TableHead>Uso</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Toggle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cupons.map((cupom) => (
                  <TableRow key={cupom.id}>
                    <TableCell className="font-mono font-medium">{cupom.codigo}</TableCell>
                    <TableCell className="text-emerald-600 font-medium">
                      {cupom.desconto_percentual}%
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {cupom.uso_atual}{cupom.uso_maximo ? `/${cupom.uso_maximo}` : ''}
                    </TableCell>
                    <TableCell>
                      <Badge variant={cupom.ativo ? 'default' : 'secondary'}>
                        {cupom.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Switch
                        checked={cupom.ativo}
                        onCheckedChange={() => toggleCoupon(cupom)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Product Edit Dialog */}
        <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingProduct?.id ? 'Editar' : 'Novo'} Produto</DialogTitle>
            </DialogHeader>
            
            {editingProduct && (
              <div className="space-y-4">
                <div>
                  <Label>Nome do Produto</Label>
                  <Input 
                    value={editingProduct.nome}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      nome: e.target.value
                    })}
                    placeholder="Ex: Semaglutida 2,4mg"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Preço Atual (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editingProduct.preco}
                      onChange={(e) => setEditingProduct({
                        ...editingProduct,
                        preco: parseFloat(e.target.value) || 0
                      })}
                    />
                  </div>
                  <div>
                    <Label>Preço Original (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editingProduct.preco_original || ''}
                      onChange={(e) => setEditingProduct({
                        ...editingProduct,
                        preco_original: parseFloat(e.target.value) || null
                      })}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingProduct.ativo}
                    onCheckedChange={(checked) => setEditingProduct({
                      ...editingProduct,
                      ativo: checked
                    })}
                  />
                  <Label>Produto ativo</Label>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setProductDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={saveProduct} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Coupon Edit Dialog */}
        <Dialog open={couponDialogOpen} onOpenChange={setCouponDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCoupon?.id ? 'Editar' : 'Novo'} Cupom</DialogTitle>
            </DialogHeader>
            
            {editingCoupon && (
              <div className="space-y-4">
                <div>
                  <Label>Código do Cupom</Label>
                  <Input
                    value={editingCoupon.codigo}
                    onChange={(e) => {
                      setEditingCoupon({
                        ...editingCoupon,
                        codigo: e.target.value.toUpperCase()
                      });
                      setCouponErrors(prev => ({ ...prev, codigo: '' }));
                    }}
                    placeholder="Ex: TRATTUM20"
                    className={couponErrors.codigo ? 'border-destructive' : ''}
                  />
                  {couponErrors.codigo && (
                    <p className="text-sm text-destructive mt-1">{couponErrors.codigo}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Desconto (%)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={editingCoupon.desconto_percentual}
                      onChange={(e) => {
                        setEditingCoupon({
                          ...editingCoupon,
                          desconto_percentual: parseInt(e.target.value) || 0
                        });
                        setCouponErrors(prev => ({ ...prev, desconto_percentual: '' }));
                      }}
                      className={couponErrors.desconto_percentual ? 'border-destructive' : ''}
                    />
                    {couponErrors.desconto_percentual && (
                      <p className="text-sm text-destructive mt-1">{couponErrors.desconto_percentual}</p>
                    )}
                  </div>
                  <div>
                    <Label>Uso Máximo (opcional)</Label>
                    <Input
                      type="number"
                      value={editingCoupon.uso_maximo || ''}
                      onChange={(e) => {
                        setEditingCoupon({
                          ...editingCoupon,
                          uso_maximo: parseInt(e.target.value) || null
                        });
                        setCouponErrors(prev => ({ ...prev, uso_maximo: '' }));
                      }}
                      placeholder="Ilimitado"
                      className={couponErrors.uso_maximo ? 'border-destructive' : ''}
                    />
                    {couponErrors.uso_maximo && (
                      <p className="text-sm text-destructive mt-1">{couponErrors.uso_maximo}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingCoupon.ativo}
                    onCheckedChange={(checked) => setEditingCoupon({
                      ...editingCoupon,
                      ativo: checked
                    })}
                  />
                  <Label>Cupom ativo</Label>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setCouponDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={saveCoupon} disabled={saving || !editingCoupon?.codigo}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
