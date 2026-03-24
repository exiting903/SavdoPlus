export type UserRole = 'owner' | 'seller';

export interface UserProfile {
  uid: string;
  full_name: string;
  email: string;
  role: UserRole;
  shop_id?: string;
}

export interface Shop {
  id: string;
  name: string;
  owner_id: string;
}

export interface Product {
  id: string;
  shop_id: string;
  name: string;
  category: string;
  selling_price: number;
  purchase_price?: number;
  quantity: number;
  unit: string;
  barcode?: string;
  min_stock_threshold: number;
  created_at: any;
  updated_at: any;
}

export interface Sale {
  id: string;
  shop_id: string;
  product_id: string;
  product_name_snapshot: string;
  quantity: number;
  unit_price_snapshot: number;
  total_amount: number;
  sold_by: string;
  created_at: any;
  reversed?: boolean;
}

export interface InventoryAdjustment {
  id: string;
  shop_id: string;
  product_id: string;
  type: 'restock' | 'correction' | 'damaged' | 'manual';
  quantity_change: number;
  note?: string;
  adjusted_by: string;
  created_at: any;
}
