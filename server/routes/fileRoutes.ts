import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { getGridFSBucket } from '../db/connection';

const router = Router();

// GET /api/files/:id - stream or download file from MongoDB GridFS
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let objectId: mongoose.Types.ObjectId;

    try {
      objectId = new mongoose.Types.ObjectId(id);
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid GridFS file ObjectId.' });
    }

    const bucket = getGridFSBucket();
    const files = await bucket.find({ _id: objectId }).toArray();

    if (!files || files.length === 0) {
      return res.status(404).json({ success: false, message: 'File not found in GridFS storage.' });
    }

    const fileMeta = files[0];
    const originalName = fileMeta.metadata?.originalFileName || fileMeta.filename || 'downloaded_file';
    const contentType = (fileMeta.metadata as any)?.contentType || (fileMeta as any).contentType || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', fileMeta.length);

    // If download query param is set, trigger download header
    if (req.query.download === 'true') {
      res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
    } else {
      res.setHeader('Content-Disposition', `inline; filename="${originalName}"`);
    }

    const downloadStream = bucket.openDownloadStream(objectId);
    downloadStream.on('error', (err) => {
      console.error('GridFS stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Failed to stream file from GridFS.' });
      }
    });

    downloadStream.pipe(res);
  } catch (err: any) {
    console.error('File route error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
