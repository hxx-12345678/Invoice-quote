'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Product } from '@/lib/types';
import { ProductsStore, formatCurrency, UserSettingsStore, BusinessProfileStore } from '@/lib/store';
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Package,
  Briefcase,
  PackagePlus,
  RefreshCw
} from 'lucide-react';
import { ProductForm } from './product-form';
import { Empty, EmptyMedia, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty';
import { ApiService } from '@/lib/api-service';
import { toast } from 'sonner';

interface ProductListProps {
  onSelectProduct?: (product: Product) => void;
  selectionMode?: boolean;
}

export function ProductList({ onSelectProduct, selectionMode = false }: ProductListProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const settings = UserSettingsStore.get();

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const profile = BusinessProfileStore.get();
      if (!profile?.id) {
        // Fallback to local store if no profile
        setProducts(ProductsStore.getAll());
        return;
      }
      const response = await ApiService.products.getAll(profile.id);
      const data = response.data.data || response.data;
      if (Array.isArray(data)) {
        setProducts(data);
        // Sync local store
        ProductsStore.setAll(data);
      } else {
        setProducts(ProductsStore.getAll());
      }
    } catch (error) {
      console.error('Failed to load products from API:', error);
      // Fallback to local store on error
      setProducts(ProductsStore.getAll());
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = searchQuery
    ? ProductsStore.search(searchQuery)
    : products;

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await ApiService.products.delete(id);
        ProductsStore.delete(id);
        toast.success('Product deleted successfully');
        loadProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        // Fallback to local deletion
        ProductsStore.delete(id);
        toast.success('Local product deleted successfully');
        loadProducts();
      }
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleFormComplete = () => {
    setShowForm(false);
    setEditingProduct(undefined);
    loadProducts();
  };

  if (showForm) {
    return (
      <ProductForm
        product={editingProduct}
        onComplete={handleFormComplete}
        onCancel={() => {
          setShowForm(false);
          setEditingProduct(undefined);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Products & Services</h2>
          <p className="text-muted-foreground">Manage your product and service catalog</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, SKU, HSN/SAC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Badge variant="secondary">{filteredProducts.length} items</Badge>
      </div>

      {filteredProducts.length === 0 ? (
        <Empty>
          <EmptyMedia variant="icon">
            <PackagePlus />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>No products yet</EmptyTitle>
            <EmptyDescription>Add products or services to quickly add them to invoices</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Item</TableHead>
                <TableHead className="hidden md:table-cell">Code</TableHead>
                <TableHead className="hidden lg:table-cell">Unit</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="hidden sm:table-cell">Tax</TableHead>
                <TableHead className="hidden sm:table-cell">Type</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow 
                  key={product.id}
                  className={selectionMode ? 'cursor-pointer hover:bg-muted/50' : ''}
                  onClick={() => selectionMode && onSelectProduct?.(product)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        product.isService 
                          ? 'bg-accent/10 text-accent' 
                          : 'bg-primary/10 text-primary'
                      }`}>
                        {product.isService 
                          ? <Briefcase className="h-5 w-5" />
                          : <Package className="h-5 w-5" />
                        }
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{product.name}</div>
                        {product.description && (
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {product.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="space-y-1">
                      {product.sku && (
                        <Badge variant="outline" className="text-xs">
                          SKU: {product.sku}
                        </Badge>
                      )}
                      {product.hsnCode && (
                        <Badge variant="outline" className="text-xs">
                          HSN: {product.hsnCode}
                        </Badge>
                      )}
                      {product.sacCode && (
                        <Badge variant="outline" className="text-xs">
                          SAC: {product.sacCode}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="text-muted-foreground">{product.unit}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-foreground">
                      {formatCurrency(product.unitPrice, settings?.currency || 'INR')}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="secondary">{product.taxRate}%</Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge 
                      variant={product.isService ? 'outline' : 'default'}
                      className={product.isService ? '' : 'bg-primary/10 text-primary border-primary/20'}
                    >
                      {product.isService ? 'Service' : 'Product'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {!selectionMode && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(product)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(product.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
