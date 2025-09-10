import { DataSource } from 'typeorm';
import { Restaurant } from '../../restaurants/entities/restaurant.entity';

export async function seedRestaurants(dataSource: DataSource) {
  const restaurantRepository = dataSource.getRepository(Restaurant);

  // Check if restaurants already exist
  const existingRestaurants = await restaurantRepository.count();
  if (existingRestaurants > 0) {
    console.log('Restaurants already seeded, skipping...');
    return;
  }

  const sampleRestaurants = [
    {
      name: 'The Italian Corner',
      description: 'Authentic Italian cuisine with handmade pasta and traditional recipes',
      cuisine: 'Italian',
      address: '123 Main St, Downtown',
      phone: '+1-555-0101',
      rating: 4.5,
    },
    {
      name: 'Spice Garden',
      description: 'Aromatic Indian dishes with fresh spices and vegetarian options',
      cuisine: 'Indian',
      address: '456 Oak Ave, Midtown',
      phone: '+1-555-0102',
      rating: 4.8,
    },
    {
      name: 'Sakura Sushi',
      description: 'Fresh sushi and Japanese delicacies prepared by skilled chefs',
      cuisine: 'Japanese',
      address: '789 Pine St, Uptown',
      phone: '+1-555-0103',
      rating: 4.6,
    },
    {
      name: 'Le Petit Bistro',
      description: 'Classic French bistro with wine selection and cozy atmosphere',
      cuisine: 'French',
      address: '321 Elm St, Old Town',
      phone: '+1-555-0104',
      rating: 4.7,
    },
    {
      name: 'Dragon Palace',
      description: 'Traditional Chinese cuisine with dim sum and Peking duck',
      cuisine: 'Chinese',
      address: '654 Maple Dr, Chinatown',
      phone: '+1-555-0105',
      rating: 4.4,
    },
  ];

  try {
    const restaurants = restaurantRepository.create(sampleRestaurants);
    await restaurantRepository.save(restaurants);
    console.log('Sample restaurants seeded successfully');
  } catch (error) {
    console.error('Error seeding restaurants:', error);
  }
}