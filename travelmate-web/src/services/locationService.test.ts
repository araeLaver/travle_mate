import { locationService } from './locationService';
import { apiClient } from './apiClient';

jest.mock('./apiClient', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

jest.mock('../lib/utils', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    log: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;
const originalNodeEnv = process.env.NODE_ENV;
const originalFetch = global.fetch;
const currentLocation = { latitude: 37.5665, longitude: 126.978 };
const serviceState = locationService as unknown as {
  currentLocation: typeof currentLocation | null;
};

describe('LocationService nearby travel mates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn() as unknown as typeof fetch;
    process.env.NODE_ENV = 'test';
    serviceState.currentLocation = currentLocation;
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
    global.fetch = originalFetch;
  });

  it('fetches nearby users from the backend and maps them to TravelMate entries', async () => {
    mockApiClient.get.mockResolvedValueOnce([
      {
        id: 2,
        nickname: '상대방',
        age: 29,
        gender: 'FEMALE',
        profileImageUrl: 'https://example.com/profile.jpg',
        bio: '서울 여행 중',
        currentLatitude: 37.57,
        currentLongitude: 126.99,
        travelStyle: 'FOOD',
        interests: ['맛집'],
        languages: ['한국어'],
        rating: 4.5,
        lastActivityAt: new Date().toISOString(),
      },
    ]);

    const mates = await locationService.findNearbyTravelMates(5);

    expect(mockApiClient.get).toHaveBeenCalledWith(
      '/users/nearby?latitude=37.5665&longitude=126.978&radiusKm=5'
    );
    expect(mates[0]).toMatchObject({
      id: '2',
      name: '상대방',
      age: 29,
      gender: 'female',
      travelStyle: 'FOOD',
      interests: ['맛집'],
      languages: ['한국어'],
      profileImage: 'https://example.com/profile.jpg',
      matchScore: 90,
    });
    expect(mates[0].distance).toBeGreaterThanOrEqual(0);
    expect(mates[0].isOnline).toBe(true);
  });

  it('exposes nearby API failure outside production instead of returning mock mates', async () => {
    mockApiClient.get.mockRejectedValueOnce(new Error('nearby API down'));

    await expect(locationService.findNearbyTravelMates(5)).rejects.toThrow('nearby API down');
  });

  it('exposes nearby API failure in production', async () => {
    process.env.NODE_ENV = 'production';
    mockApiClient.get.mockRejectedValueOnce(new Error('nearby API down'));

    await expect(locationService.findNearbyTravelMates(5)).rejects.toThrow('nearby API down');
  });

  it('sets manual location through the shared backend address resolver', async () => {
    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        documents: [
          {
            road_address: {
              address_name: '경기도 광주시 중앙로 1',
            },
          },
        ],
      }),
    });

    const location = await locationService.setManualLocation({
      latitude: 37.4138,
      longitude: 127.2557,
      address: '경기도 광주시 (수동 설정)',
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/location/address?lat=37.4138&lng=127.2557',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
    expect(location).toEqual({
      latitude: 37.4138,
      longitude: 127.2557,
      address: '경기도 광주시 중앙로 1',
    });
    expect(locationService.getCurrentLocationSync()).toEqual(location);
  });

  it('uses the manual location for subsequent nearby searches', async () => {
    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });
    mockApiClient.get.mockResolvedValueOnce([]);

    await locationService.setManualLocation({
      latitude: 37.4138,
      longitude: 127.2557,
      address: '경기도 광주시 (수동 설정)',
    });
    await locationService.findNearbyTravelMates(10);

    expect(mockApiClient.get).toHaveBeenCalledWith(
      '/users/nearby?latitude=37.4138&longitude=127.2557&radiusKm=10'
    );
  });
});
