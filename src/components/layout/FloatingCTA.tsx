import { Button } from "@/components/ui/button";

interface FloatingCTAProps {
  message: string;
  buttonText: string;
  onClick: () => void;
}

export function FloatingCTA({ message, buttonText, onClick }: FloatingCTAProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg z-40">
      <div className="container py-4 flex items-center justify-between gap-4">
        <p className="text-sm sm:text-base font-medium text-foreground">
          {message}
        </p>
        <Button variant="coral" size="lg" onClick={onClick} className="shrink-0">
          {buttonText}
        </Button>
      </div>
    </div>
  );
}
