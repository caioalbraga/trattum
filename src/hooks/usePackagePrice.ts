import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PackageInfo {
  nome: string;
  preco: number;
  preco_original: number | null;
}

interface UsePackagePriceResult {
  packageInfo: PackageInfo | null;
  isLoading: boolean;
}

export function usePackagePrice(): UsePackagePriceResult {
  const [packageInfo, setPackageInfo] = useState<PackageInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPrice = async () => {
      setIsLoading(true);
      try {
        const { data } = await supabase
          .from('configuracoes_produtos')
          .select('nome, preco, preco_original')
          .eq('ativo', true)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data) {
          setPackageInfo({
            nome: data.nome,
            preco: data.preco,
            preco_original: data.preco_original,
          });
        }
      } catch (err) {
        console.error('Error fetching package price:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrice();
  }, []);

  return { packageInfo, isLoading };
}
