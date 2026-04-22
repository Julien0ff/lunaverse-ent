export interface Profile {
  id: string;
  discord_id: string;
  username: string;
  avatar_url: string | null;
  balance: number;
  last_daily: string | null;
  last_salary: string | null;
  created_at: string;
  updated_at: string;
  pronote_id: string | null;
  // Survival stats — names match Discord bot columns
  health:   number;
  hunger:   number; // 0-100, faim
  thirst:   number; // 0-100, soif
  fatigue:  number; // 0-100, fatigue
  hygiene:  number; // 0-100, hygiène
  alcohol:  number; // 0-100, alcoolémie
  // Dating fields
  dating_photo_url: string | null;
  dating_bio: string | null;
}

export interface Role {
  id: string;
  name: string;
  discord_role_id: string;
  salary_amount: number;
  pocket_money: number;
  color: string;
}

export interface UserRole {
  user_id: string;
  role_id: string;
  role?: Role;
  assigned_at: string;
}

export interface Transaction {
  id: string;
  from_user_id: string | null;
  to_user_id: string | null;
  amount: number;
  type: 'transfer' | 'daily' | 'salary' | 'shop' | 'casino' | 'pocket_money';
  description: string | null;
  created_at: string;
  from_user?: Profile;
  to_user?: Profile;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  channel_id: string | null;
  message_id: string | null;
  created_at: string;
  user?: Profile;
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: Profile;
}

export interface Like {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: 'drinks' | 'snacks' | 'cigarettes' | 'other';
  image_url: string | null;
  is_available: boolean;
}

export interface Purchase {
  id: string;
  user_id: string;
  item_id: string;
  quantity: number;
  total_price: number;
  created_at: string;
  item?: ShopItem;
}

export interface CasinoGame {
  id: string;
  name: string;
  description: string | null;
  min_bet: number;
  max_bet: number;
  multiplier_min: number;
  multiplier_max: number;
}

export interface CasinoHistory {
  id: string;
  user_id: string;
  game_id: string;
  bet_amount: number;
  win_amount: number;
  is_win: boolean;
  created_at: string;
  game?: CasinoGame;
}
