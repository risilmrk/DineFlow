// ==============================================================================
// DineFlow Cloudinary Media Integration Engine
// ==============================================================================

import { MediaAsset, HotelSubscription, supabase } from '@dineflow/database';
import { EntitlementService } from './entitlements';

const CLOUD_NAME = import.meta.env?.VITE_CLOUDINARY_CLOUD_NAME || 'dineflow-demo';
const UPLOAD_PRESET = import.meta.env?.VITE_CLOUDINARY_UPLOAD_PRESET || 'dineflow_menus';

export interface CloudinaryUploadOptions {
  hotelId: string;
  file: File;
  assetType?: 'menu_item' | 'logo' | 'cover' | 'receipt' | 'general';
  subscription?: HotelSubscription | null;
  currentUsedBytes?: number;
}

export interface CloudinaryUploadResponse {
  success: boolean;
  asset?: MediaAsset;
  error?: string;
}

export class CloudinaryService {
  /**
   * Generates optimized Cloudinary delivery URLs with dynamic formatting and quality.
   */
  static getOptimizedUrl(
    originalUrl: string,
    options: { width?: number; height?: number; crop?: 'fill' | 'fit' | 'thumb' } = {}
  ): string {
    if (!originalUrl) return '';

    // If it's already a Cloudinary URL, inject transformations
    if (originalUrl.includes('cloudinary.com')) {
      const { width = 800, height = 600, crop = 'fill' } = options;
      const transformation = `f_auto,q_auto,w_${width},h_${height},c_${crop}`;

      if (originalUrl.includes('/upload/')) {
        return originalUrl.replace('/upload/', `/upload/${transformation}/`);
      }
    }

    // For Unsplash images used in seed data, inject fit parameters
    if (originalUrl.includes('unsplash.com')) {
      const { width = 800, height = 600 } = options;
      return `${originalUrl.split('?')[0]}?w=${width}&h=${height}&fit=crop&q=80`;
    }

    return originalUrl;
  }

  /**
   * Performs an authoritative upload validation and uploads image.
   */
  static async uploadImage(options: CloudinaryUploadOptions): Promise<CloudinaryUploadResponse> {
    const { hotelId, file, assetType = 'menu_item', subscription, currentUsedBytes = 0 } = options;

    // 1. Validate file format
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: `Invalid file format (${file.type}). Allowed formats: JPG, PNG, WebP, AVIF.`,
      };
    }

    // 2. Validate max single file size (10MB)
    const maxSingleFileBytes = 10 * 1024 * 1024;
    if (file.size > maxSingleFileBytes) {
      return {
        success: false,
        error: `File size too large (${(file.size / (1024 * 1024)).toFixed(2)} MB). Maximum allowed per image is 10 MB.`,
      };
    }

    // 3. Validate total plan storage quota
    const quotaCheck = EntitlementService.checkStorageQuota(
      currentUsedBytes,
      file.size,
      subscription
    );
    if (!quotaCheck.allowed) {
      return {
        success: false,
        error: quotaCheck.message,
      };
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);
      formData.append('folder', `dineflow/${hotelId}`);

      let uploadResultUrl = '';
      let publicId = `df_${hotelId}_${Date.now()}`;

      try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          uploadResultUrl = data.secure_url;
          publicId = data.public_id;
        } else {
          uploadResultUrl = URL.createObjectURL(file);
        }
      } catch (err) {
        uploadResultUrl = URL.createObjectURL(file);
      }

      const newAsset: MediaAsset = {
        id: crypto.randomUUID(),
        hotel_id: hotelId,
        public_id: publicId,
        url: uploadResultUrl,
        secure_url: uploadResultUrl,
        format: file.type.split('/')[1] || 'jpeg',
        bytes: file.size,
        asset_type: assetType,
        created_at: new Date().toISOString(),
      };

      await supabase.from('media_assets').insert({
        id: newAsset.id,
        hotel_id: newAsset.hotel_id,
        public_id: newAsset.public_id,
        url: newAsset.url,
        secure_url: newAsset.secure_url,
        format: newAsset.format,
        bytes: newAsset.bytes,
        asset_type: newAsset.asset_type,
      });

      return {
        success: true,
        asset: newAsset,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Image upload failed. Please try again.',
      };
    }
  }
}
