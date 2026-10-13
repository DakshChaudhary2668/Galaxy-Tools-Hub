import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['', '/products', '/categories', '/brands', '/about', '/contact', '/dealer', '/track', '/privacy', '/terms', '/shipping', '/cancellation', '/refund', '/gst'];
  return routes.map((route) => ({ url: `https://galaxytoolshub.com${route}`, changeFrequency: route === '' ? 'weekly' : 'monthly' }));
}
