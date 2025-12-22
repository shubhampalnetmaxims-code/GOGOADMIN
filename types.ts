
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
  ratePerKm: number; // Used as fallback or base tier
  ratePerMin: number;
  minFare: number;
  waitRate: number;
  safeWaitTime: number;
  cancelFee: number;
  commission: number;
  tax: number;
  nightSurcharge: number; 
  nightSurchargeActive: boolean;
  nightSurchargeStart: string;
  nightSurchargeEnd: string;
  safeguardMultiplier: number;
  surcharges: ZoneFee[];
  distanceTiers: DistanceTier[]; // Added for non-linear pricing
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
  multiplier: number;
  locationIds: string[];
  vehicleTypes: VehicleType[];
  zoneIds: string[];
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface User {
  name: string;
  email: string;
  avatarUrl?: string;
}
