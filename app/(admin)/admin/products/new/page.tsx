import { ProductForm } from "@/components/admin/product-form";

export default function AdminProductCreatePage() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Create a new product with variants, stock, and media assets.</p>
      <ProductForm mode="create" />
    </div>
  );
}
