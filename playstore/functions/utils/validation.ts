// Validation utilities for all functions

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export const validators = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  phone: (phone: string): boolean => {
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  },

  address: (address: string): boolean => {
    return address && address.trim().length >= 10;
  },

  quantity: (qty: any): boolean => {
    const num = Number(qty);
    return !isNaN(num) && num > 0 && Number.isInteger(num);
  },

  price: (price: any): boolean => {
    const num = Number(price);
    return !isNaN(num) && num > 0;
  },

  name: (name: string): boolean => {
    return name && name.trim().length >= 2 && name.length <= 100;
  },

  discountPercent: (percent: any): boolean => {
    const num = Number(percent);
    return !isNaN(num) && num >= 0 && num <= 100;
  },

  cardToken: (token: string): boolean => {
    return token && token.startsWith('tok_') || token.startsWith('src_');
  },
};

export const validateCheckout = (data: any): ValidationResult => {
  const errors: string[] = [];

  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    errors.push('At least one item is required');
  } else {
    data.items.forEach((item: any, index: number) => {
      if (!validators.name(item.title)) {
        errors.push(`Item ${index + 1}: Invalid product title`);
      }
      if (!validators.quantity(item.quantity)) {
        errors.push(`Item ${index + 1}: Invalid quantity`);
      }
      if (!validators.price(item.price)) {
        errors.push(`Item ${index + 1}: Invalid price`);
      }
    });
  }

  if (!validators.email(data.customer_email)) {
    errors.push('Invalid customer email');
  }

  if (!validators.name(data.customer_name)) {
    errors.push('Invalid customer name');
  }

  if (!validators.address(data.customer_address)) {
    errors.push('Invalid customer address');
  }

  if (data.appliedCode && typeof data.appliedCode !== 'string') {
    errors.push('Invalid referral code');
  }

  if (data.discountPercent && !validators.discountPercent(data.discountPercent)) {
    errors.push('Invalid discount percentage');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const validateOrder = (data: any): ValidationResult => {
  const errors: string[] = [];

  if (!validators.email(data.customer_email)) {
    errors.push('Invalid customer email');
  }

  if (!validators.name(data.customer_name)) {
    errors.push('Invalid customer name');
  }

  if (!validators.address(data.customer_address)) {
    errors.push('Invalid customer address');
  }

  if (!data.items || !Array.isArray(data.items)) {
    errors.push('Invalid items array');
  }

  if (data.total && !validators.price(data.total)) {
    errors.push('Invalid order total');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const validateRestockOrder = (data: any): ValidationResult => {
  const errors: string[] = [];

  if (!validators.name(data.supplier_name)) {
    errors.push('Invalid supplier name');
  }

  if (!validators.email(data.supplier_email)) {
    errors.push('Invalid supplier email');
  }

  if (!data.products || !Array.isArray(data.products) || data.products.length === 0) {
    errors.push('At least one product is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
