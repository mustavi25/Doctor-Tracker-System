export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin";
}

export interface Doctor {
  _id: string;
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
  patientCount?: number;
  createdAt: string;
  updatedAt: string;
}

export type Gender = "male" | "female" | "other";

export interface Patient {
  _id: string;
  name: string;
  age?: number;
  gender?: Gender;
  phone?: string;
  condition: string;
  /** Populated on /patients, a plain id string elsewhere */
  doctor: string | Pick<Doctor, "_id" | "name" | "specialization">;
  createdAt: string;
  updatedAt: string;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

export interface DashboardStats {
  totals: {
    doctors: number;
    patients: number;
    avgPatientsPerDoctor: number;
    newDoctorsThisWeek: number;
    newPatientsThisWeek: number;
  };
  patientsPerDoctor: { doctorId: string; name: string; specialization: string; count: number }[];
  patientsOverTime: { date: string; count: number }[];
  doctorsOverTime: { date: string; count: number }[];
  conditionBreakdown: { condition: string; count: number }[];
  doctorsBySpecialization: { specialization: string; count: number }[];
  rangeDays: number;
}
