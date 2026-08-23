const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  token?: string;
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {}, token } = options;

  const config: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };

  const res = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await res.json();

  if (!res.ok) {
    throw new ApiError(data.message || "Something went wrong", res.status);
  }

  return data;
}

// Auth API
export const authApi = {
  register: (data: { username: string; email: string; password: string }) =>
    request<{ success: boolean; data: { user: User; token: string } }>("/users/register", {
      method: "POST",
      body: data,
    }),

  login: (data: { email: string; password: string }) =>
    request<{ success: boolean; data: { user: User; token: string } }>("/users/login", {
      method: "POST",
      body: data,
    }),

  getProfile: (token: string) =>
    request<{ success: boolean; data: User }>("/users/profile", { token }),

  updateProfile: (token: string, data: Partial<User>) =>
    request<{ success: boolean; data: User }>("/users/profile", {
      method: "PUT",
      body: data,
      token,
    }),
};

// Restaurant API
export const restaurantApi = {
  getAll: () =>
    request<{ success: boolean; data: Restaurant[] }>("/restaurants"),

  getById: (id: string) =>
    request<{ success: boolean; data: Restaurant & { menu: MenuItem[] } }>(`/restaurants/${id}`),

  getMenu: (id: string) =>
    request<{ success: boolean; data: MenuItem[] }>(`/restaurants/${id}/menu`),

  create: (token: string, data: Partial<Restaurant>) =>
    request<{ success: boolean; data: Restaurant }>("/restaurants", {
      method: "POST",
      body: data,
      token,
    }),

  update: (token: string, id: string, data: Partial<Restaurant>) =>
    request<{ success: boolean; data: Restaurant }>(`/restaurants/${id}`, {
      method: "PUT",
      body: data,
      token,
    }),
};

// Order API
export const orderApi = {
  create: (
    token: string,
    data: {
      restaurantId: string;
      items: { menuId: string; quantity: number }[];
      deliveryAddress?: string;
      paymentMethod?: string;
    }
  ) =>
    request<{ success: boolean; data: Order }>("/orders", {
      method: "POST",
      body: data,
      token,
    }),

  getUserOrders: (token: string, page = 1, limit = 10) =>
    request<{ success: boolean; data: { orders: Order[]; page: number; totalPages: number; total: number } }>(
      `/orders/user/me?page=${page}&limit=${limit}`,
      { token }
    ),

  getById: (token: string, id: string) =>
    request<{ success: boolean; data: Order }>(`/orders/${id}`, { token }),

  updateStatus: (token: string, id: string, status: string) =>
    request<{ success: boolean; data: Order }>(`/orders/${id}/status`, {
      method: "PUT",
      body: { status },
      token,
    }),
};

// Review API
export const reviewApi = {
  getByRestaurant: (restaurantId: string) =>
    request<{ success: boolean; data: Review[] }>(`/reviews/restaurant/${restaurantId}`),

  create: (token: string, data: { restaurantId: string; rating: number; comment?: string }) =>
    request<{ success: boolean; data: Review }>("/reviews", {
      method: "POST",
      body: data,
      token,
    }),
};

// Types
export interface User {
  _id: string;
  username: string;
  email: string;
  role: "customer" | "restaurant" | "delivery" | "admin";
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  isActive: boolean;
  createdAt: string;
}

export interface Restaurant {
  _id: string;
  name: string;
  description?: string;
  cuisine: string[];
  phone?: string;
  address: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  rating: number;
  isOpen: boolean;
  menu: string[] | MenuItem[];
  owner: string;
  createdAt: string;
}

export interface MenuItem {
  _id: string;
  restaurantId: string;
  name: string;
  description?: string;
  price: number;
  category: "appetizer" | "main" | "drink" | "dessert";
  isAvailable: boolean;
  imageUrl?: string;
  prepTime: number;
}

export interface Order {
  _id: string;
  userId: string;
  restaurantId: string | Restaurant;
  items: {
    menuId: string | MenuItem;
    quantity: number;
    priceAtPurchase: number;
  }[];
  totalAmount: number;
  status: "pending" | "confirmed" | "preparing" | "out_for_delivery" | "delivered" | "cancelled";
  paymentMethod: "card" | "cash" | "wallet";
  deliveryAddress?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  createdAt: string;
}

export interface Review {
  _id: string;
  userId: string | User;
  restaurantId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export { ApiError };
