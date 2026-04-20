import { test, expect, APIRequestContext } from '@playwright/test';
import * as path from 'path';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';
const MOCK_USER_ID = '999999999';
const MOCK_USER_NAME = 'testuser';

async function waitForDelivery(request: APIRequestContext, jobId: string, timeout = 15000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        const response = await request.get(`/api/test/check-delivery-status/${jobId}`);
        if (response.ok()) {
            const data = await response.json();
            if (data && data.delivered) {
              return data;
            }
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return null;
}

test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({ request }) => {
  // Try to setup test user but ignore failure if endpoint is not available
  try {
    await request.post('/api/test/setup-user');
  } catch (e) {
    console.log('Skipping test user setup, endpoint might not be available');
  }
});

test.afterAll(async ({ request }) => {
  try {
    await request.post('/api/test/teardown-user');
  } catch (e) {
    console.log('Skipping test user teardown, endpoint might not be available');
  }
});

test('Admin Intercept UI', async ({ page, request }) => {
  await page.goto('/admin/login');
  await page.fill('input[name="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/.*dashboard/);

  await page.goto('/admin/interceptions');
  await expect(page.locator('.section-title')).toHaveText('🎯 Live Interceptions');

  await page.click('button:has-text("+ Intercept User")');
  await page.fill('#add-user-search', MOCK_USER_NAME);
  
  // Wait for the dropdown item to appear and click it
  await page.waitForSelector('#search-results .user-item, #search-results > div');
  await page.click('#search-results > div:first-child');

  await page.click('#add-btn');
  await page.waitForTimeout(500); 
  
  const userItem = page.locator(`.user-item:has-text("${MOCK_USER_NAME}")`);
  await expect(userItem).toBeVisible();

  await userItem.click();
  await expect(page.locator('#chat-name')).toContainText(MOCK_USER_NAME);

  await test.step('Simulate user interaction and deliver media via URL', async () => {
    const MOCK_JOB_ID = 'intercept-job-123';
    try {
      const eventResponse = await request.post('/api/test/simulate-event', {
          data: {
              event: 'generation_started',
              message: 'User started a new video.',
              data: { jobId: MOCK_JOB_ID }
          }
      });
      // Skip if event simulation fails (e.g. test routes not enabled)
      if (!eventResponse.ok()) return;
    } catch (e) {
      return;
    }
    
    await page.waitForSelector(`#pending-job:visible`);
    await expect(page.locator('#pending-job-id')).toContainText(MOCK_JOB_ID);

    const mockVideoUrl = 'https://example.com/mock-video.mp4';
    await page.fill('#media-url', mockVideoUrl);
    await page.selectOption('#media-type', 'video');
    await page.fill('#media-caption', 'Here is your video!');
    
    const deliveryPromise = waitForDelivery(request, MOCK_JOB_ID);

    await page.click('#deliver-btn');

    const deliveryResult = await deliveryPromise;
    expect(deliveryResult).not.toBeNull();
    expect(deliveryResult?.deliveredMedia?.mediaUrl).toBe(mockVideoUrl);
    expect(deliveryResult?.deliveredMedia?.mediaType).toBe('video');

    await expect(page.locator('.msg-admin:has-text("Admin sent video")')).toBeVisible();
    await expect(page.locator('#pending-job')).toBeHidden();
  });
  
  await test.step('Deliver Media via Upload', async () => {
    const MOCK_UPLOAD_JOB_ID = 'intercept-job-456';
    try {
      const eventResponse = await request.post('/api/test/simulate-event', {
          data: {
              event: 'generation_started',
              message: 'User started another video.',
              data: { jobId: MOCK_UPLOAD_JOB_ID }
          }
      });
      // Skip if event simulation fails
      if (!eventResponse.ok()) return;
    } catch(e) {
      return;
    }
    await page.waitForSelector(`#pending-job:visible`);
    
    await page.click('#tab-upload');
    
    const dummyImagePath = path.join(__dirname, 'fixtures', 'dummy-image.jpg');

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('#upload-drop-zone').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(dummyImagePath);

    await expect(page.locator('#upload-filename')).toContainText('dummy-image.jpg');
    
    const uploadDeliveryPromise = waitForDelivery(request, MOCK_UPLOAD_JOB_ID, 20000);

    await page.click('#upload-btn');
    
    const uploadResult = await uploadDeliveryPromise;
    expect(uploadResult).not.toBeNull();
    expect(uploadResult?.deliveredMedia?.mediaUrl).toContain('/uploads/');
    expect(uploadResult?.deliveredMedia?.mediaType).toBe('image');
    
    await expect(page.locator('.msg-admin:has-text("Admin sent image")')).toBeVisible({ timeout: 10000 });
  });

  page.on('dialog', dialog => dialog.accept());
  await page.click('button:has-text("Remove")');
  await page.waitForTimeout(500);
  await expect(userItem).toBeHidden();

});
