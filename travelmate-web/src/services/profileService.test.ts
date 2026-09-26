import { profileService } from './profileService';
import { apiClient } from './apiClient';
import { authService } from './authService';

jest.mock('./apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    put: jest.fn(),
    uploadFile: jest.fn(),
  },
}));

jest.mock('./authService', () => ({
  authService: {
    getUser: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockAuthService = authService as jest.Mocked<typeof authService>;
const originalNodeEnv = process.env.NODE_ENV;

const createImageFile = () => new File(['image'], 'profile.png', { type: 'image/png' });
const createTravelHistoryInput = () => ({
  destination: '서울',
  startDate: new Date('2026-07-01T00:00:00Z'),
  endDate: new Date('2026-07-02T00:00:00Z'),
  description: '테스트 여행',
  tags: ['도시'],
});

describe('ProfileService upload APIs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    process.env.NODE_ENV = 'test';
    mockAuthService.getUser.mockReturnValue(null);
    profileService.setMockMode(false);
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('prevents explicit mock mode in production', () => {
    process.env.NODE_ENV = 'production';

    expect(() => profileService.setMockMode(true)).toThrow(
      'Profile mock mode cannot be enabled in production'
    );
  });

  it('uses deterministic defaults when explicit mock mode creates a local profile', async () => {
    localStorage.clear();

    profileService.setMockMode(true);
    const profile = await profileService.getProfile();

    expect(profile?.interests).toEqual(['사진촬영', '음식탐방', '역사문화', '자연관광']);
    expect(profile?.languages).toEqual(['한국어', '영어']);
  });

  it('uses the authenticated user id for explicit local profile state', async () => {
    mockAuthService.getUser.mockReturnValue({
      id: 42,
      email: 'me@example.com',
      nickname: '나',
    });

    profileService.setMockMode(true);
    const profile = await profileService.getProfile();

    expect(profile?.id).toBe('42');
    expect(profileService.getCurrentUserId()).toBe('42');
  });

  it('rejects local travel history changes outside explicit mock mode', () => {
    expect(profileService.isMockMode()).toBe(false);

    expect(() => profileService.addTravelHistory(createTravelHistoryInput())).toThrow(
      'Travel history mutations require profile mock mode'
    );
  });

  it('keeps local travel history changes available in explicit mock mode', async () => {
    profileService.setMockMode(true);

    profileService.addTravelHistory(createTravelHistoryInput());

    const profile = await profileService.getProfile();
    expect(profile?.travelHistory).toHaveLength(1);
    expect(profile?.travelHistory[0].destination).toBe('서울');
    expect(profile?.stats.totalTrips).toBe(1);
    expect(profileService.isMockMode()).toBe(true);
  });

  it('loads the current user profile from the backend /users/me endpoint', async () => {
    mockApiClient.get.mockResolvedValueOnce({
      id: 7,
      nickname: 'down',
      fullName: 'Down User',
      createdAt: '2026-07-26T00:00:00Z',
      lastActivityAt: '2026-07-26T00:00:00Z',
    });

    const profile = await profileService.getProfile();

    expect(mockApiClient.get).toHaveBeenCalledWith('/users/me');
    expect(profile?.id).toBe('7');
  });

  it('sends editable profile fields to the backend profile endpoint', async () => {
    mockApiClient.put.mockResolvedValueOnce({
      id: 7,
      nickname: '새닉네임',
      age: 31,
      gender: 'FEMALE',
      bio: '새 자기소개',
      interests: ['사진촬영', '음식탐방'],
      languages: ['한국어', '영어'],
      travelStyle: 'FOOD',
    });

    const profile = await profileService.updateProfile({
      name: '새닉네임',
      age: 31,
      gender: 'female',
      bio: '새 자기소개',
      interests: ['사진촬영', '음식탐방'],
      languages: ['한국어', '영어'],
      travelStyle: 'FOOD',
    });

    expect(mockApiClient.put).toHaveBeenCalledWith('/users/profile', {
      nickname: '새닉네임',
      fullName: '새닉네임',
      age: 31,
      gender: 'FEMALE',
      bio: '새 자기소개',
      profileImageUrl: undefined,
      interests: ['사진촬영', '음식탐방'],
      languages: ['한국어', '영어'],
      travelStyle: 'FOOD',
    });
    expect(profile.interests).toEqual(['사진촬영', '음식탐방']);
    expect(profile.languages).toEqual(['한국어', '영어']);
  });

  it('returns null only when the backend reports a missing profile', async () => {
    mockApiClient.get.mockRejectedValueOnce({ status: 404, message: 'Profile not found' });

    await expect(profileService.getProfile('999')).resolves.toBeNull();
    expect(mockApiClient.get).toHaveBeenCalledWith('/users/profile/999');
  });

  it('exposes backend profile lookup failures', async () => {
    mockApiClient.get.mockRejectedValueOnce({ status: 500, message: 'Server error' });

    await expect(profileService.getProfile()).rejects.toMatchObject({ status: 500 });
  });

  it('uploads profile images to the backend files endpoint', async () => {
    mockApiClient.uploadFile.mockResolvedValueOnce({
      url: 'https://cdn.example.com/profile.png',
      fileName: 'profile.png',
      fileSize: 5,
      contentType: 'image/png',
    });

    const url = await profileService.updateProfileImage(createImageFile());

    expect(mockApiClient.uploadFile).toHaveBeenCalledWith(
      '/files/upload/profile',
      expect.any(File)
    );
    expect(url).toBe('https://cdn.example.com/profile.png');
  });

  it('uploads cover images to the generic backend image endpoint', async () => {
    mockApiClient.uploadFile.mockResolvedValueOnce({
      url: 'https://cdn.example.com/cover.png',
      fileName: 'cover.png',
      fileSize: 5,
      contentType: 'image/png',
    });

    const url = await profileService.updateCoverImage(createImageFile());

    expect(mockApiClient.uploadFile).toHaveBeenCalledWith('/files/upload/image', expect.any(File));
    expect(url).toBe('https://cdn.example.com/cover.png');
  });
});
