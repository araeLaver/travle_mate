import { groupService } from './groupService';
import { apiClient } from './apiClient';
import { authService } from './authService';

jest.mock('./apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

jest.mock('./authService', () => ({
  authService: {
    getUser: jest.fn(),
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
const mockAuthService = authService as jest.Mocked<typeof authService>;
const originalNodeEnv = process.env.NODE_ENV;

describe('GroupService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    process.env.NODE_ENV = 'test';
    mockAuthService.getUser.mockReturnValue(null);
    groupService.setMockMode(true);
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('getAllGroups', () => {
    it('should prevent explicit mock mode in production', () => {
      process.env.NODE_ENV = 'production';

      expect(() => groupService.setMockMode(true)).toThrow(
        'Group mock mode cannot be enabled in production'
      );
    });

    it('should return all groups', async () => {
      const groups = await groupService.getAllGroups();

      expect(Array.isArray(groups)).toBe(true);
      expect(groups.length).toBeGreaterThan(0);

      const group = groups[0];
      expect(group).toHaveProperty('id');
      expect(group).toHaveProperty('name');
      expect(group).toHaveProperty('destination');
      expect(group).toHaveProperty('startDate');
      expect(group).toHaveProperty('endDate');
      expect(group).toHaveProperty('maxMembers');
      expect(group).toHaveProperty('currentMembers');
      expect(group).toHaveProperty('status');
    });

    it('should expose API failure outside explicit mock mode', async () => {
      groupService.setMockMode(false);
      mockApiClient.get.mockRejectedValueOnce(new Error('API down'));

      await expect(groupService.getAllGroups()).rejects.toThrow('API down');
    });

    it('should expose API failure in production instead of returning mock groups', async () => {
      process.env.NODE_ENV = 'production';
      groupService.setMockMode(false);
      mockApiClient.get.mockRejectedValueOnce(new Error('API down'));

      await expect(groupService.getAllGroups()).rejects.toThrow('API down');
    });
  });

  describe('getMyGroups', () => {
    it('should return user groups', async () => {
      const groups = await groupService.getMyGroups();

      expect(Array.isArray(groups)).toBe(true);
    });

    it('should return an empty list for unauthenticated users', async () => {
      groupService.setMockMode(false);
      mockApiClient.get.mockRejectedValueOnce({ status: 401, message: 'Unauthorized' });

      await expect(groupService.getMyGroups()).resolves.toEqual([]);
    });

    it('should expose non-auth API failures', async () => {
      groupService.setMockMode(false);
      mockApiClient.get.mockRejectedValueOnce({ status: 500, message: 'Server error' });

      await expect(groupService.getMyGroups()).rejects.toMatchObject({ status: 500 });
    });
  });

  describe('getRecommendedGroups', () => {
    it('should return recommended groups', async () => {
      const groups = await groupService.getRecommendedGroups();

      expect(Array.isArray(groups)).toBe(true);
    });

    it('should return backend recommended groups in a stable priority order', async () => {
      groupService.setMockMode(false);
      mockApiClient.get.mockResolvedValueOnce([
        {
          id: 10,
          title: 'Later group',
          startDate: '2026-08-05',
          endDate: '2026-08-08',
          maxMembers: 6,
          currentMemberCount: 2,
          members: [],
          createdAt: '2026-07-20T00:00:00Z',
          status: 'RECRUITING',
        },
        {
          id: 2,
          title: 'Sooner with more room',
          startDate: '2026-08-01',
          endDate: '2026-08-03',
          maxMembers: 6,
          currentMemberCount: 2,
          members: [],
          createdAt: '2026-07-23T00:00:00Z',
          status: 'RECRUITING',
        },
        {
          id: 3,
          title: 'Sooner almost full',
          startDate: '2026-08-01',
          endDate: '2026-08-03',
          maxMembers: 6,
          currentMemberCount: 5,
          members: [],
          createdAt: '2026-07-21T00:00:00Z',
          status: 'RECRUITING',
        },
      ]);

      const groups = await groupService.getRecommendedGroups();

      expect(mockApiClient.get).toHaveBeenCalledWith('/groups?status=recruiting');
      expect(groups.map(group => group.id)).toEqual(['3', '2', '10']);
    });

    it('filters backend recommendations using the authenticated user id', async () => {
      groupService.setMockMode(false);
      mockAuthService.getUser.mockReturnValue({
        id: 42,
        email: 'me@example.com',
        nickname: '나',
      });
      mockApiClient.get.mockResolvedValueOnce([
        {
          id: 1,
          title: 'Already joined',
          startDate: '2026-08-01',
          endDate: '2026-08-03',
          maxMembers: 6,
          currentMemberCount: 2,
          members: [{ userId: 42, nickname: '나', role: 'MEMBER', status: 'ACCEPTED' }],
          createdAt: '2026-07-20T00:00:00Z',
          status: 'RECRUITING',
        },
        {
          id: 2,
          title: 'Open group',
          startDate: '2026-08-02',
          endDate: '2026-08-04',
          maxMembers: 6,
          currentMemberCount: 1,
          members: [{ userId: 7, nickname: '다른 사용자', role: 'CREATOR', status: 'ACCEPTED' }],
          createdAt: '2026-07-21T00:00:00Z',
          status: 'RECRUITING',
        },
      ]);

      const groups = await groupService.getRecommendedGroups();

      expect(groups.map(group => group.id)).toEqual(['2']);
    });

    it('should expose recommendation API failure in production', async () => {
      process.env.NODE_ENV = 'production';
      groupService.setMockMode(false);
      mockApiClient.get.mockRejectedValueOnce(new Error('recommendation API down'));

      await expect(groupService.getRecommendedGroups()).rejects.toThrow('recommendation API down');
    });

    it('should expose recommendation API failure outside explicit mock mode', async () => {
      groupService.setMockMode(false);
      mockApiClient.get.mockRejectedValueOnce(new Error('recommendation API down'));

      await expect(groupService.getRecommendedGroups()).rejects.toThrow('recommendation API down');
    });
  });

  describe('searchGroups', () => {
    it('should search groups by query', async () => {
      const groups = await groupService.searchGroups('여행');

      expect(Array.isArray(groups)).toBe(true);
    });

    it('should filter groups by destination', async () => {
      const groups = await groupService.searchGroups('', { destination: '제주' });

      expect(Array.isArray(groups)).toBe(true);
    });

    it('should filter groups by travel style', async () => {
      const groups = await groupService.searchGroups('', { travelStyle: '맛집탐방' });

      expect(Array.isArray(groups)).toBe(true);
    });

    it('should filter groups by status', async () => {
      const groups = await groupService.searchGroups('', { status: 'recruiting' });

      expect(Array.isArray(groups)).toBe(true);
      groups.forEach(group => {
        expect(group.status).toBe('recruiting');
      });
    });
  });

  describe('createGroup', () => {
    it('should create a new group', async () => {
      const newGroup = await groupService.createGroup({
        name: '테스트 그룹',
        description: '테스트 설명',
        destination: '서울',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxMembers: 5,
        tags: ['테스트'],
        travelStyle: '문화탐방',
        requirements: [],
      });

      expect(newGroup).toHaveProperty('id');
      expect(newGroup.name).toBe('테스트 그룹');
      expect(newGroup.destination).toBe('서울');
      expect(newGroup.status).toBe('recruiting');
      expect(newGroup.currentMembers).toBe(1);
    });

    it('should post the backend CreateRequest contract outside mock mode', async () => {
      groupService.setMockMode(false);
      mockApiClient.post.mockResolvedValueOnce({
        id: 77,
        title: '의료 동행',
        description: '병원 근처 숙소 공유',
        destination: '오사카',
        startDate: '2026-08-01',
        endDate: '2026-08-03',
        maxMembers: 20,
        currentMemberCount: 1,
        members: [],
        createdAt: '2026-07-27T00:00:00Z',
        status: 'RECRUITING',
        travelStyle: 'CULTURE',
      });

      await groupService.createGroup({
        name: '의료 동행',
        description: '병원 근처 숙소 공유',
        destination: '오사카',
        startDate: new Date(2026, 7, 1, 23, 30),
        endDate: new Date(2026, 7, 3, 23, 30),
        maxMembers: 20,
        purpose: 'MEDICAL',
        tags: ['병원'],
        travelStyle: 'CULTURE',
        requirements: ['금연', '정시 출발'],
        budget: {
          min: 100000,
          max: 300000,
          currency: 'KRW',
        },
        coverImage: 'https://example.com/group.png',
      });

      expect(mockApiClient.post).toHaveBeenCalledWith('/groups', {
        title: '의료 동행',
        description: '병원 근처 숙소 공유',
        destination: '오사카',
        startDate: '2026-08-01',
        endDate: '2026-08-03',
        maxMembers: 20,
        purpose: 'MEDICAL',
        travelStyle: 'CULTURE',
        requirements: '금연,정시 출발',
        budgetRange: '100000-300000',
        groupImageUrl: 'https://example.com/group.png',
      });
    });
  });

  describe('joinGroup', () => {
    it('should join a group successfully', async () => {
      const groups = await groupService.getAllGroups();
      const recruitingGroup = groups.find(g => g.status === 'recruiting');

      expect(recruitingGroup).toBeDefined();
      const result = await groupService.joinGroup(recruitingGroup!.id);
      expect(result).toBe(true);
    });

    it('should throw error when joining full group', async () => {
      const groups = await groupService.getAllGroups();
      const fullGroup = groups.find(g => g.status === 'full');

      if (!fullGroup) {
        // Skip test if no full group exists in mock data
        return;
      }
      await expect(groupService.joinGroup(fullGroup.id)).rejects.toThrow();
    });
  });

  describe('leaveGroup', () => {
    it('should leave a group successfully', async () => {
      const groups = await groupService.getAllGroups();
      const recruitingGroup = groups.find(g => g.status === 'recruiting');

      expect(recruitingGroup).toBeDefined();
      await groupService.joinGroup(recruitingGroup!.id);
      const result = await groupService.leaveGroup(recruitingGroup!.id);
      expect(result).toBe(true);
    });
  });

  describe('getGroup', () => {
    it('should return group by id', async () => {
      const groups = await groupService.getAllGroups();

      expect(groups.length).toBeGreaterThan(0);
      const group = await groupService.getGroup(groups[0].id);
      expect(group).not.toBeNull();
      expect(group?.id).toBe(groups[0].id);
    });

    it('should return null for non-existent group', async () => {
      const group = await groupService.getGroup('non-existent-id');
      expect(group).toBeNull();
    });

    it('should return null only for API 404 responses outside mock mode', async () => {
      groupService.setMockMode(false);
      mockApiClient.get.mockRejectedValueOnce({ status: 404, message: 'Not found' });

      await expect(groupService.getGroup('missing')).resolves.toBeNull();
    });

    it('should expose non-404 group lookup failures', async () => {
      groupService.setMockMode(false);
      mockApiClient.get.mockRejectedValueOnce({ status: 500, message: 'Server error' });

      await expect(groupService.getGroup('group-1')).rejects.toMatchObject({ status: 500 });
    });
  });

  describe('getCurrentUserId', () => {
    it('should return current user id', () => {
      const userId = groupService.getCurrentUserId();
      expect(typeof userId).toBe('string');
      expect(userId.length).toBeGreaterThan(0);
    });

    it('prefers the authenticated user id over the mock fallback id', () => {
      mockAuthService.getUser.mockReturnValue({
        id: 42,
        email: 'me@example.com',
        nickname: '나',
      });

      expect(groupService.getCurrentUserId()).toBe('42');
    });
  });

  describe('group status', () => {
    it('should have valid status values', async () => {
      const groups = await groupService.getAllGroups();
      const validStatuses = ['recruiting', 'full', 'active', 'completed'];

      groups.forEach(group => {
        expect(validStatuses).toContain(group.status);
      });
    });
  });

  describe('group dates', () => {
    it('should have valid date objects', async () => {
      const groups = await groupService.getAllGroups();

      groups.forEach(group => {
        expect(group.startDate).toBeInstanceOf(Date);
        expect(group.endDate).toBeInstanceOf(Date);
        expect(group.endDate.getTime()).toBeGreaterThanOrEqual(group.startDate.getTime());
      });
    });
  });

  describe('group members', () => {
    it('should have valid member counts', async () => {
      const groups = await groupService.getAllGroups();

      groups.forEach(group => {
        expect(group.currentMembers).toBeGreaterThanOrEqual(1);
        expect(group.currentMembers).toBeLessThanOrEqual(group.maxMembers);
        expect(group.members.length).toBe(group.currentMembers);
      });
    });

    it('should have a leader in each group', async () => {
      const groups = await groupService.getAllGroups();

      groups.forEach(group => {
        const leader = group.members.find(m => m.role === 'leader');
        expect(leader).toBeDefined();
      });
    });
  });
});
