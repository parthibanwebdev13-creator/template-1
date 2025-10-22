import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    image_url: string | null;
    price_per_litre: number;
    offer_price_per_litre: number | null;
    stock_quantity: number;
    litres_per_unit?: number | null;
  };
  onUpdate?: () => void;
  compact?: boolean;
}

export default function ProductCard({ product, onUpdate, compact = false }: ProductCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAddingToCart] = useState(false);
  const [isAddingToWishlist] = useState(false);

  if (compact) {
    // Prefer explicit litres_per_unit, fallback to parsing from name, default to 1.0L
    const parsedFromName = (() => {
      const match = product.name.match(/(\d+\.?\d*)\s*[lL]/);
      return match ? parseFloat(match[1]) : NaN;
    })();
    const litresPerUnit = Number.isFinite(product.litres_per_unit as number)
      ? (product.litres_per_unit as number)
      : (Number.isFinite(parsedFromName) ? parsedFromName : 1);

    // Visual style based on size
    const sizeClass = litresPerUnit < 0.75
      ? 'bg-yellow-200 text-yellow-900'
      : litresPerUnit < 1.5
      ? 'bg-yellow-400 text-yellow-900'
      : litresPerUnit < 3
      ? 'bg-amber-500 text-amber-950'
      : 'bg-orange-600 text-white';

    const labelText = `${litresPerUnit.toFixed(litresPerUnit % 1 === 0 ? 0 : 1)}L`;

    return (
      <div
        className={`w-[1.5cm] h-[1.5cm] flex items-center justify-center rounded-lg cursor-pointer transition-all duration-300 ${sizeClass}`}
        onClick={() => navigate(`/product/${product.id}`)}
        title={`${labelText} unit`}
      >
        {/* Simple bottle glyph scaled by litresPerUnit */}
        <div className="flex flex-col items-center justify-center leading-none">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="opacity-90">
            {/* bottle body */}
            <path d="M9 7c0-1.105.895-2 2-2h2c1.105 0 2 .895 2 2v1c0 .552.448 1 1 1v9a4 4 0 0 1-4 4h-2a4 4 0 0 1-4-4V9c.552 0 1-.448 1-1V7z" />
            {/* cap */}
            <rect x="11" y="3" width="2" height="2" rx="0.5" />
          </svg>
          <span className="text-[10px] font-bold mt-1">{labelText}</span>
        </div>
      </div>
    );
  }

  return (
    <Card
      className="group overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-[var(--shadow-hover)]"
      onClick={() => navigate(`/product/${product.id}`)}
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={product.image_url || '/placeholder.svg'}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg line-clamp-2">{product.name}</h3>
      </CardContent>
    </Card>
  );
}