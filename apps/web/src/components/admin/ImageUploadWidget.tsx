'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  getProductImageUploadUrl,
  completeProductImage,
  deleteProductPrimaryImage
} from '@/services/product.service';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface ImageUploadWidgetProps {
  productId?: string;
  initialImageUrl?: string | null;
  onFileChange?: (file: File | null) => void;
  onImageChange?: (imageUrl: string | null) => void;
  disabled?: boolean;
}

export function ImageUploadWidget({
  productId,
  initialImageUrl,
  onFileChange,
  onImageChange,
  disabled = false
}: ImageUploadWidgetProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImageUrl || null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialImageUrl) {
      setPreviewUrl(initialImageUrl);
    } else if (!productId) {
      // Keep existing preview if in create mode with a selected local file
    } else {
      setPreviewUrl(null);
    }
  }, [initialImageUrl, productId]);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return 'Invalid format. Allowed image types: JPEG (.jpg, .jpeg), PNG (.png), and WebP (.webp).';
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      return `File size is ${sizeMb} MB. Maximum allowed image size is 5.0 MB.`;
    }
    return null;
  };

  const getExtensionFromMime = (mime: string): 'jpg' | 'jpeg' | 'png' | 'webp' => {
    switch (mime) {
      case 'image/jpeg':
        return 'jpg';
      case 'image/png':
        return 'png';
      case 'image/webp':
        return 'webp';
      default:
        return 'jpg';
    }
  };

  const handleFileSelect = async (file: File) => {
    setError(null);
    setSuccessMsg(null);

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Mode 1: Edit Mode with real Product ID (Immediate server-side upload & safe replacement)
    if (productId) {
      setUploading(true);
      setUploadProgressText('Authorizing secure image upload...');
      try {
        const ext = getExtensionFromMime(file.type);
        const signResult = await getProductImageUploadUrl({
          product_id: productId,
          mime_type: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
          file_size: file.size,
          extension: ext
        });

        setUploadProgressText('Uploading image bytes to storage...');
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .uploadToSignedUrl(signResult.path, signResult.token, file, {
            contentType: file.type
          });

        if (uploadError) {
          // Fallback direct PUT to signed URL if SDK fails
          const putRes = await fetch(signResult.signedUrl, {
            method: 'PUT',
            headers: { 'Content-Type': file.type },
            body: file
          });
          if (!putRes.ok) {
            throw new Error(`Upload failed: ${uploadError.message || putRes.statusText}`);
          }
        }

        setUploadProgressText('Completing product image registration...');
        const completedRecord = await completeProductImage(productId, {
          storage_path: signResult.path
        });

        const newPublicUrl = completedRecord.public_url || signResult.publicUrl;
        setPreviewUrl(newPublicUrl);
        onImageChange?.(newPublicUrl);
        setSuccessMsg('Product image updated successfully.');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Image upload failed. Please try again.';
        setError(msg);
      } finally {
        setUploading(false);
        setUploadProgressText('');
      }
      return;
    }

    // Mode 2: Create Mode (Product not created yet, keep local file & preview for create-then-upload flow)
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    onFileChange?.(file);
    onImageChange?.(localUrl);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !uploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || uploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileSelect(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFileSelect(file);
    }
    // reset input value so re-selecting the same file triggers onChange
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = async () => {
    setError(null);
    setSuccessMsg(null);

    // If on edit page with an existing product, delete from DB & Storage
    if (productId && previewUrl) {
      setUploading(true);
      setUploadProgressText('Removing image...');
      try {
        await deleteProductPrimaryImage(productId);
        setPreviewUrl(null);
        onImageChange?.(null);
        setSuccessMsg('Product image removed.');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to remove image.';
        setError(msg);
      } finally {
        setUploading(false);
        setUploadProgressText('');
      }
      return;
    }

    // If on create page, clear local file
    setPreviewUrl(null);
    onFileChange?.(null);
    onImageChange?.(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={handleInputChange}
        disabled={disabled || uploading}
      />

      {/* Error alert */}
      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FCA5A5',
            color: '#991B1B',
            padding: '10px 14px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Success alert */}
      {successMsg && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#DCFCE7',
            border: '1px solid #BBF7D0',
            color: '#16A34A',
            padding: '10px 14px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600
          }}
        >
          <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Container: Preview State or Dropzone State */}
      {previewUrl ? (
        <div
          style={{
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            backgroundColor: '#F8FAFC',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px',
            position: 'relative'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '260px',
              height: '180px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Primary product preview"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || uploading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                height: '34px',
                padding: '0 14px',
                fontSize: '12px',
                fontWeight: 700,
                color: '#0F172A',
                backgroundColor: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                cursor: disabled || uploading ? 'not-allowed' : 'pointer'
              }}
            >
              {uploading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
              <span>{uploading ? 'Processing...' : 'Replace Image'}</span>
            </button>

            <button
              type="button"
              onClick={handleRemoveImage}
              disabled={disabled || uploading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                height: '34px',
                padding: '0 14px',
                fontSize: '12px',
                fontWeight: 700,
                color: '#DC2626',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FCA5A5',
                borderRadius: '6px',
                cursor: disabled || uploading ? 'not-allowed' : 'pointer'
              }}
            >
              <Trash2 size={14} />
              <span>Remove</span>
            </button>
          </div>

          {uploading && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: '#475569',
                fontWeight: 600
              }}
            >
              <Loader2 size={14} className="animate-spin" />
              <span>{uploadProgressText || 'Uploading image...'}</span>
            </div>
          )}
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            if (!disabled && !uploading) {
              fileInputRef.current?.click();
            }
          }}
          style={{
            border: isDragging ? '2px dashed #2563EB' : '2px dashed #CBD5E1',
            borderRadius: '8px',
            backgroundColor: isDragging ? '#EFF6FF' : '#F8FAFC',
            padding: '28px 16px',
            textAlign: 'center',
            cursor: disabled || uploading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {uploading ? (
            <>
              <Loader2 size={36} color="#2563EB" className="animate-spin" />
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                {uploadProgressText || 'Uploading product image...'}
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: '#E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#475569'
                }}
              >
                <UploadCloud size={22} />
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                Click to browse or drag & drop image here
              </div>
              <div style={{ fontSize: '12px', color: '#64748B' }}>
                Supports JPEG, PNG, and WebP (Max 5.0 MB)
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
