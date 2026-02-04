import { supabase } from '../supabase';

const BUCKET_NAME = 'product-images';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload an image to Supabase Storage
 */
export const uploadProductImage = async (
  file: File,
  productId: string
): Promise<UploadResult> => {
  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${productId}-${Date.now()}.${fileExt}`;
    const filePath = `products/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Upload error:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return {
      success: true,
      url: urlData.publicUrl
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
};

/**
 * Delete an image from Supabase Storage
 */
export const deleteProductImage = async (imageUrl: string): Promise<boolean> => {
  try {
    // Extract file path from URL
    const urlParts = imageUrl.split(`${BUCKET_NAME}/`);
    if (urlParts.length < 2) return false;

    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
};

/**
 * Get public URL for a product image
 */
export const getProductImageUrl = (filePath: string): string => {
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return data.publicUrl;
};

/**
 * List all images in the product-images bucket
 */
export const listProductImages = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list('products', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      console.error('List error:', error);
      return [];
    }

    return data.map(file => getProductImageUrl(`products/${file.name}`));
  } catch (error) {
    console.error('List error:', error);
    return [];
  }
};
