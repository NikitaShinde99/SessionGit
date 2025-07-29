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