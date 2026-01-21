
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

/**
 * Interface for Surge Pricing Rules used in PricingPage.tsx
 */
export interface SurgeRule {
  id: string;
  name: string;
  pricingType: 'FLAT' | 'MULTIPLIER';
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

export enum PayoutType {
  PAYOUT_TO_DRIVER = 'PAYOUT_TO_DRIVER', // Admin pays driver
  COLLECT_FROM_DRIVER = 'COLLECT_FROM_DRIVER', // Admin takes cash from driver
  TRIP_EARNING_ONLINE = 'TRIP_EARNING_ONLINE', // Net added to wallet (+ Fare - Comm - Tax)
  TRIP_COMMISSION_CASH = 'TRIP_COMMISSION_CASH', // Net subtracted from wallet (- Comm - Tax)
}

export enum PaymentMethod {
  BANK_TRANSFER = 'BANK_TRANSFER',
  CASH = 'CASH',
  MOBILE_MONEY = 'MOBILE_MONEY',
  STRIPE = 'STRIPE',
  WALLET = 'WALLET',
}

export interface PayoutLog {
  id: string;
  date: string;
  amount: number; // Positive for additions, Negative for deductions (display handled by type)
  type: PayoutType;
  paymentMethod: PaymentMethod;
  note: string;
  adminName: string;
  proofUrl?: string;
  tripId?: string;
}

export interface DriverBilling {
  id: string;
  name: string;
  avatarUrl: string;
  completedTrips: number;
  totalEarned: number; // Lifetime Earnings (Net)
  walletBalance: number; // Current Liquid Balance (payoutAmount - ownedMoney)
  debtStartedAt?: string; 
  logs: PayoutLog[];
  isBlocked?: boolean;
}