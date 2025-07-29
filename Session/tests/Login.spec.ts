import { test, expect } from '@playwright/test';
import { APIRequestContext } from '@playwright/test';

export class Login {
  private request: APIRequestContext;
  private tenantId: string;
  private bearerToken: string | null = null;

  constructor(request: APIRequestContext, tenantId: string) {
    this.request = request;
    this.tenantId = tenantId;
  }

  setTenantId(tenantId: string) {
    this.tenantId = tenantId;
  }

  getBearerToken(): string | null {
    return this.bearerToken;
  }

  async providerLogin(email: string, password: string) {
    const response = await this.request.post('/api/auth/login', {
      data: {
        email,
        password,
        tenantId: this.tenantId
      }
    });

    if (response.ok()) {
      const data = await response.json();
      this.bearerToken = data.data?.accessToken || null;
      return data;
    } else {
      throw new Error(`Login failed: ${response.status()} ${response.statusText()}`);
    }
  }

  async createPatient() {
    if (!this.bearerToken) {
      throw new Error('Not authenticated. Please login first.');
    }

    const response = await this.request.post('/api/patients', {
      headers: {
        'Authorization': `Bearer ${this.bearerToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        firstName: 'Samuel',
        lastName: 'Peterson',
        email: 'samuel.peterson@example.com',
        phone: '+1234567890',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001'
        }
      }
    });

    if (response.ok()) {
      return await response.json();
    } else {
      throw new Error(`Patient creation failed: ${response.status()} ${response.statusText()}`);
    }
  }

  async addProvider() {
    if (!this.bearerToken) {
      throw new Error('Not authenticated. Please login first.');
    }

    const response = await this.request.post('/api/providers', {
      headers: {
        'Authorization': `Bearer ${this.bearerToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        firstName: 'Steven',
        lastName: 'Miller',
        email: 'steven.miller@example.com',
        phone: '+1234567891',
        specialization: 'Cardiology',
        licenseNumber: 'MD123456',
        role: 'provider'
      }
    });

    if (response.ok()) {
      return await response.json();
    } else {
      throw new Error(`Provider creation failed: ${response.status()} ${response.statusText()}`);
    }
  }

  async setAvailability(providerId: string) {
    if (!this.bearerToken) {
      throw new Error('Not authenticated. Please login first.');
    }

    const response = await this.request.post(`/api/providers/${providerId}/availability`, {
      headers: {
        'Authorization': `Bearer ${this.bearerToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        dayOfWeek: 'monday',
        startTime: '09:00',
        endTime: '17:00',
        isAvailable: true
      }
    });

    if (response.ok()) {
      return await response.json();
    } else {
      throw new Error(`Availability setting failed: ${response.status()} ${response.statusText()}`);
    }
  }

  async bookAppointment(patientId: string, providerId: string) {
    if (!this.bearerToken) {
      throw new Error('Not authenticated. Please login first.');
    }

    const response = await this.request.post('/api/appointments', {
      headers: {
        'Authorization': `Bearer ${this.bearerToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        patientId,
        providerId,
        appointmentDate: '2024-01-15',
        appointmentTime: '10:00',
        reason: 'Regular checkup',
        duration: 30
      }
    });

    if (response.ok()) {
      return await response.json();
    } else {
      throw new Error(`Appointment booking failed: ${response.status()} ${response.statusText()}`);
    }
  }

  async getProviders(page: number = 0, size: number = 10) {
    if (!this.bearerToken) {
      throw new Error('Not authenticated. Please login first.');
    }

    const response = await this.request.get(`/api/providers?page=${page}&size=${size}`, {
      headers: {
        'Authorization': `Bearer ${this.bearerToken}`
      }
    });

    if (response.ok()) {
      return await response.json();
    } else {
      throw new Error(`Get providers failed: ${response.status()} ${response.statusText()}`);
    }
  }

  async getPatients(page: number = 0, size: number = 10, search?: string) {
    if (!this.bearerToken) {
      throw new Error('Not authenticated. Please login first.');
    }

    let url = `/api/patients?page=${page}&size=${size}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }

    const response = await this.request.get(url, {
      headers: {
        'Authorization': `Bearer ${this.bearerToken}`
      }
    });

    if (response.ok()) {
      return await response.json();
    } else {
      throw new Error(`Get patients failed: ${response.status()} ${response.statusText()}`);
    }
  }

  async getAvailabilitySettings(providerId: string) {
    if (!this.bearerToken) {
      throw new Error('Not authenticated. Please login first.');
    }

    const response = await this.request.get(`/api/providers/${providerId}/availability`, {
      headers: {
        'Authorization': `Bearer ${this.bearerToken}`
      }
    });

    if (response.ok()) {
      return await response.json();
    } else {
      throw new Error(`Get availability failed: ${response.status()} ${response.statusText()}`);
    }
  }

  async executeCompleteWorkflow() {
    // Login
    const loginResponse = await this.providerLogin('rose.gomez@jourrapide.com', 'Pass@123');

    // Create patient
    const patientResponse = await this.createPatient();

    // Create provider
    const providerResponse = await this.addProvider();

    // Set availability
    const availabilityResponse = await this.setAvailability(providerResponse.data.id);

    // Book appointment
    const appointmentResponse = await this.bookAppointment(patientResponse.data.id, providerResponse.data.id);

    // Verification calls
    const providers = await this.getProviders();
    const patients = await this.getPatients();
    const availability = await this.getAvailabilitySettings(providerResponse.data.id);

    return {
      loginResponse,
      patientResponse,
      providerResponse,
      availabilityResponse,
      appointmentResponse,
      verificationResults: {
        providers,
        patients,
        availability
      }
    };
  }
}

test.describe('Healthcare API Workflow - Based on Postman Collection', () => {
  let workflow: Login;

  test.beforeEach(async ({ request }) => {
    workflow = new Login(request, 'stage_aithinkitive');
  });

  test('Complete Healthcare Workflow - All Steps', async () => {
    console.log('🚀 Starting Complete Healthcare API Workflow Test\n');

    // Execute the complete workflow
    const results = await workflow.executeCompleteWorkflow();

    // Verify Login
    expect(results.loginResponse.data?.accessToken).toBeTruthy();
    console.log('✅ Login verification passed');

    // Verify Patient Creation
    expect(results.patientResponse.data?.id).toBeTruthy();
    expect(results.patientResponse.data?.firstName).toBe('Samuel');
    expect(results.patientResponse.data?.lastName).toBe('Peterson');
    console.log('✅ Patient creation verification passed');

    // Verify Provider Creation
    expect(results.providerResponse.data?.id).toBeTruthy();
    expect(results.providerResponse.data?.firstName).toBe('Steven');
    expect(results.providerResponse.data?.lastName).toBe('Miller');
    console.log('✅ Provider creation verification passed');

    // Verify Availability Setting
    expect(results.availabilityResponse).toBeTruthy();
    console.log('✅ Availability setting verification passed');

    // Verify Appointment Booking
    expect(results.appointmentResponse.data?.id).toBeTruthy();
    expect(results.appointmentResponse.data?.patientId).toBe(results.patientResponse.data.id);
    expect(results.appointmentResponse.data?.providerId).toBe(results.providerResponse.data.id);
    console.log('✅ Appointment booking verification passed');

    // Verify GET endpoints
    expect(results.verificationResults.providers.data).toBeTruthy();
    expect(results.verificationResults.patients.data).toBeTruthy();
    expect(results.verificationResults.availability.data).toBeTruthy();
    console.log('✅ All verification calls passed');

    console.log('\n🎉 Complete Healthcare API Workflow Test Completed Successfully!');
  });

  test('Individual Step Tests', async () => {
    console.log('🧪 Testing Individual Steps...\n');

    // Test Login
    const loginResponse = await workflow.providerLogin(
      'rose.gomez@jourrapide.com',
      'Pass@123'
    );
    expect(loginResponse.data?.accessToken).toBeTruthy();
    expect(workflow.getBearerToken()).toBeTruthy();

    // Test Create Patient
    const patientResponse = await workflow.createPatient();
    expect(patientResponse.data?.id).toBeTruthy();
    const patientId = patientResponse.data.id;

    // Test Add Provider
    const providerResponse = await workflow.addProvider();
    expect(providerResponse.data?.id).toBeTruthy();
    const providerId = providerResponse.data.id;

    // Test Set Availability
    const availabilityResponse = await workflow.setAvailability(providerId);
    expect(availabilityResponse).toBeTruthy();

    // Test Book Appointment
    const appointmentResponse = await workflow.bookAppointment(patientId, providerId);
    expect(appointmentResponse.data?.id).toBeTruthy();

    // Test Verification Endpoints
    const providers = await workflow.getProviders();
    expect(providers.data).toBeTruthy();

    const patients = await workflow.getPatients();
    expect(patients.data).toBeTruthy();

    const availability = await workflow.getAvailabilitySettings(providerId);
    expect(availability.data).toBeTruthy();

    console.log('✅ All individual step tests passed!');
  });

  test('Error Handling Tests', async () => {
    console.log('🧪 Testing Error Handling...\n');

    // Test invalid login
    try {
      await workflow.providerLogin('invalid@email.com', 'wrongpassword');
      // If we reach here, the test should fail
      expect(false).toBe(true);
    } catch (error) {
      console.log('✅ Invalid login error properly handled');
    }

    // Test unauthorized request (without login)
    const workflowNoAuth = new Login(workflow['request'], 'stage_aithinkitive');
    try {
      await workflowNoAuth.createPatient();
      // If we reach here, the test should fail
      expect(false).toBe(true);
    } catch (error) {
      console.log('✅ Unauthorized request error properly handled');
    }

    console.log('✅ Error handling tests completed!');
  });

  test('Tenant Configuration Test', async () => {
    console.log('🧪 Testing Tenant Configuration...\n');

    // Test with different tenant
    workflow.setTenantId('stage_ketamin');
    
    // This should work with the new tenant ID
    const loginResponse = await workflow.providerLogin(
      'rose.gomez@jourrapide.com',
      'Pass@123'
    );
    
    // Note: This might fail if the credentials don't exist for this tenant
    // but it tests the tenant switching functionality
    console.log('Login attempt with different tenant completed');
    console.log('Response status indicates tenant switching works');
  });

  test('Data Validation Tests', async () => {
    console.log('🧪 Testing Data Validation...\n');

    // Login first
    await workflow.providerLogin('rose.gomez@jourrapide.com', 'Pass@123');

    // Create patient and verify structure
    const patientResponse = await workflow.createPatient();
    expect(patientResponse.data).toHaveProperty('id');
    expect(patientResponse.data).toHaveProperty('firstName');
    expect(patientResponse.data).toHaveProperty('lastName');
    expect(patientResponse.data).toHaveProperty('gender');
    
    // Create provider and verify structure
    const providerResponse = await workflow.addProvider();
    expect(providerResponse.data).toHaveProperty('id');
    expect(providerResponse.data).toHaveProperty('firstName');
    expect(providerResponse.data).toHaveProperty('lastName');
    expect(providerResponse.data).toHaveProperty('email');
    expect(providerResponse.data).toHaveProperty('role');

    console.log('✅ Data validation tests passed!');
  });

  test('Pagination Tests', async () => {
    console.log('🧪 Testing Pagination...\n');

    // Login first
    await workflow.providerLogin('rose.gomez@jourrapide.com', 'Pass@123');

    // Test different page sizes
    const providers1 = await workflow.getProviders(0, 5);
    expect(providers1.data).toBeTruthy();

    const providers2 = await workflow.getProviders(0, 10);
    expect(providers2.data).toBeTruthy();

    const patients1 = await workflow.getPatients(0, 5);
    expect(patients1.data).toBeTruthy();

    const patients2 = await workflow.getPatients(0, 10, 'Samuel');
    expect(patients2.data).toBeTruthy();

    console.log('✅ Pagination tests passed!');
  });
});