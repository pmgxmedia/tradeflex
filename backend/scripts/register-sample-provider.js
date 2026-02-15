/**
 * Delivery Provider Registration Script
 * 
 * This script helps register a sample delivery provider for testing.
 * Run this after setting up the backend server.
 */

import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const sampleProvider = {
  name: 'John Delivery',
  email: 'john.delivery@example.com',
  phone: '+1-555-0123',
  vehicleType: 'motorcycle',
  vehicleNumber: 'ABC-1234',
  licenseNumber: 'DL123456789',
  address: {
    street: '123 Main Street',
    city: 'New York',
    state: 'NY',
    zipCode: '10001'
  },
  bankDetails: {
    accountName: 'John Delivery',
    accountNumber: '1234567890',
    bankName: 'Sample Bank',
    ifscCode: 'SAMP0001234'
  },
  documents: {
    drivingLicense: 'path/to/license.pdf',
    vehicleRegistration: 'path/to/registration.pdf',
    insurance: 'path/to/insurance.pdf',
    profilePhoto: 'path/to/photo.jpg'
  }
};

async function registerProvider() {
  try {
    console.log('Registering sample delivery provider...');
    
    const response = await axios.post(
      `${API_URL}/delivery/providers/register`,
      sampleProvider
    );

    console.log('✓ Provider registered successfully!');
    console.log('Provider ID:', response.data.provider._id);
    console.log('Status:', response.data.provider.status);
    console.log('\nNext steps:');
    console.log('1. Login to admin panel');
    console.log('2. Navigate to Delivery → Providers tab');
    console.log('3. Approve the provider');
    console.log('4. Use the Provider ID to login at /delivery-provider');
    console.log('\nProvider ID for login:', response.data.provider._id);
    
    return response.data.provider;
  } catch (error) {
    console.error('✗ Error registering provider:', error.response?.data?.message || error.message);
    throw error;
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  registerProvider()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { registerProvider, sampleProvider };
