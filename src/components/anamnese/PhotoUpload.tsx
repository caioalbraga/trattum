import { useState, useRef } from 'react';
import { Camera, X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PhotoUploadProps {
  label: string;
  value: File | null;
  onChange: (file: File | null) => void;
}

export function PhotoUpload({ label, value, onChange }: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    onChange(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    onChange(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      
      {preview ? (
        <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden border border-border bg-muted">
          <img src={preview} alt={label} className="w-full h-full object-cover" />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            "w-full aspect-[3/4] rounded-xl border-2 border-dashed border-border",
            "flex flex-col items-center justify-center gap-2",
            "hover:bg-muted/50 transition-colors cursor-pointer",
            "text-muted-foreground"
          )}
        >
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <Camera className="h-5 w-5 text-primary" />
          </div>
          <span className="text-xs font-medium">Enviar foto</span>
          <span className="text-[10px]">{label}</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
    </div>
  );
}
