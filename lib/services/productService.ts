import { supabase } from '../supabase';
import { Product } from '../../types';

/**
 * Fetch all products from Supabase
 */
export const fetchProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching products:', error);
    throw error;
  }

  // Map database columns to Product interface
  return (data || []).map(row => ({
    id: row.id,
    name: row.name,
    description: row.description || '',
    price: parseFloat(row.price),
    image: row.image || '',
    category: row.category,
    ingredients: row.ingredients || [],
    benefits: row.benefits || [],
    rating: parseFloat(row.rating) || 0,
    reviews: row.reviews || 0,
    isBestSeller: row.is_best_seller || false,
    isNew: row.is_new || false,
    isAvailable: row.is_available !== false
  }));
};

/**
 * Get a single product by ID
 */
export const getProduct = async (id: string): Promise<Product | null> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Error fetching product:', error);
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description || '',
    price: parseFloat(data.price),
    image: data.image || '',
    category: data.category,
    ingredients: data.ingredients || [],
    benefits: data.benefits || [],
    rating: parseFloat(data.rating) || 0,
    reviews: data.reviews || 0,
    isBestSeller: data.is_best_seller || false,
    isNew: data.is_new || false,
    isAvailable: data.is_available !== false
  };
};

/**
 * Create a new product
 */
export const createProduct = async (product: Omit<Product, 'rating' | 'reviews'>): Promise<Product> => {
  const { data, error } = await supabase
    .from('products')
    .insert({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image,
      category: product.category,
      ingredients: product.ingredients,
      benefits: product.benefits,
      is_best_seller: product.isBestSeller || false,
      is_new: product.isNew || false,
      is_available: product.isAvailable !== false
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating product:', error);
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description || '',
    price: parseFloat(data.price),
    image: data.image || '',
    category: data.category,
    ingredients: data.ingredients || [],
    benefits: data.benefits || [],
    rating: parseFloat(data.rating) || 0,
    reviews: data.reviews || 0,
    isBestSeller: data.is_best_seller || false,
    isNew: data.is_new || false,
    isAvailable: data.is_available !== false
  };
};

/**
 * Update an existing product (or create if not exists)
 */
export const updateProduct = async (id: string, updates: Partial<Product>): Promise<Product> => {
  const dbData: Record<string, unknown> = { id };
  
  if (updates.name !== undefined) dbData.name = updates.name;
  if (updates.description !== undefined) dbData.description = updates.description;
  if (updates.price !== undefined) dbData.price = updates.price;
  if (updates.image !== undefined) dbData.image = updates.image;
  if (updates.category !== undefined) dbData.category = updates.category;
  if (updates.ingredients !== undefined) dbData.ingredients = updates.ingredients;
  if (updates.benefits !== undefined) dbData.benefits = updates.benefits;
  if (updates.isBestSeller !== undefined) dbData.is_best_seller = updates.isBestSeller;
  if (updates.isNew !== undefined) dbData.is_new = updates.isNew;
  if (updates.isAvailable !== undefined) dbData.is_available = updates.isAvailable;

  // Use upsert to handle both insert and update cases
  const { data, error } = await supabase
    .from('products')
    .upsert(dbData, { onConflict: 'id' })
    .select();

  if (error) {
    console.error('Error updating product:', error);
    throw error;
  }

  // Get the first row from result array
  const row = data?.[0];
  if (!row) {
    throw new Error('Failed to update product');
  }

  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    price: parseFloat(row.price),
    image: row.image || '',
    category: row.category,
    ingredients: row.ingredients || [],
    benefits: row.benefits || [],
    rating: parseFloat(row.rating) || 0,
    reviews: row.reviews || 0,
    isBestSeller: row.is_best_seller || false,
    isNew: row.is_new || false,
    isAvailable: row.is_available !== false
  };
};

/**
 * Delete a product
 */
export const deleteProduct = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

/**
 * Seed products from static data (for initial migration)
 */
export const seedProducts = async (products: Product[]): Promise<void> => {
  const dbProducts = products.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    image: p.image,
    category: p.category,
    ingredients: p.ingredients || [],
    benefits: p.benefits || [],
    rating: p.rating || 0,
    reviews: p.reviews || 0,
    is_best_seller: p.isBestSeller || false,
    is_new: p.isNew || false,
    is_available: p.isAvailable !== false
  }));

  const { error } = await supabase
    .from('products')
    .upsert(dbProducts, { onConflict: 'id' });

  if (error) {
    console.error('Error seeding products:', error);
    throw error;
  }
};
