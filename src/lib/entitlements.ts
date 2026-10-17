// ==============================================================================
// DineFlow Entitlement & Subscription Limit Engine
// ==============================================================================

import { SubscriptionPlan, HotelSubscription, EntitlementCheckResult } from '../types';

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
    const totalAllocated = currentStaffCount + pendingInvitationsCount;
    const maxLimit = plan.max_staff_accounts;
    const remaining = Math.max(0, maxLimit - totalAllocated);
    const allowed = totalAllocated < maxLimit;

    return {
      allowed,
      currentCount: totalAllocated,
      maxLimit,
      remaining,
      percentageUsed: Math.min(100, Math.round((totalAllocated / maxLimit) * 100)),
      message: allowed
        ? `${remaining} staff seats remaining under your ${plan.name} plan.`
        : `Staff limit of ${maxLimit} reached. Please upgrade your plan to add more staff or cancel pending invitations.`,
    };
  }

  /**
   * Checks food items capacity.
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
        ? `${remaining} items remaining under your ${plan.name} plan.`
        : `Food item limit of ${maxLimit} reached. Upgrade to ${plan.name === 'Base Starter' ? 'Pro Culinary' : 'Enterprise Grand'} to publish more dishes.`,
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
        ? `${remaining} categories remaining under your ${plan.name} plan.`
        : `Category limit of ${maxLimit} reached. Upgrade plan to create more categories.`,
    };
  }

  /**
   * Checks Cloudinary storage capacity (in MegaBytes).
   */
  static checkStorageQuota(
    usedBytes: number,
    fileSizeBytesToAdd: number = 0,
    subscription?: HotelSubscription | null
  ): EntitlementCheckResult {
    const plan = this.getEffectivePlan(subscription);
    const maxLimitMB = plan.cloudinary_storage_mb;
    const maxLimitBytes = maxLimitMB * 1024 * 1024;
    const totalProjectedBytes = usedBytes + fileSizeBytesToAdd;
    const usedMB = Number((totalProjectedBytes / (1024 * 1024)).toFixed(2));
    const remainingMB = Math.max(0, Number((maxLimitMB - usedMB).toFixed(2)));
    const allowed = totalProjectedBytes <= maxLimitBytes;

    return {
      allowed,
      currentCount: usedMB,
      maxLimit: maxLimitMB,
      remaining: remainingMB,
      percentageUsed: Math.min(100, Math.round((totalProjectedBytes / maxLimitBytes) * 100)),
      message: allowed
        ? `${remainingMB} MB Cloudinary storage remaining.`
        : `Storage quota exceeded (${usedMB} MB / ${maxLimitMB} MB). Upgrade to higher plan for more photo storage.`,
    };
  }

  /**
   * Checks if REST API access is permitted for this hotel.
   */
  static checkApiAccess(
    subscription?: HotelSubscription | null
  ): { allowed: boolean; monthlyQuota: number; rateLimitRpm: number; message: string } {
    const plan = this.getEffectivePlan(subscription);
    if (!plan.api_access_enabled) {
      return {
        allowed: false,
        monthlyQuota: 0,
        rateLimitRpm: 0,
        message: `REST API access is not included in the ${plan.name} plan. Upgrade to Pro Culinary or Enterprise Grand to generate API keys.`,
      };
    }

    return {
      allowed: true,
      monthlyQuota: plan.monthly_api_quota,
      rateLimitRpm: plan.api_rate_limit_rpm,
      message: `REST API active. Quota: ${plan.monthly_api_quota.toLocaleString()} calls/mo, Rate limit: ${plan.api_rate_limit_rpm} RPM.`,
    };
  }

  /**
   * Checks if custom guest page UI is enabled.
   */
  static canUseCustomGuestPage(subscription?: HotelSubscription | null): boolean {
    const plan = this.getEffectivePlan(subscription);
    return Boolean(plan.custom_guest_page_enabled);
  }

  /**
   * Checks if report export (CSV/PDF) is enabled.
   */
  static canExportReports(subscription?: HotelSubscription | null): boolean {
    const plan = this.getEffectivePlan(subscription);
    return Boolean(plan.analytics_export_enabled);
  }
}
