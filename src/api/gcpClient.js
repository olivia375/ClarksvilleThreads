import { auth, API_URL } from '../lib/firebase-config';

/**
 * Get the current user's auth token
 */
const getAuthToken = async () => {
  const user = auth.currentUser;
  if (!user) {
    return null;
  }
  return user.getIdToken();
};

/**
 * Make an authenticated API request
 */
const apiRequest = async (endpoint, options = {}) => {
  const token = await getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
};

/**
 * Entity operations - mimics Base44 SDK pattern
 */
const createEntityClient = (collection) => ({
  /**
   * List all items
   */
  list: async (sortBy = '-created_at') => {
    return apiRequest(`/${collection}?sort=${encodeURIComponent(sortBy)}`);
  },

  /**
   * Get a single item by ID
   */
  get: async (id) => {
    return apiRequest(`/${collection}/${id}`);
  },

  /**
   * Create a new item
   */
  create: async (data) => {
    return apiRequest(`/${collection}`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  /**
   * Update an item
   */
  update: async (id, data) => {
    return apiRequest(`/${collection}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  /**
   * Delete an item
   */
  delete: async (id) => {
    return apiRequest(`/${collection}/${id}`, {
      method: 'DELETE'
    });
  },

  /**
   * Filter items by criteria
   * @param {Object} filters - Filter criteria
   * @param {Object} options - Additional options (sort, limit)
   */
  filter: async (filters, sortOrOptions, limit) => {
    const opts = typeof sortOrOptions === 'string'
      ? { sort: sortOrOptions, limit }
      : sortOrOptions || {};
    return apiRequest(`/${collection}/filter`, {
      method: 'POST',
      body: JSON.stringify({ filters, ...opts })
    });
  }
});

/**
 * Entities - Maps to Firestore collections
 */
export const entities = {
  Business: {
    ...createEntityClient('businesses'),
    getMyBusiness: async () => {
      return apiRequest('/businesses/owner/me');
    },
    toggleEmailNotifications: async (id, enabled) => {
      return apiRequest(`/businesses/${id}/email-notifications`, {
        method: 'PUT',
        body: JSON.stringify({ enabled })
      });
    }
  },
  VolunteerOpportunity: createEntityClient('opportunities'),
  VolunteerCommitment: {
    ...createEntityClient('commitments'),
    getByBusiness: async (businessId) => {
      return apiRequest(`/commitments/business/${businessId}`);
    }
  },
  Notification: createEntityClient('notifications'),
  Favorite: createEntityClient('favorites'),
  Review: createEntityClient('reviews')
};

/**
 * Auth operations
 */
export const authClient = {
  me: async () => {
    return apiRequest('/auth/me');
  },

  updateMe: async (data) => {
    return apiRequest('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  register: async (data) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};

/**
 * Integrations - Maps to Cloud Functions endpoints
 */
export const integrations = {
  Core: {
    /**
     * Invoke LLM (Vertex AI)
     */
    InvokeLLM: async ({ prompt, model, temperature, maxOutputTokens }) => {
      return apiRequest('/chat/invoke', {
        method: 'POST',
        body: JSON.stringify({ prompt, model, temperature, maxOutputTokens })
      });
    },

    /**
     * Send email via SendGrid
     */
    SendEmail: async ({ from_name, to, subject, body }) => {
      // Email sending is handled server-side via Cloud Functions
      // This is a placeholder for client-side if needed
      console.log('Email sending is handled server-side');
      return { success: true };
    },

    /**
     * Upload file
     */
    UploadFile: async ({ file, fileName, contentType }) => {
      // Get signed URL for upload
      const { uploadUrl, fileUrl } = await apiRequest('/uploads/signed-url', {
        method: 'POST',
        body: JSON.stringify({ fileName, contentType })
      });

      // Upload file to signed URL
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': contentType
        }
      });

      return { url: fileUrl };
    },

    /**
     * Upload file as base64 (for small files)
     */
    UploadFileBase64: async ({ base64Data, fileName, contentType }) => {
      return apiRequest('/uploads/file', {
        method: 'POST',
        body: JSON.stringify({ base64Data, fileName, contentType })
      });
    }
  }
};

/**
 * Try admin endpoint first, fall back to regular endpoint
 */
const adminOrFallback = async (adminPath, fallbackPath) => {
  try {
    return await apiRequest(adminPath);
  } catch {
    return apiRequest(fallbackPath);
  }
};

/**
 * Admin operations - requires is_admin on user record
 * List endpoints fall back to regular entity endpoints when admin routes are not deployed
 */
export const adminClient = {
  getStats: async () => {
    try {
      return await apiRequest('/admin/stats');
    } catch {
      // Admin stats endpoint not deployed — return null so the UI computes from list data
      return null;
    }
  },

  // Users
  listUsers: async () => {
    try {
      return await apiRequest('/admin/users');
    } catch {
      // No fallback for users list — admin routes required
      return [];
    }
  },
  getUser: (uid) => apiRequest(`/admin/users/${uid}`),
  updateUser: (uid, data) => apiRequest(`/admin/users/${uid}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (uid) => apiRequest(`/admin/users/${uid}`, { method: 'DELETE' }),

  // Businesses — fall back to public endpoint
  listBusinesses: () => adminOrFallback('/admin/businesses', '/businesses'),
  updateBusiness: async (id, data) => {
    try {
      return await apiRequest(`/admin/businesses/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    } catch {
      return apiRequest(`/businesses/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    }
  },
  deleteBusiness: async (id) => {
    try {
      return await apiRequest(`/admin/businesses/${id}`, { method: 'DELETE' });
    } catch {
      return apiRequest(`/businesses/${id}`, { method: 'DELETE' });
    }
  },

  // Opportunities — fall back to public endpoint
  listOpportunities: () => adminOrFallback('/admin/opportunities', '/opportunities'),
  updateOpportunity: async (id, data) => {
    try {
      return await apiRequest(`/admin/opportunities/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    } catch {
      return apiRequest(`/opportunities/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    }
  },
  deleteOpportunity: async (id) => {
    try {
      return await apiRequest(`/admin/opportunities/${id}`, { method: 'DELETE' });
    } catch {
      return apiRequest(`/opportunities/${id}`, { method: 'DELETE' });
    }
  },
};

/**
 * GCP Client - Main export
 * Provides a similar interface to the Base44 SDK
 */
const gcpClient = {
  entities,
  auth: authClient,
  integrations,
  admin: adminClient
};

export default gcpClient;
