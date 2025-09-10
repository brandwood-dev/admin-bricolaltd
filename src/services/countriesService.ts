import { apiClient, ApiResponse } from './api';

export interface Country {
  id: string;
  name: string;
  code: string;
  currency: string;
  phonePrefix: string;
  continent?: string;
  isActive: boolean;
}

class CountriesService {
  async getAllCountries(): Promise<ApiResponse<Country[]>> {
    return apiClient.get<Country[]>('/countries');
  }

  async getActiveCountries(): Promise<ApiResponse<Country[]>> {
    return apiClient.get<Country[]>('/countries/active');
  }

  async getCountriesByContinent(continent: string): Promise<ApiResponse<Country[]>> {
    return apiClient.get<Country[]>(`/countries/continent/${continent}`);
  }

  async getCountryById(id: string): Promise<ApiResponse<Country>> {
    return apiClient.get<Country>(`/countries/${id}`);
  }

  async getCountryByCode(code: string): Promise<ApiResponse<Country>> {
    return apiClient.get<Country>(`/countries/code/${code}`);
  }
}

export const countriesService = new CountriesService();