/**
 * Firebase Storage Integration
 * Gerencia upload de imagens para Airdrops CMS
 */

import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

/**
 * Upload de imagem para pasta de airdrops
 * @param {File} file - Arquivo de imagem
 * @param {string} airdropId - ID do airdrop (usado como nome da pasta)
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
    // Criar referência: airdrops/{airdropId}/{timestamp}-{filename}
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const storageRef = ref(storage, `airdrops/${airdropId}/${filename}`);

    // Upload do ficheiro
    const snapshot = await uploadBytes(storageRef, file);

    // Retornar URL pública
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (error) {
    console.error('[storage] Erro ao fazer upload de imagem:', error);
    throw new Error(`Erro ao fazer upload: ${error.message}`);
  }
}

/**
 * Deletar imagem do Storage
 * @param {string} imageUrl - URL completa da imagem (ou path relativo)
 */
export async function deleteAirdropImage(imageUrl) {
  if (!imageUrl) return;

  try {
    // Se for URL completa do Firebase, extrair o path
    let imagePath = imageUrl;

    // Padrão: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?...
    if (imageUrl.includes('firebasestorage')) {
      const match = imageUrl.match(/o%2F(.+?)\?/);
      if (match) {
        imagePath = decodeURIComponent(match[1]);
      }
    }

    const imageRef = ref(storage, imagePath);
    await deleteObject(imageRef);
  } catch (error) {
    console.warn('[storage] Erro ao deletar imagem:', error);
    // Não fazer throw aqui porque pode ser uma imagem externa
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
    .substring(0, 50); // Limitar comprimento
}
