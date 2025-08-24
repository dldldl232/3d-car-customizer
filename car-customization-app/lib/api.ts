// API client for interacting with the FastAPI backend

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

export interface CarModel {
  id: number;
  name: string;
  manufacturer: string;
  year: number;
  glb_url: string;  // Updated to use GLB URLs
  thumbnail_url: string;
  license_slug: string;
  license_url: string;
  attribution_html: string;
  source_url: string;
  uploader: string;
  source_uid: string;
  bounds: string;
  scale_factor: number;
}

export interface Part {
  id: number;
  name: string;
  type: string;
  category: string;  // Added missing field
  price: number;
  glb_url: string;  // Updated to use GLB URLs
  thumbnail_url: string;
  license_slug: string;
  license_url: string;
  attribution_html: string;
  source_url: string;
  uploader: string;
  source_uid: string;
  intrinsic_size: string;  // JSON string for auto-scaling
  nominal_size: number;  // Added missing field
  pivot_hint: string;  // Added missing field
  symmetry: string;  // Added missing field
  bounding_box: string;  // Added missing field
  attach_to: string;  // Anchor node name
  pos_x: number;
  pos_y: number;
  pos_z: number;
  rot_x: number;
  rot_y: number;
  rot_z: number;
  scale_x: number;
  scale_y: number;
  scale_z: number;
}

export interface Anchor {
  id: number;
  car_model_id: number;
  name: string;
  type: string;
  pos_x: number;
  pos_y: number;
  pos_z: number;
  rot_x: number;
  rot_y: number;
  rot_z: number;
  scale_x: number;
  scale_y: number;
  scale_z: number;
  anchor_metadata: string;  // JSON string for extras
  symmetry_pair_id?: number;
  expected_diameter?: number;
  bounds: string;
}

export interface Fitment {
  id: string;
  car_model_id: number;
  part_id: number;
  anchor_id: number;
  part_variant_hash: string;
  transform_override: {
    position: [number, number, number];
    rotation_euler: [number, number, number];
    scale: [number, number, number];
  };
  quality_score: number;
  scope: string;
  created_by_user_id?: number;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface SavedCar {
  id: number;
  user_id: number;
  car_model_id: number;
  name: string;
  created_at: string;
  part_ids: number[];
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  private async authenticatedRequest<T>(endpoint: string, token: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  // Authentication
  async login(email: string, password: string): Promise<{ access_token: string; user: User }> {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);

    const response = await fetch(`${this.baseUrl}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(formData as any),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    return response.json();
  }

  async register(userData: { email: string; password: string; first_name: string; last_name: string }): Promise<User> {
    return this.request<User>('/users/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Car Models
  async getCarModels(): Promise<CarModel[]> {
    return this.request<CarModel[]>('/car_models/');
  }

  async getCarModel(id: number): Promise<CarModel> {
    return this.request<CarModel>(`/car_models/${id}`);
  }

  // Parts
  async getParts(carModelId?: number): Promise<Part[]> {
    if (carModelId) {
      return this.request<Part[]>(`/parts/car_model/${carModelId}`);
    }
    return this.request<Part[]>('/parts/');
  }

  async getPart(id: number): Promise<Part> {
    return this.request<Part>(`/parts/${id}`);
  }

  // Anchors
  async getAnchors(carModelId: number): Promise<Anchor[]> {
    const response = await this.request<Anchor[]>(`/car_models/${carModelId}/anchors`);
    return response;
  }

  // Fitments
  async getFitments(params?: {
    car_model_id?: number;
    part_id?: number;
    anchor_id?: number;
    scope?: string;
  }): Promise<Fitment[]> {
    const searchParams = new URLSearchParams();
    if (params?.car_model_id) searchParams.append('car_model_id', params.car_model_id.toString());
    if (params?.part_id) searchParams.append('part_id', params.part_id.toString());
    if (params?.anchor_id) searchParams.append('anchor_id', params.anchor_id.toString());
    if (params?.scope) searchParams.append('scope', params.scope);
    
    const queryString = searchParams.toString();
    const url = queryString ? `/fitments/?${queryString}` : '/fitments/';
    return this.request<Fitment[]>(url);
  }

  async getBestFitment(
    carModelId: number,
    partId: number,
    anchorId: number,
    partVariantHash?: string
  ): Promise<Fitment | null> {
    const searchParams = new URLSearchParams({
      car_model_id: carModelId.toString(),
      part_id: partId.toString(),
      anchor_id: anchorId.toString(),
    });
    if (partVariantHash) searchParams.append('part_variant_hash', partVariantHash);
    
    const url = `/fitments/best?${searchParams.toString()}`;
    return this.request<Fitment | null>(url);
  }

  async createFitment(token: string, fitmentData: {
    car_model_id: number;
    part_id: number;
    anchor_id: number;
    part_variant_hash?: string;
    transform_override: {
      position: [number, number, number];
      rotation_euler: [number, number, number];
      scale: [number, number, number];
    };
    scope?: string;
  }): Promise<Fitment> {
    return this.authenticatedRequest<Fitment>('/fitments/', token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fitmentData)
    });
  }

  // Get manual adjustments for a car model
  async getManualAdjustments(token: string, carModelId: number): Promise<any[]> {
    return this.authenticatedRequest(`/fitments/?car_model_id=${carModelId}&scope=user`, token);
  }

  // Save manual adjustment
  async saveManualAdjustment(token: string, adjustmentData: {
    car_model_id: number;
    part_id: number;
    transform: any;
  }): Promise<any> {
    console.log('🔍 API Client: Sending manual adjustment request');
    console.log('🔍 API Client: Token:', token ? 'Present' : 'Missing');
    console.log('🔍 API Client: Adjustment data:', adjustmentData);
    console.log('🔍 API Client: Request body:', JSON.stringify(adjustmentData, null, 2));
    
    try {
      const result = await this.authenticatedRequest('/fitments/manual-adjustment', token, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adjustmentData),
      });
      console.log('🔍 API Client: Request successful:', result);
      return result;
    } catch (error) {
      console.error('🔍 API Client: Request failed:', error);
      console.error('🔍 API Client: Error details:', error);
      throw error;
    }
  }

  async deleteFitment(fitmentId: string): Promise<void> {
    return this.request<void>(`/fitments/${fitmentId}`, {
      method: 'DELETE',
    });
  }

  // Saved Cars
  async getSavedCars(token: string): Promise<SavedCar[]> {
    return this.authenticatedRequest<SavedCar[]>('/saved_cars/', token);
  }

  async getSavedCar(token: string, id: number): Promise<SavedCar> {
    return this.authenticatedRequest<SavedCar>(`/saved_cars/${id}`, token);
  }

  async saveCar(token: string, data: { car_model_id: number; name: string; part_ids: number[] }): Promise<SavedCar> {
    return this.authenticatedRequest<SavedCar>('/saved_cars/', token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  async deleteSavedCar(token: string, id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/saved_cars/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Don't try to parse JSON for 204 No Content responses
    if (response.status === 204) {
      return;
    }

    return response.json();
  }

  // Cost estimation
  async estimateCost(partIds: number[]): Promise<{ total_cost: number }> {
    return this.request<{ total_cost: number }>('/parts/estimate_cost/', {
      method: 'POST',
      body: JSON.stringify({ part_ids: partIds }),
    });
  }

  // Compatible parts
  async getCompatibleParts(partId: number): Promise<Part[]> {
    return this.request<Part[]>(`/parts/${partId}/compatible`);
  }
}

// Create a singleton instance
export const apiClient = new ApiClient();

// Export the class for testing or custom instances
export { ApiClient };
