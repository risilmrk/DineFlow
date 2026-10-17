// ==============================================================================
// DineFlow Entitlement & Subscription Limit Engine
// ==============================================================================

import { SubscriptionPlan, HotelSubscription, EntitlementCheckResult } from '@dineflow/database';

export const DEFAULT_FREE_LIMITS: SubscriptionPlan = {
  id: 'free-fallback',
  name: 'Free Tier',
  slug: 'free',
  monthly_price: 0,
  yearly_price: 0,
  currency: 'USD',
  is_active: true,
  is_featured: false,
  max_staff_accounts: 2,
  max_food_items: 15,
  max_menu_categories: 3,
  cloudinary_storage_mb: 50,
  api_access_enabled: false,
  monthly_api_quota: 0,
  api_rate_limit_rpm: 0,
  custom_guest_page_enabled: false,
  analytics_export_enabled: false,
  features: ['Basic Guest Menu', 'Table QR Preview'],
  sort_order: 0,
};

export class EntitlementService {
  /**
   * Evaluates if a hotel subscription is currently active and in good standing.
   */
  static isSubscriptionActive(subscription?: HotelSubscription | null): boolean {
    if (!subscription) return false;
    if (subscription.status === 'suspended' || subscription.status === 'canceled') return false;

    const expiry = new Date(subscription.expiry_date).getTime();
    const now = Date.now();
    return expiry > now;
  }

  /**
   * Retrieves effective limits for a hotel based on its subscription.
   */
  static getEffectivePlan(subscription?: HotelSubscription | null): SubscriptionPlan {
    if (!subscription || !subscription.plan || !this.isSubscriptionActive(subscription)) {
      return DEFAULT_FREE_LIMITS;
    }
    return subscription.plan;
  }

  /**
   * Checks staff account capacity.
   * Note: pending invitations also consume capacity to prevent over-allocation.
   */
  static checkStaffQuota(
    currentStaffCount: number,
    pendingInvitationsCount: number,
    subscription?: HotelSubscription | null
  ): EntitlementCheckResult {
    const plan = this.getEffectivePlan(subscription);
    const maxLimit = plan.max_staff_accounts;
    const totalAllocated = currentStaffCount + pendingInvitationsCount;
    const remaining = Math.max(0, maxLimit - totalAllocated);
    const allowed = totalAllocated < maxLimit;

    return {
      allowed,
      currentCount: totalAllocated,
      maxLimit,
      remaining,
      percentageUsed: Math.min(100, Math.round((totalAllocated / maxLimit) * 100)),
      message: allowed
        ? undefined
        : `Staff accounts limit reached (${totalAllocated}/${maxLimit}). Upgrade your plan to invite more team members.`,
    };
  }

  /**
   * Checks menu food item capacity.
   */
  static checkFoodItemsQuota(
    currentItemsCount: number,
    subscription?: HotelSubscription | null
  ): EntitlementCheckResult {
    const plan = this.getEffectivePlan(subscription);
    const maxLimit = plan.max_food_items;
    const remaining = Math.max(0, maxLimit - currentItemsCount);
    const allowed = currentItemsCount < maxLimit;

    return {
      allowed,
      currentCount: currentItemsCount,
      maxLimit,
      remaining,
      percentageUsed: Math.min(100, Math.round((currentItemsCount / maxLimit) * 100)),
      message: allowed
        ? undefined
        : `Food items limit reached (${currentItemsCount}/${maxLimit}). Upgrade your plan to add more delicious dishes.`,
    };
  }

  /**
   * Checks menu categories capacity.
   */
  static checkCategoryQuota(
    currentCategoryCount: number,
    subscription?: HotelSubscription | null
  ): EntitlementCheckResult {
    const plan = this.getEffectivePlan(subscription);
    const maxLimit = plan.max_menu_categories;
    const remaining = Math.max(0, maxLimit - currentCategoryCount);
    const allowed = currentCategoryCount < maxLimit;

    return {
      allowed,
      currentCount: currentCategoryCount,
      maxLimit,
      remaining,
      percentageUsed: Math.min(100, Math.round((currentCategoryCount / maxLimit) * 100)),
      message: allowed
        ? undefined
        : `Category limit reached (${currentCategoryCount}/${maxLimit}). Upgrade your plan to organize into more categories.`,
    };
  }

  /**
   * Checks Cloudinary media storage quota in megabytes.
   */
  static checkStorageQuota(
    currentUsedBytes: number,
    incomingFileBytes: number,
    subscription?: HotelSubscription | null
  ): EntitlementCheckResult {
    const plan = this.getEffectivePlan(subscription);
    const maxBytes = plan.cloudinary_storage_mb * 1024 * 1024;
    const totalBytesAfter = currentUsedBytes + incomingFileBytes;
    const allowed = totalBytesAfter <= maxBytes;
    const remainingBytes = Math.max(0, maxBytes - currentUsedBytes);

    return {
      allowed,
      currentCount: Math.round(currentUsedBytes / (1024 * 1024)),
      maxLimit: plan.cloudinary_storage_mb,
      remaining: Math.round(remainingBytes / (1024 * 1024)),
      percentageUsed: Math.min(100, Math.round((currentUsedBytes / maxBytes) * 100)),
      message: allowed
        ? undefined
        : `Storage quota exceeded. Allowed: ${plan.cloudinary_storage_mb} MB, Current + File: ${(totalBytesAfter / (1024 * 1024)).toFixed(1)} MB.`,
    };
  }

  /**
   * Checks if API access feature is enabled for the hotel.
   */
  static isApiAccessAllowed(subscription?: HotelSubscription | null): boolean {
    const plan = this.getEffectivePlan(subscription);
    return Boolean(plan.api_access_enabled);
  }

  /**
   * Checks if custom guest landing URL/custom design feature is enabled.
   */
  static isCustomGuestPageAllowed(subscription?: HotelSubscription | null): boolean {
    const plan = this.getEffectivePlan(subscription);
    return Boolean(plan.custom_guest_page_enabled);
  }

  /**
   * Checks if analytics export is allowed.
   */
  static isAnalyticsExportAllowed(subscription?: HotelSubscription | null): boolean {
    const plan = this.getEffectivePlan(subscription);
    return Boolean(plan.analytics_export_enabled);
  }
}
