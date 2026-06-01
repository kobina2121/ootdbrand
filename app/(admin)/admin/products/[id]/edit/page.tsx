import { notFound } from "next/navigation";

import { ProductForm } from "@/components/admin/product-form";
import { getProductById } from "@/lib/services/product-service";

export default async function AdminProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Update product details, pricing, and variants before publishing.</p>
      <ProductForm
        mode="edit"
        productId={product.id}
        initialValues={{
          name: product.name,
          slug: product.slug,
          description: product.description,
          category: product.category,
          tags: product.tags.join(", "),
          basePrice: product.basePrice,
          images: product.images.slice(0, 10),
          status: product.isActive ? "active" : "draft",
          variants:
            product.variants.length > 0
              ? product.variants.map((variant) => ({
                  sizes: [variant.size],
                  colorName: variant.color?.name ?? "",
                  colorCode: variant.color?.code ?? "#111827",
                  image: variant.image ?? "",
                  sku: variant.sku,
                  stock: variant.stock,
                }))
              : [
                  {
                    sizes: ["M"],
                    colorName: "",
                    colorCode: "#111827",
                    image: "",
                    sku: "",
                    stock: 0,
                  },
                ],
        }}
      />
    </div>
  );
}
