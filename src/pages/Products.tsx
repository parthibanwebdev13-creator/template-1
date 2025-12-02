import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function Products() {
  const [query, setQuery] = useState('');

  const { data: products, refetch, isFetching } = useQuery({
    queryKey: ['products', query],
    queryFn: async () => {
      let q = supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (query.trim()) {
        q = q.ilike('name', `%${query.trim()}%`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Header */}
      <section className="bg-gradient-to-br from-primary/10 via-secondary/5 to-background py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Our Products
            </h1>
            <p className="text-lg text-muted-foreground">
              Discover the finest selection of cooking oils for your kitchen
            </p>
          </div>
        </div>
      </section>

      {/* Search + Products Grid */
      /* Show 1 product on mobile, 3 on desktop */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto mb-8 flex gap-2">
            <Input
              placeholder="Search products by name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? 'Searching...' : 'Search'}
            </Button>
          </div>
          {products && products.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} onUpdate={refetch} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No products available at the moment.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
