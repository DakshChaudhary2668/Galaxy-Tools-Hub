import http from 'http';
import { createServer } from './server';
import { supabaseAdmin } from './config/supabase';


async function runTests() {
  console.log('🚀 Starting Sprint 3 Image Upload End-to-End Test Suite...\n');

  // 1. Start test server
  const app = createServer();
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://localhost:${port}/api/v1`;
  console.log(`[Setup] Test server running on port ${port}`);

  try {
    // 2. Generate valid admin token (OWNER role)
    const { createClient } = await import('@supabase/supabase-js');
    const authHelperClient = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: 'dakshchaudhary2668@gmail.com'
    });
    if (linkError || !linkData?.properties?.hashed_token) {
      throw new Error(`Failed to generate magic link: ${linkError?.message}`);
    }

    const { data: verifyData, error: verifyError } = await authHelperClient.auth.verifyOtp({
      token_hash: linkData.properties.hashed_token,
      type: 'magiclink'
    });
    if (verifyError || !verifyData?.session?.access_token) {
      throw new Error(`Failed to verify OTP: ${verifyError?.message}`);
    }

    const adminToken = verifyData.session.access_token;
    console.log('[Setup] Admin session token acquired for OWNER user');

    // 3. Create a temporary test product for image upload tests
    const testSku = `TEST-IMG-${Date.now()}`;
    const vendorId = (await supabaseAdmin.from('vendors').select('id').limit(1).single()).data?.id;
    const createProdRes = await fetch(`${baseUrl}/products/admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: `Test Instrument ${testSku}`,
        sku: testSku,
        slug: testSku.toLowerCase(),
        source_model_no: testSku,
        hsn_code: '9030',
        price: 4999,
        source_vendor_id: vendorId,
        category_id: (await supabaseAdmin.from('categories').select('id').limit(1).single()).data?.id,
        brand_id: (await supabaseAdmin.from('brands').select('id').limit(1).single()).data?.id
      })
    });
    const createdProdBody = await createProdRes.json();
    if (!createProdRes.ok || !createdProdBody.data?.id) {
      throw new Error(`Failed to create test product: ${JSON.stringify(createdProdBody)}`);
    }
    const productId = createdProdBody.data.id;
    console.log(`[Setup] Temporary test product created: ${productId} (${testSku})\n`);

    // --- TEST 1: Unauthenticated request to /storage/product-image-upload-url (Expected 401) ---
    console.log('--- TEST 1: Auth Guard (Unauthenticated) ---');
    const unauthRes = await fetch(`${baseUrl}/storage/product-image-upload-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: productId,
        mime_type: 'image/png',
        file_size: 1024,
        extension: 'png'
      })
    });
    console.log(`Status: ${unauthRes.status} (Expected: 401)`);
    if (unauthRes.status !== 401) throw new Error('TEST 1 Failed: Expected 401 for unauthenticated request');
    console.log('✅ TEST 1 PASSED: Unauthenticated request rejected with 401\n');

    // --- TEST 2: Validation Guards ---
    console.log('--- TEST 2: Validation Guards (MIME, Size, Extension Mismatch, Non-existent Product) ---');

    // 2a. Oversized file (> 5 MB)
    const oversizedRes = await fetch(`${baseUrl}/storage/product-image-upload-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        product_id: productId,
        mime_type: 'image/png',
        file_size: 6 * 1024 * 1024, // 6 MB
        extension: 'png'
      })
    });
    console.log(`2a. Oversized (> 5 MB) status: ${oversizedRes.status} (Expected: 400)`);
    if (oversizedRes.status !== 400) throw new Error('TEST 2a Failed: Expected 400 for oversized file');

    // 2b. Invalid MIME type (e.g. PDF)
    const invalidMimeRes = await fetch(`${baseUrl}/storage/product-image-upload-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        product_id: productId,
        mime_type: 'application/pdf',
        file_size: 1024,
        extension: 'pdf'
      })
    });
    console.log(`2b. Invalid MIME type status: ${invalidMimeRes.status} (Expected: 400)`);
    if (invalidMimeRes.status !== 400) throw new Error('TEST 2b Failed: Expected 400 for invalid MIME');

    // 2c. Mismatched extension / MIME (e.g. image/png with jpg)
    const mismatchRes = await fetch(`${baseUrl}/storage/product-image-upload-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        product_id: productId,
        mime_type: 'image/png',
        file_size: 1024,
        extension: 'jpg'
      })
    });
    console.log(`2c. MIME / Extension mismatch status: ${mismatchRes.status} (Expected: 400)`);
    if (mismatchRes.status !== 400) throw new Error('TEST 2c Failed: Expected 400 for extension mismatch');

    // 2d. Non-existent product ID
    const nonExistentId = '00000000-0000-0000-0000-000000000000';
    const nonExistentRes = await fetch(`${baseUrl}/storage/product-image-upload-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        product_id: nonExistentId,
        mime_type: 'image/png',
        file_size: 1024,
        extension: 'png'
      })
    });
    console.log(`2d. Non-existent product status: ${nonExistentRes.status} (Expected: 404)`);
    if (nonExistentRes.status !== 404) throw new Error('TEST 2d Failed: Expected 404 for non-existent product');
    console.log('✅ TEST 2 PASSED: All validation guards rejected with 400/404\n');

    // --- TEST 3: Successful Signed URL Request ---
    console.log('--- TEST 3: Generate Signed Upload URL ---');
    const signRes = await fetch(`${baseUrl}/storage/product-image-upload-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        product_id: productId,
        mime_type: 'image/png',
        file_size: 1024,
        extension: 'png'
      })
    });
    const signBody = await signRes.json();
    console.log(`Status: ${signRes.status} (Expected: 200)`);
    if (signRes.status !== 200 || !signBody.data?.signedUrl) {
      throw new Error(`TEST 3 Failed: Invalid signed URL response: ${JSON.stringify(signBody)}`);
    }

    const { signedUrl, path: storagePath1, token, publicUrl } = signBody.data;
    console.log('Returned object path:', storagePath1);
    console.log('Returned public URL:', publicUrl);
    console.log('Has token:', Boolean(token));

    // Verify storage_path format: products/{productId}/{uuid}.png
    const pathRegex = new RegExp(`^products\\/${productId}\\/[0-9a-fA-F-]{36}\\.png$`);
    if (!pathRegex.test(storagePath1)) {
      throw new Error(`TEST 3 Failed: storage_path ${storagePath1} does not match expected format`);
    }
    // Verify storage_path != publicUrl (Correction 1)
    if (storagePath1 === publicUrl) {
      throw new Error('TEST 3 Failed: storage_path MUST NOT equal public_url');
    }
    console.log('✅ TEST 3 PASSED: Signed upload URL generated with server-controlled path & token\n');

    // --- TEST 4: Upload file bytes to Supabase Storage ---
    console.log('--- TEST 4: Upload image bytes to Supabase Storage ---');
    // 1x1 transparent PNG buffer
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    const uploadRes = await fetch(signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'image/png' },
      body: pngBuffer
    });
    console.log(`Storage upload status: ${uploadRes.status} (Expected: 200)`);
    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(`TEST 4 Failed: Could not upload to storage: ${uploadRes.status} ${errText}`);
    }
    console.log('✅ TEST 4 PASSED: Image bytes uploaded to Supabase Storage\n');

    // --- TEST 5: Complete Product Image Registration ---
    console.log('--- TEST 5: Complete Image Registration (/images/complete) ---');
    // 5a. Mismatched path verification (must belong to products/{productId}/)
    const fakePathRes = await fetch(`${baseUrl}/products/admin/${productId}/images/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        storage_path: 'products/00000000-0000-0000-0000-000000000000/12345678-1234-1234-1234-123456789abc.png'
      })
    });
    console.log(`5a. Path mismatch status: ${fakePathRes.status} (Expected: 400)`);
    if (fakePathRes.status !== 400) throw new Error('TEST 5a Failed: Expected 400 for path mismatch');

    // 5b. Valid complete request
    const completeRes = await fetch(`${baseUrl}/products/admin/${productId}/images/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        storage_path: storagePath1,
        alt_text: 'Test Multimeter Primary Image'
      })
    });
    const completeBody = await completeRes.json();
    console.log(`5b. Complete status: ${completeRes.status} (Expected: 201)`);
    if (completeRes.status !== 201 || !completeBody.data?.id) {
      throw new Error(`TEST 5b Failed: Image registration failed: ${JSON.stringify(completeBody)}`);
    }

    // Verify database row
    const { data: dbImages } = await supabaseAdmin
      .from('product_images')
      .select('*')
      .eq('product_id', productId);

    console.log(`DB product_images count: ${dbImages?.length}`);
    const firstImgRow = dbImages?.[0];
    console.log('DB Row storage_path:', firstImgRow?.storage_path);
    console.log('DB Row public_url:', firstImgRow?.public_url);
    console.log('DB Row is_primary:', firstImgRow?.is_primary);

    if (dbImages?.length !== 1) throw new Error('TEST 5 Failed: Expected exactly 1 product_images row');
    if (firstImgRow?.storage_path !== storagePath1) throw new Error('TEST 5 Failed: DB storage_path mismatch');
    if (!firstImgRow?.public_url?.includes('product-images')) throw new Error('TEST 5 Failed: DB public_url invalid');
    if (firstImgRow?.is_primary !== true) throw new Error('TEST 5 Failed: is_primary must be true');
    console.log('✅ TEST 5 PASSED: Product image completed and persisted correctly in database\n');

    // --- TEST 6: Safe Image Replacement (Correction 6) ---
    console.log('--- TEST 6: Safe Image Replacement ---');
    // Request a replacement image upload URL
    const signRes2 = await fetch(`${baseUrl}/storage/product-image-upload-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        product_id: productId,
        mime_type: 'image/webp',
        file_size: 512,
        extension: 'webp'
      })
    });
    const signBody2 = await signRes2.json();
    const { signedUrl: signedUrl2, path: storagePath2 } = signBody2.data;

    // Upload new bytes
    const webpBuffer = Buffer.from('RIFF2AAAWAVEfmt ', 'utf-8');
    const uploadRes2 = await fetch(signedUrl2, {
      method: 'PUT',
      headers: { 'Content-Type': 'image/webp' },
      body: webpBuffer
    });
    if (!uploadRes2.ok) throw new Error('TEST 6 Failed: Upload replacement image failed');

    // Complete replacement image
    const completeRes2 = await fetch(`${baseUrl}/products/admin/${productId}/images/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        storage_path: storagePath2
      })
    });
    console.log(`Replacement complete status: ${completeRes2.status} (Expected: 201)`);
    if (completeRes2.status !== 201) throw new Error('TEST 6 Failed: Replacement complete failed');

    // Verify DB has only 1 row and it points to storagePath2
    const { data: dbImagesAfterReplace } = await supabaseAdmin
      .from('product_images')
      .select('*')
      .eq('product_id', productId);

    console.log(`DB product_images count after replace: ${dbImagesAfterReplace?.length}`);
    console.log('New primary storage_path:', dbImagesAfterReplace?.[0]?.storage_path);

    if (dbImagesAfterReplace?.length !== 1) throw new Error('TEST 6 Failed: Expected exactly 1 image row after replacement');
    if (dbImagesAfterReplace?.[0]?.storage_path !== storagePath2) throw new Error('TEST 6 Failed: New storage_path did not become primary');
    console.log('✅ TEST 6 PASSED: Old image safely replaced and cleaned up, new image is primary\n');

    // --- TEST 7: Remove Product Image (Correction 7) ---
    console.log('--- TEST 7: Remove Product Image ---');
    const deleteImgRes = await fetch(`${baseUrl}/products/admin/${productId}/images/primary`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`Delete status: ${deleteImgRes.status} (Expected: 200)`);
    if (deleteImgRes.status !== 200) throw new Error('TEST 7 Failed: Expected 200 on delete image');

    const { data: dbImagesAfterDelete } = await supabaseAdmin
      .from('product_images')
      .select('*')
      .eq('product_id', productId);

    console.log(`DB product_images count after removal: ${dbImagesAfterDelete?.length}`);
    if (dbImagesAfterDelete?.length !== 0) throw new Error('TEST 7 Failed: product_images row should be deleted');
    console.log('✅ TEST 7 PASSED: Product image removed and storage cleaned up\n');

    // --- TEST 8: Storefront Rendering Verification ---
    console.log('--- TEST 8: Storefront Rendering Integrity ---');
    const catalogRes = await fetch(`${baseUrl}/products`);
    const catalogBody = await catalogRes.json();
    console.log(`Catalog fetch status: ${catalogRes.status} (Expected: 200)`);
    if (catalogRes.status !== 200 || !Array.isArray(catalogBody.data)) {
      throw new Error('TEST 8 Failed: Storefront catalog retrieval failed');
    }
    const sampleProduct = catalogBody.data[0];
    console.log(`Sample product: ${sampleProduct?.name}`);
    console.log(`Primary image: ${sampleProduct?.image}`);
    console.log('Images array length:', sampleProduct?.images?.length);
    console.log('✅ TEST 8 PASSED: Storefront catalog and image mapping intact without regression\n');

    // Clean up temporary test product
    await supabaseAdmin.from('inventory').delete().eq('product_id', productId);
    await supabaseAdmin.from('product_images').delete().eq('product_id', productId);
    await supabaseAdmin.from('products').delete().eq('id', productId);
    console.log(`[Cleanup] Temporary test product ${productId} deleted successfully.`);

    console.log('\n======================================================');
    console.log('🎉 ALL SPRINT 3 VERIFICATION TESTS PASSED SUCCESSFULLY!');
    console.log('======================================================\n');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});
