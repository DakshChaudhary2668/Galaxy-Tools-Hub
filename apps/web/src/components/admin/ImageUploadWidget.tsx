'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, ImagePlus, Loader2, Star, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  completeProductImage,
  deleteProductImage,
  getProductImages,
  getProductImageUploadUrl,
  setPrimaryProductImage
} from '@/services/product.service';
import { ProductImageDto } from '@galaxy/types';

const MAX_IMAGES = 6;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
type LocalImage = { file: File; previewUrl: string };

interface ImageUploadWidgetProps {
  productId?: string;
  onFilesChange?: (files: File[]) => void;
  disabled?: boolean;
}

const imageUrl = (image: ProductImageDto) => image.public_url || image.storage_path;

export function ImageUploadWidget({ productId, onFilesChange, disabled = false }: ImageUploadWidgetProps) {
  const [images, setImages] = useState<ProductImageDto[]>([]);
  const [localImages, setLocalImages] = useState<LocalImage[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadImages = useCallback(async () => {
    if (!productId) return;
    try { setImages(await getProductImages(productId)); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to load product images.'); }
  }, [productId]);

  useEffect(() => { loadImages(); }, [loadImages]);

  const validateFiles = (files: File[]): string | null => {
    const currentCount = productId ? images.length : localImages.length;
    if (files.length + currentCount > MAX_IMAGES) return `A product can have at most ${MAX_IMAGES} images.`;
    const invalidType = files.find((file) => !ALLOWED_MIME_TYPES.includes(file.type));
    if (invalidType) return `${invalidType.name}: only JPEG, PNG, and WebP images are allowed.`;
    const tooLarge = files.find((file) => file.size > MAX_FILE_SIZE_BYTES);
    return tooLarge ? `${tooLarge.name}: maximum file size is 5 MB.` : null;
  };

  const uploadOne = async (file: File) => {
    if (!productId) return;
    const extension = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
    const signed = await getProductImageUploadUrl({
      product_id: productId,
      mime_type: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
      file_size: file.size,
      extension
    });
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .uploadToSignedUrl(signed.path, signed.token, file, { contentType: file.type });
    if (uploadError) throw new Error(uploadError.message);
    await completeProductImage(productId, { storage_path: signed.path, alt_text: file.name });
  };

  const selectFiles = async (selected: File[]) => {
    setError(null);
    setMessage(null);
    const validationError = validateFiles(selected);
    if (validationError) { setError(validationError); return; }

    if (!productId) {
      const next = [...localImages, ...selected.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }))];
      setLocalImages(next);
      onFilesChange?.(next.map((item) => item.file));
      return;
    }

    setBusy(true);
    try {
      for (const file of selected) await uploadOne(file);
      await loadImages();
      setMessage(`${selected.length} image${selected.length === 1 ? '' : 's'} uploaded.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed.');
      await loadImages();
    } finally { setBusy(false); }
  };

  const removeLocal = (index: number) => {
    URL.revokeObjectURL(localImages[index].previewUrl);
    const next = localImages.filter((_, itemIndex) => itemIndex !== index);
    setLocalImages(next);
    onFilesChange?.(next.map((item) => item.file));
  };

  const removeSaved = async (image: ProductImageDto) => {
    if (!productId || !confirm('Remove this product image?')) return;
    setBusy(true);
    setError(null);
    try {
      await deleteProductImage(productId, image.id);
      await loadImages();
      setMessage('Image removed from the product and managed storage.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to remove image.'); }
    finally { setBusy(false); }
  };

  const makePrimary = async (image: ProductImageDto) => {
    if (!productId || image.is_primary) return;
    setBusy(true);
    setError(null);
    try {
      await setPrimaryProductImage(productId, image.id);
      await loadImages();
      setMessage('Primary image updated.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to update primary image.'); }
    finally { setBusy(false); }
  };

  const displayImages = productId
    ? images.map((image) => ({ id: image.id, url: imageUrl(image), primary: image.is_primary, saved: image }))
    : localImages.map((image, index) => ({ id: `${image.file.name}-${index}`, url: image.previewUrl, primary: index === 0, index }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input ref={fileInputRef} hidden multiple type="file" accept="image/jpeg,image/png,image/webp"
        disabled={disabled || busy || displayImages.length >= MAX_IMAGES}
        onChange={(event) => { selectFiles(Array.from(event.target.files || [])); event.target.value = ''; }} />
      {error && <div style={{ color: '#991B1B', background: '#FEF2F2', padding: 10, borderRadius: 6, fontSize: 12, display: 'flex', gap: 8 }}><AlertCircle size={16} />{error}</div>}
      {message && <div style={{ color: '#166534', background: '#DCFCE7', padding: 10, borderRadius: 6, fontSize: 12, display: 'flex', gap: 8 }}><CheckCircle2 size={16} />{message}</div>}
      {displayImages.length > 0 && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
        {displayImages.map((image) => <div key={image.id} style={{ border: image.primary ? '2px solid #F5C710' : '1px solid #CBD5E1', borderRadius: 8, padding: 8, background: '#FFF' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.url} alt="Product preview" style={{ width: '100%', height: 110, objectFit: 'contain' }} />
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            {productId && 'saved' in image && <button type="button" disabled={busy || image.primary} onClick={() => makePrimary(image.saved)}><Star size={14} fill={image.primary ? 'currentColor' : 'none'} /> {image.primary ? 'Primary' : 'Make primary'}</button>}
            {!productId && image.primary && <span style={{ fontSize: 11, fontWeight: 700 }}>Primary</span>}
            <button type="button" aria-label="Remove image" disabled={busy} onClick={() => productId && 'saved' in image ? removeSaved(image.saved) : 'index' in image && removeLocal(image.index)}><Trash2 size={14} /></button>
          </div>
        </div>)}
      </div>}
      <button type="button" disabled={disabled || busy || displayImages.length >= MAX_IMAGES} onClick={() => fileInputRef.current?.click()} style={{ minHeight: 42 }}>
        {busy ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />} {displayImages.length ? 'Add images' : 'Choose images'} ({displayImages.length}/{MAX_IMAGES})
      </button>
      <small>JPEG, PNG, or WebP. Maximum 5 MB each. The first image is primary until changed.</small>
    </div>
  );
}
