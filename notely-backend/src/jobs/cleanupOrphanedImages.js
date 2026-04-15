const cron = require('node-cron');
const prisma = require('../config/db');
const supabase = require('../config/supabase');

const IMAGE_URL_REGEX = /https:\/\/[^"]+\/storage\/v1\/object\/public\/images\/([^"]+)/g;

async function cleanupOrphanedImages() {
  console.log('[Cleanup Job] Starting orphaned images cleanup...');
  try {
    // 1. Fetch all notes content
    const notes = await prisma.note.findMany({
      select: { content: true }
    });

    // 2. Extract all used image filenames
    const usedImages = new Set();
    notes.forEach(note => {
      if (note.content) {
        const contentStr = JSON.stringify(note.content);
        const matches = [...contentStr.matchAll(IMAGE_URL_REGEX)];
        matches.forEach(m => usedImages.add(m[1]));
      }
    });

    // 3. Fetch all files from Supabase storage
    const { data: files, error } = await supabase.storage.from('images').list();
    
    if (error) {
      console.error('[Cleanup Job] Error fetching files from Supabase:', error);
      return;
    }

    if (!files || files.length === 0) {
      console.log('[Cleanup Job] No images found in bucket.');
      return;
    }

    // 4. Determine orphaned files
    // Ignore files starting with . (like .emptyFolderPlaceholder)
    const orphanedFiles = files
      .filter(file => !file.name.startsWith('.') && !usedImages.has(file.name))
      .map(file => file.name);

    if (orphanedFiles.length > 0) {
      console.log(`[Cleanup Job] Found ${orphanedFiles.length} orphaned images. Deleting...`);
      // Delete in chunks of 100 to avoid limits
      for (let i = 0; i < orphanedFiles.length; i += 100) {
        const chunk = orphanedFiles.slice(i, i + 100);
        const { error: deleteError } = await supabase.storage.from('images').remove(chunk);
        if (deleteError) {
          console.error('[Cleanup Job] Error deleting batch (you may need to add SUPABASE_SERVICE_ROLE_KEY to your backend .env):', deleteError);
        }
      }
      console.log('[Cleanup Job] Orphaned images cleanup complete.');
    } else {
      console.log('[Cleanup Job] No orphaned images to clean up.');
    }

  } catch (err) {
    console.error('[Cleanup Job] Unexpected error during cleanup:', err);
  }
}

function startCleanupJob() {
  // Run once a week on Sunday at midnight
  cron.schedule('0 0 * * 0', () => {
    cleanupOrphanedImages();
  });
  console.log('[Cleanup Job] Scheduled orphaned image cleanup cron job.');
}

module.exports = { startCleanupJob, cleanupOrphanedImages };
