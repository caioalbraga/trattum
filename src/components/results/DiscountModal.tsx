import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string) => void;
}

export function DiscountModal({ isOpen, onClose, onSubmit }: DiscountModalProps) {
  const [email, setEmail] = useState("");
  const [timeLeft, setTimeLeft] = useState({ hours: 1, minutes: 57, seconds: 58 });

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { hours, minutes, seconds } = prev;
        
        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        }

        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      onSubmit(email);
      onClose();
    }
  };

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
        
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl font-bold tracking-wider uppercase">
            Oferta de Hoje
          </DialogTitle>
        </DialogHeader>

        <div className="flex justify-center gap-4 my-6">
          <div className="text-center">
            <div className="bg-muted rounded-lg px-4 py-3 min-w-[70px]">
              <span className="text-3xl font-bold">{formatNumber(timeLeft.hours)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Horas</p>
          </div>
          <div className="text-center">
            <div className="bg-muted rounded-lg px-4 py-3 min-w-[70px]">
              <span className="text-3xl font-bold">{formatNumber(timeLeft.minutes)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Minutos</p>
          </div>
          <div className="text-center">
            <div className="bg-muted rounded-lg px-4 py-3 min-w-[70px]">
              <span className="text-3xl font-bold">{formatNumber(timeLeft.seconds)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Segundos</p>
          </div>
        </div>

        <div className="text-center mb-6">
          <h3 className="text-2xl font-serif font-bold text-primary">
            30% desconto no primeiro pedido
          </h3>
          <p className="text-muted-foreground mt-2">
            Cadastre o seu e-mail e ganhe o desconto em seu primeiro pedido!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="insira o endereço de e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12"
            required
          />
          <Button type="submit" variant="coral" className="w-full" size="lg">
            QUERO O DESCONTO
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
