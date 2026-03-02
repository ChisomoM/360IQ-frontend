export interface Application {
  id: string;
  user_id: string;
  department_id?: string;
  
  // Personal Details
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  date_of_birth: string;
  gender: string;
  marital_status: string;
  nationality: string;
  nrc: string;
  passport_number?: string;
  residential_address: string;

  // Next of Kin
  next_of_kin_name: string;
  next_of_kin_relationship: string;
  next_of_kin_contact: string;

  // Academic Information
  mode_of_study: string;
  programme_of_study: string;
  year_of_study: number;
  intake: string;
  previous_school: string;

  // Status Management
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'enrolled';
  application_date: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_comments?: string;

  // Payment
  application_fee_paid: boolean;
  payment_reference: string;

  // Preloads
  User?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  Department?: {
    id: string;
    name: string;
    code: string;
  };
}
