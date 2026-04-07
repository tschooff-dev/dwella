export type Role = 'LANDLORD' | 'TENANT'
export type UnitStatus = 'VACANT' | 'OCCUPIED' | 'MAINTENANCE'
export type LeaseStatus = 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'PENDING'
export type PaymentStatus = 'PAID' | 'DUE' | 'LATE' | 'PARTIAL'
export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN'
export type MaintenancePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type MaintenanceStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: Role
  phone?: string
  avatarUrl?: string
  createdAt: string
  updatedAt: string
}

export interface Property {
  id: string
  name: string
  address: string
  city: string
  state: string
  zip: string
  imageUrl?: string
  description?: string
  landlordId: string
  units?: Unit[]
  _count?: { units: number }
  createdAt: string
  updatedAt: string
}

export interface Unit {
  id: string
  unitNumber: string
  floor?: number
  bedrooms: number
  bathrooms: number
  squareFeet?: number
  rentAmount: number
  depositAmount?: number
  status: UnitStatus
  propertyId: string
  property?: Property
  leases?: Lease[]
  createdAt: string
  updatedAt: string
}

export interface Lease {
  id: string
  unitId: string
  unit?: Unit
  tenantId: string
  tenant?: User
  startDate: string
  endDate: string
  rentAmount: number
  depositPaid?: number
  status: LeaseStatus
  documentUrl?: string
  payments?: Payment[]
  createdAt: string
  updatedAt: string
}

export interface Payment {
  id: string
  leaseId: string
  lease?: Lease
  tenantId: string
  tenant?: User
  amount: number
  dueDate: string
  paidDate?: string
  status: PaymentStatus
  stripePaymentId?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Application {
  id: string
  unitId: string
  unit?: Unit
  applicantName: string
  applicantEmail: string
  applicantPhone?: string
  monthlyIncome?: number
  creditScore?: number
  aiScore?: number
  aiSummary?: string
  status: ApplicationStatus
  notes?: string
  submittedAt: string
  reviewedAt?: string
  createdAt: string
  updatedAt: string
}

export interface MaintenanceRequest {
  id: string
  unitId: string
  unit?: Unit
  tenantId: string
  tenant?: User
  title: string
  description: string
  priority: MaintenancePriority
  status: MaintenanceStatus
  imageUrls: string[]
  resolvedAt?: string
  createdAt: string
  updatedAt: string
}

export interface DashboardSummary {
  totalUnits: number
  occupiedUnits: number
  occupancyRate: number
  rentCollected: number
  outstandingBalance: number
}
