import type { CategoryDto } from '@galaxy/types';

const images: Record<string, string> = {
  testingmeasurement: '/images/cat-multimeter.jpg',
  environment: '/images/cat-thermal.jpg',
  accessories: '/images/placeholder.jpg',
  laboratortlabtesting: '/images/cat-oscilloscope.jpg',
  powertools: '/images/categories/power-tools.webp',
  handtools: '/images/categories/hand-tools.webp',
  measuringinstruments: '/images/cat-calibrators.jpg',
  testingequipment: '/images/cat-oscilloscope.jpg',
  safetyequipment: '/images/categories/safety-equipment.jpg',
  safetytools: '/images/categories/safety-equipment.jpg',
  electricaltools: '/images/cat-insulation.jpg',
};

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

export const getCategoryImage = (category: CategoryDto) =>
  category.image_url ||
  images[normalize(category.slug)] ||
  images[normalize(category.name)] ||
  '/images/placeholder.jpg';
