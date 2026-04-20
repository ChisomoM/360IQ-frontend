export type SignatureRequestStatus = 'pending' | 'signed' | 'declined' | 'expired';
export interface SignatureRequest {
  id: string;
  document_id: string;
  document?: {
    id: string;
    title: string;
    file_url?: string;
    file_type?: string;
    file_name: string;
  };
  signer_id: string;
  signer?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  requested_by_id: string;
  requested_by?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  status: SignatureRequestStatus;
  message?: string;
  expires_at?: string;
  signed_at?: string;
  declined_at?: string;
  decline_note?: string;
  signature_hash?: string;
  sign_order: number;
  signed_version_id?: string;
  signature_page: number;
  signature_x: number;
  signature_y: number;
  signature_w: number;
  signature_h: number;
  created_at: string;
  updated_at: string;
}

export interface RequestSignaturePayload {
  document_id: string;
  signer_id: string;
  message?: string;
  expiry_days?: number;
  sign_order?: number;
  signature_page?: number;
  signature_x?: number;
  signature_y?: number;
  signature_w?: number;
  signature_h?: number;
}

export interface SignDocumentPayload {
  signed_version_id?: string;
}

export type SignatureType = 'draw' | 'type' | 'image';

export interface UserSignature {
  id: string;
  user_id: string;
  label: string;
  signature_type: SignatureType;
  signature_data: string; // base64 PNG data URL
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface SaveSignaturePayload {
  label: string;
  signature_type: SignatureType;
  signature_data: string;
  is_default: boolean;
}