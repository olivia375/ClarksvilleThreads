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
  Business: createEntityClient('businesses'),
  VolunteerOpportunity: createEntityClient('opportunities'),
  VolunteerCommitment: createEntityClient('commitments'),
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
 * GCP Client - Main export
 * Provides a similar interface to the Base44 SDK
 */
const gcpClient = {
  entities,
  auth: authClient,
  integrations
};

export default gcpClient;
