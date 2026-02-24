/**
 * Image Storage Integration
 * Wrapper que usa Cloudinary para armazenamento de imagens
 * (Anteriormente usava Firebase Storage, agora usa Cloudinary Free Tier)
 */

export {
  uploadAirdropImage,
  deleteAirdropImage,
  generateAirdropId,
} from './cloudinary';
