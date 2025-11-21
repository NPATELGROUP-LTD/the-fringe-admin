import type { Offer } from '@/types/database';

/**
 * Calculate the discounted price based on an offer
 * @param originalPrice The original price before discount
 * @param offer The offer object containing discount details
 * @returns The discounted price
 */
export function calculateDiscountedPrice(originalPrice: number, offer: Offer): number {
  if (!offer.is_active) {
    return originalPrice;
  }

  // Check if offer is within validity period
  const now = new Date();
  const validFrom = new Date(offer.valid_from);
  const validUntil = new Date(offer.valid_until);

  if (now < validFrom || now > validUntil) {
    return originalPrice;
  }

  // Check usage limit
  if (offer.usage_limit && offer.usage_count >= offer.usage_limit) {
    return originalPrice;
  }

  let discountedPrice: number;

  if (offer.discount_type === 'percentage') {
    const discountAmount = originalPrice * (offer.discount_value / 100);
    discountedPrice = originalPrice - discountAmount;
  } else if (offer.discount_type === 'fixed') {
    discountedPrice = originalPrice - offer.discount_value;
  } else {
    // Invalid discount type, return original price
    return originalPrice;
  }

  // Ensure discounted price is not negative
  return Math.max(0, discountedPrice);
}

/**
 * Calculate the discount amount (how much is saved)
 * @param originalPrice The original price before discount
 * @param offer The offer object containing discount details
 * @returns The discount amount
 */
export function calculateDiscountAmount(originalPrice: number, offer: Offer): number {
  const discountedPrice = calculateDiscountedPrice(originalPrice, offer);
  return originalPrice - discountedPrice;
}

/**
 * Check if an offer is currently valid and available
 * @param offer The offer object
 * @returns True if the offer is valid and available
 */
export function isOfferValid(offer: Offer): boolean {
  if (!offer.is_active) {
    return false;
  }

  const now = new Date();
  const validFrom = new Date(offer.valid_from);
  const validUntil = new Date(offer.valid_until);

  if (now < validFrom || now > validUntil) {
    return false;
  }

  if (offer.usage_limit && offer.usage_count >= offer.usage_limit) {
    return false;
  }

  return true;
}

/**
 * Format discount display text
 * @param offer The offer object
 * @returns Formatted discount text (e.g., "10% off", "$50 off")
 */
export function formatDiscountText(offer: Offer): string {
  if (offer.discount_type === 'percentage') {
    return `${offer.discount_value}% off`;
  } else if (offer.discount_type === 'fixed') {
    return `$${offer.discount_value} off`;
  }
  return '';
}