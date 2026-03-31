import { fetchData } from './crud';
import type { SignatureRequest, RequestSignaturePayload, SignDocumentPayload } from '@/types/signatures';

export async function requestSignature(payload: RequestSignaturePayload): Promise<SignatureRequest> {
  return await fetchData('SIGNATURE_REQUEST', 'POST', {}, payload);
}

export async function signDocument(id: string, payload: SignDocumentPayload): Promise<SignatureRequest> {
  return await fetchData('SIGNATURE_SIGN', 'POST', { id }, payload);
}

export async function declineSignature(id: string, note?: string): Promise<SignatureRequest> {
  return await fetchData('SIGNATURE_DECLINE', 'POST', { id }, { note: note ?? '' });
}

export async function getMySignatureRequests(): Promise<SignatureRequest[]> {
  const res = await fetchData('SIGNATURE_MY', 'GET');
  return Array.isArray(res) ? res : [];
}

export async function getDocumentSignatureRequests(docId: string): Promise<SignatureRequest[]> {
  const res = await fetchData('SIGNATURE_DOCUMENT', 'GET', { docId });
  return Array.isArray(res) ? res : [];
}
