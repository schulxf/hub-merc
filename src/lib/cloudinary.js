/**
 * Cloudinary Integration
 * Gerencia upload de imagens para Airdrops CMS
 * Free tier: 25GB de armazenamento, uploads ilimitados
 */

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY;
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

/**
 * Upload de imagem para Cloudinary
 * @param {File} file - Arquivo de imagem
 * @param {string} airdropId - ID do airdrop (usado como tag para organização)
 * @returns {Promise<string>} URL pública da imagem
 */
export async function uploadAirdropImage(file, airdropId) {
  if (!file || !airdropId) {
    throw new Error('Ficheiro e ID do airdrop são obrigatórios');
  }

  // Validações básicas
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Ficheiro muito grande (máximo 5MB)');
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Tipo de ficheiro não suportado. Use JPEG, PNG, WebP ou GIF');
  }

  try {
    // Criar FormData para upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'unsigned_upload'); // OBRIGATÓRIO para unsigned upload
    formData.append('api_key', CLOUDINARY_API_KEY);
    formData.append('tags', `airdrop,${airdropId}`); // Organizar com tags
    formData.append('folder', `mercurius-airdrops/${airdropId}`); // Organizar em pastas

    console.log('[cloudinary] Iniciando upload para Cloudinary...', {
      file: file.name,
      size: file.size,
      airdropId
    });

    // Fazer upload
    const response = await fetch(UPLOAD_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[cloudinary] Erro do servidor:', errorData);
      throw new Error(`Cloudinary upload failed: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();

    if (!data.secure_url) {
      throw new Error('URL não retornada pelo Cloudinary');
    }

    console.log('[cloudinary] Upload bem-sucedido:', data.secure_url);
    return data.secure_url;
  } catch (error) {
    console.error('[cloudinary] Erro ao fazer upload:', error);
    throw new Error(`Erro ao fazer upload: ${error.message}`);
  }
}

/**
 * Deletar imagem do Cloudinary via public_id
 * @param {string} imageUrl - URL completa da imagem
 */
export async function deleteAirdropImage(imageUrl) {
  if (!imageUrl) return;

  try {
    // Extrair public_id da URL (formato: https://res.cloudinary.com/{cloud}/image/upload/v{version}/{public_id}.{ext})
    // Exemplo: https://res.cloudinary.com/dahfnfnyl/image/upload/v1708...mercurius-airdrops/robinhood/1708...jpg

    const match = imageUrl.match(/upload\/(?:v\d+\/)?(.+)\.\w+$/);
    if (!match) {
      console.warn('[cloudinary] Não foi possível extrair public_id da URL:', imageUrl);
      return;
    }

    const publicId = match[1];
    console.log('[cloudinary] Deletando imagem:', publicId);

    // Para deletar é necessário usar Admin API (requer autenticação)
    // Por enquanto, apenas logamos a intenção
    // Uma alternativa é usar Cloudinary SDK completo ou configurar webhook
    console.log('[cloudinary] Nota: Deleção de imagem requer Admin API (não implementado no free tier)');

    // Se em produção precisar deletar, pode usar:
    // POST https://api.cloudinary.com/v1_1/{cloud_name}/resources/image/upload
    // COM api_secret (não deve ser exposto no cliente)
  } catch (error) {
    console.warn('[cloudinary] Erro ao preparar deleção:', error);
    // Não fazer throw porque pode ser uma imagem externa
  }
}

/**
 * Helper para gerar ID único para airdrop
 * @param {string} name - Nome do airdrop
 * @returns {string} ID único (slug)
 */
export function generateAirdropId(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}
