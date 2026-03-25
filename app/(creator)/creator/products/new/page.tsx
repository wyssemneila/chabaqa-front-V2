"use client"

import { ProductFormProvider } from "./components/product-form-context"
import { CreateProductHeader } from "./components/create-product-header"
import { CreateProductProgress } from "./components/create-product-progress"
import { CreateProductForm } from "./components/create-product-form"
import { CreateProductNavigation } from "./components/create-product-navigation"

export default function CreateProductPage() {
  return (
    <ProductFormProvider>
      <div className="max-w-6xl mx-auto space-y-8 p-5">
        <CreateProductHeader />
        <CreateProductProgress />
        <CreateProductForm />
        <CreateProductNavigation />
      </div>
    </ProductFormProvider>
  )
}