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
  signature_page?: number;
  signature_x?: number;
  signature_y?: number;
  created_at: string;
  updated_at: string;
}

export interface RequestSignaturePayload {
  document_id: string;
  signer_id: string;
  message?: string;
  expiry_days?: number;
  sign_order?: number;
}

export interface SignDocumentPayload {
  signed_version_id?: string;
  signature_page?: number;
  signature_x?: number;
  signature_y?: number;
}
