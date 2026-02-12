import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { storage } from '../config/firebase.js';

const router = Router();

const BUCKET_NAME = 'community-threads-486622-2c2e0-uploads';

/**
 * POST /uploads/signed-url
 * Get a signed URL for uploading a file
 */
router.post('/signed-url', verifyToken, async (req, res, next) => {
  try {
    const { fileName, contentType } = req.body;

    if (!fileName || !contentType) {
      return res.status(400).json({ error: 'fileName and contentType are required' });
    }

    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(`uploads/${req.user.uid}/${Date.now()}-${fileName}`);

    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType
    });

    res.json({
      uploadUrl: signedUrl,
      fileUrl: `https://storage.googleapis.com/${BUCKET_NAME}/${file.name}`
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /uploads/file
 * Upload a file directly (for small files)
 * Note: For larger files, use signed URLs
 */
router.post('/file', verifyToken, async (req, res, next) => {
  try {
    const { fileName, contentType, base64Data } = req.body;

    if (!fileName || !contentType || !base64Data) {
      return res.status(400).json({ error: 'fileName, contentType, and base64Data are required' });
    }

    const bucket = storage.bucket(BUCKET_NAME);
    const filePath = `uploads/${req.user.uid}/${Date.now()}-${fileName}`;
    const file = bucket.file(filePath);

    const buffer = Buffer.from(base64Data, 'base64');

    await file.save(buffer, {
      metadata: {
        contentType
      }
    });

    // Make the file publicly readable (optional, depends on your needs)
    await file.makePublic();

    const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${filePath}`;

    res.json({
      url: publicUrl,
      path: filePath
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /uploads/file
 * Delete a file
 */
router.delete('/file', verifyToken, async (req, res, next) => {
  try {
    const { filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({ error: 'filePath is required' });
    }

    // Verify the file belongs to the user
    if (!filePath.includes(`uploads/${req.user.uid}/`)) {
      return res.status(403).json({ error: 'Not authorized to delete this file' });
    }

    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(filePath);

    await file.delete();

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
