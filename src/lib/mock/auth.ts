import { MOCK_USER } from './data';

export function isMockMode(): boolean {
  return process.env.NEXT_PUBLIC_MOCK_MODE === 'true';
}

export function getMockUser() {
  return MOCK_USER;
}
