import type { Application } from './application';

export interface Student {
  id: string;
  student_id: string; // Registration Number
  user_id: string;
  application_id: string;
  enrollment_status: 'active' | 'suspended' | 'withdrawn' | 'graduated';
  current_year: number;
  current_semester: number;
  enrollment_date: string;
  
  // Preloads
  User?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    contact_number?: string;
  };
  Application?: Application;
}
