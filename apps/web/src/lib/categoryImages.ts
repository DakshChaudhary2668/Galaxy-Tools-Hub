import type { CategoryDto } from '@galaxy/types';

const images: Record<string, string> = {
  accessories: '/images/categories/accessories.jpg',
  handtools: '/images/categories/hand-tools.jpg',
  powertools: '/images/categories/power-tools.jpg',
  safetytools: '/images/categories/safety-tools.jpg',
  safetyequipment: '/images/categories/safety-tools.jpg',
  testingmeasurement: '/images/categories/testing-measurement.jpg',
  testingandmeasurement: '/images/categories/testing-measurement.jpg',
  environment: '/images/categories/environment.jpg',
  laboratortlabtesting: '/images/cat-oscilloscope.jpg',
  measuringinstruments: '/images/cat-calibrators.jpg',
  testingequipment: '/images/categories/testing-measurement.jpg',
  electricaltools: '/images/cat-insulation.jpg',
};

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

export const getCategoryImage = (category: CategoryDto) =>
  category.image_url ||
  images[normalize(category.slug)] ||
  images[normalize(category.name)] ||
  '/images/placeholder.jpg';
