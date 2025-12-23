
export interface Make {
  id: string;
  name: string;
  modelsCount: number;
  createdOn: string;
}

export interface Model {
  id: string;
  name: string;
  makeId: string;
  makeName: string;
  vehicleCount: number;
  vehicleType: VehicleType;
  maxPassengers: number;
}

export enum VehicleType {
  ECONOMY = 'ECONOMY',
  SEDAN = 'SEDAN',
  PREMIUM_SEDAN = 'PREMIUM_SEDAN',
  SUV = 'SUV',
  BIKE = 'BIKE',
  OTHERS = 'OTHERS',
}

export enum PricingService {
  BOOK_RIDE = 'Book Ride',
  SHARING = 'Sharing',
  PARCEL = 'Parcel',
  CHAUFFER = 'Chauffer',
}

export interface Location {
  id: string;
  name: string;
  country: string;
  currency: string;
  isActive: boolean;
}

export interface OperationalZone {
  id: string;
  name: string;
  locationId: string;
  lat: number;
  lng: number;
  radius: number;
  isActive: boolean;
}

export interface DistanceTier {
  id: string;
  upToKm: number;
  rate: number;
}

export interface VehiclePricingConfig {
  baseFare: number;
  ratePerKm: number; 
  ratePerMin: number;
  minFare: number;
  waitRate: number;
  safeWaitTime: number;
  pickupWaitTime: number;
  totalWaitTime: number;
  cancelFee: number;
  commission: number;
  tax: number;
  distanceTiers: DistanceTier[]; 
  distancePricingMode: 'STANDARD' | 'TIERED';
}

export interface ZoneFee {
  id: string;
  zoneId: string;
  amount: number;
  isActive: boolean;
  startTime: string; 
  endTime: string;   
}

export interface SurgeRule {
  id: string;
  name: string;
  pricingType: 'MULTIPLIER' | 'FLAT';
  pricingValue: number;
  locationIds: string[];
  vehicleTypes: VehicleType[];
  zoneIds: string[];
  isScheduled: boolean;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface User {
  name: string;
  email: string;
  avatarUrl?: string;
}
