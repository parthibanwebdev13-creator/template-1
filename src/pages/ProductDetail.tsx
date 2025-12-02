import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Star, ShoppingCart, Heart, Minus, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import ProductCard from '@/components/ProductCard';
import { VariantOption } from '@/types/products';

const parseVariantOptions = (values: any): VariantOption[] => {
  if (!Array.isArray(values)) return [];
  return values
    .map((value) => {
      if (!value) return null;
      if (typeof value === 'string') {
        const label = value.trim();
        return label ? { label } : null;
      }
      if (typeof value === 'object') {
        const label = typeof value.label === 'string' ? value.label.trim() : '';
        if (!label) return null;
        const image_url =
          typeof value.image_url === 'string' && value.image_url.length > 0 ? value.image_url : null;
        return { label, image_url };
      }
      return null;
    })
    .filter((value): value is VariantOption => Boolean(value));
};

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [selectedVariant, setSelectedVariant] = useState<VariantOption | null>(null);
  const [selectedMeasurement, setSelectedMeasurement] = useState<string | null>(null);
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);

  const { data: product } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_categories (
            id,
            name,
            slug
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: reviews } = useQuery({
    queryKey: ['reviews', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: relatedProducts } = useQuery({
    queryKey: ['related-products', product?.category_id],
    queryFn: async () => {
      if (!product?.category_id) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', product.category_id)
        .eq('is_active', true)
        .neq('id', id)
        .limit(4)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!product?.category_id,
  });

  const variantOptions = useMemo(
    () => parseVariantOptions(product?.variant_values),
    [product?.variant_values],
  );
  const hasVariants = Boolean(product?.variant_enabled && variantOptions.length > 0);
  const measurementValues = useMemo(
    () => (Array.isArray(product?.measurement_values) ? product.measurement_values : []),
    [product?.measurement_values],
  );
  const hasMeasurements = Boolean(product?.measurement_enabled && measurementValues.length > 0);

  useEffect(() => {
    if (product) {
      setActiveImageUrl(product.image_url || null);
      setSelectedVariant(null);
      setSelectedMeasurement(null);
    }
  }, [product]);

useEffect(() => {
  if (!hasVariants) {
    setSelectedVariant(null);
    return;
  }
  setSelectedVariant((prev) => {
    if (prev && variantOptions.some((option) => option.label === prev.label)) {
      return prev;
    }
    return variantOptions[0] || null;
  });
}, [hasVariants, variantOptions]);

useEffect(() => {
  if (!hasMeasurements) {
    setSelectedMeasurement(null);
    return;
  }
  setSelectedMeasurement((prev) => {
    if (prev && measurementValues.includes(prev)) {
      return prev;
    }
    return measurementValues[0] || null;
  });
}, [hasMeasurements, measurementValues]);

  const handleSelectVariant = (option: VariantOption) => {
    setSelectedVariant(option);
    if (option.image_url) {
      setActiveImageUrl(option.image_url);
    } else {
      setActiveImageUrl(product?.image_url || null);
    }
  };

  const handleSelectMeasurement = (value: string) => {
    setSelectedMeasurement(value);
  };

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Please login');
      if (!product) throw new Error('Product not found');
      if (hasVariants && !selectedVariant) {
        throw new Error(`Please select a ${product.variant_title || 'variant'}`);
      }
      if (hasMeasurements && !selectedMeasurement) {
        throw new Error(`Please select a ${product.measurement_title || 'measurement option'}`);
      }

      const variantPayload = selectedVariant
        ? {
            label: selectedVariant.label,
            image_url: selectedVariant.image_url ?? null,
          }
        : null;

      const { error } = await supabase
        .from('cart_items')
        .upsert({
          user_id: user.id,
          product_id: id!,
          quantity_litres: quantity,
          variant_selection: variantPayload,
          measurement_label: product.measurement_title || null,
          measurement_value: selectedMeasurement,
        }, {
          onConflict: 'user_id,product_id',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Added to cart');
      queryClient.invalidateQueries({ queryKey: ['cart', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['cart-count'] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const addReviewMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Please login');

      const { error } = await supabase
        .from('reviews')
        .insert({
          product_id: id!,
          user_id: user.id,
          rating,
          comment: comment.trim(),
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Review added');
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['reviews', id] });
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error('You have already reviewed this product');
      } else {
        toast.error(error.message);
      }
    },
  });

  if (!product) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8">Loading...</div>
      </div>
    );
  }

  const effectivePrice = product.offer_price_per_litre || product.price_per_litre;
  const hasDiscount = product.offer_price_per_litre && product.offer_price_per_litre < product.price_per_litre;
  const discountPercentage = hasDiscount
    ? Math.round(((product.price_per_litre - product.offer_price_per_litre!) / product.price_per_litre) * 100)
    : 0;
  const variantTitle = product.variant_title || 'Variant';
  const measurementTitle = product.measurement_title || 'Measurement';

  const averageRating = reviews?.length
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
    : 0;
  const displayImage = activeImageUrl || product.image_url || '/placeholder.svg';
  const selectionMissing = (hasVariants && !selectedVariant) || (hasMeasurements && !selectedMeasurement);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Product Image */}
          <div className="aspect-square rounded-xl overflow-hidden bg-muted">
            <img
              src={displayImage}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">{product.name}</h1>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.round(averageRating)
                          ? 'fill-primary text-primary'
                          : 'text-muted'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  ({reviews?.length || 0} reviews)
                </span>
              </div>

              {hasDiscount && (
                <Badge className="mb-4 bg-destructive">
                  {discountPercentage}% OFF
                </Badge>
              )}

              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-4xl font-bold text-primary">
                  ₹{effectivePrice.toFixed(2)}
                </span>
                <span className="text-lg text-muted-foreground">/litre</span>
              </div>

              {hasDiscount && (
                <span className="text-xl text-muted-foreground line-through">
                  ₹{product.price_per_litre.toFixed(2)}
                </span>
              )}

              <p className="text-muted-foreground mt-4">{product.description}</p>

              <p className="text-sm mt-2">
                <span className="font-semibold">Stock:</span>{' '}
                {product.stock_quantity > 0
                  ? `${product.stock_quantity} litres available`
                  : 'Out of stock'}
              </p>

              {hasVariants && (
                <div className="space-y-3 mt-6">
                  <p className="font-semibold">{variantTitle}:</p>
                  <div className="flex flex-wrap gap-3">
                    {variantOptions.map((option) => {
                      const isSelected = selectedVariant?.label === option.label;
                      return (
                        <button
                          key={option.label}
                          type="button"
                          onClick={() => handleSelectVariant(option)}
                          className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                            isSelected
                              ? 'border-primary bg-primary/10 text-primary shadow-sm'
                              : 'border-muted-foreground/30 hover:border-primary/60'
                          }`}
                        >
                          {option.image_url && (
                            <img
                              src={option.image_url}
                              alt={`${option.label} preview`}
                              className="h-6 w-6 rounded-full object-cover"
                            />
                          )}
                          <span>{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  {selectedVariant && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      Selected {variantTitle}:
                      <Badge variant="secondary" className="flex items-center gap-2">
                        {selectedVariant.image_url && (
                          <img
                            src={selectedVariant.image_url}
                            alt={`${selectedVariant.label} preview`}
                            className="h-5 w-5 rounded-full object-cover"
                          />
                        )}
                        {selectedVariant.label}
                      </Badge>
                    </p>
                  )}
                </div>
              )}

              {hasMeasurements && (
                <div className="space-y-3 mt-4">
                  <p className="font-semibold">{measurementTitle}:</p>
                  <div className="flex flex-wrap gap-2">
                    {measurementValues.map((value) => {
                      const isSelected = selectedMeasurement === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleSelectMeasurement(value)}
                          className={`rounded-full border px-4 py-2 text-sm transition ${
                            isSelected
                              ? 'border-primary bg-primary/10 text-primary shadow-sm'
                              : 'border-muted-foreground/30 hover:border-primary/60'
                          }`}
                        >
                          {value}
                        </button>
                      );
                    })}
                  </div>
                  {selectedMeasurement && (
                    <p className="text-sm text-muted-foreground">
                      Selected {measurementTitle}: <Badge variant="outline">{selectedMeasurement}</Badge>
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="font-semibold">Quantity (litres):</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 text-center"
                    min="1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  className="flex-1"
                  size="lg"
                  onClick={() => addToCartMutation.mutate()}
                  disabled={product.stock_quantity === 0 || addToCartMutation.isPending || selectionMissing}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Add to Cart
                </Button>
                <Button variant="outline" size="lg">
                  <Heart className="h-5 w-5" />
                </Button>
              </div>

              <div className="text-2xl font-bold mt-4">
                Total: ₹{(effectivePrice * quantity).toFixed(2)}
              </div>

              {/* Related Products Section */}
              {relatedProducts && relatedProducts.length > 0 && (
                <div className="space-y-4 mt-[3cm]">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-[10px]">
                    {relatedProducts.map((relatedProduct) => (
                      <ProductCard 
                        key={relatedProduct.id} 
                        product={relatedProduct}
                        compact={true}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Customer Reviews</h2>

          {user && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Write a Review</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Rating</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          type="button"
                        >
                          <Star
                            className={`h-6 w-6 cursor-pointer ${
                              star <= rating ? 'fill-primary text-primary' : 'text-muted'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Comment</label>
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your experience..."
                      rows={4}
                    />
                  </div>
                  <Button
                    onClick={() => addReviewMutation.mutate()}
                    disabled={addReviewMutation.isPending}
                  >
                    Submit Review
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {reviews?.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-2">
                  <div>
                      <p className="font-semibold">Customer</p>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating ? 'fill-primary text-primary' : 'text-muted'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {review.comment && <p className="text-muted-foreground">{review.comment}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}