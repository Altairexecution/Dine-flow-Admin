export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  tagline?: string;
  description?: string;
  phone: string;
  whatsappNumber?: string;
  email: string;
  address: string;
  city: string;
  googleMapsUrl?: string;
  cuisineTypes: string[];
  logo: string;
  coverImage: string;
  status: 'active' | 'suspended';
  ownerId?: string;
  ownerEmail?: string;
  ownerName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface RestaurantStats {
  totalBookings: number;
  totalCustomers: number;
  activeTables: number;
  menuItemsCount: number;
  automationDispatches: number;
}
