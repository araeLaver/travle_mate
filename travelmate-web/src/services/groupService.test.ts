import { groupService } from './groupService';

describe('GroupService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    groupService.setMockMode(true);
  });

  describe('getAllGroups', () => {
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
  });

  describe('getMyGroups', () => {
    it('should return user groups', async () => {
      const groups = await groupService.getMyGroups();

      expect(Array.isArray(groups)).toBe(true);
    });
  });

  describe('getRecommendedGroups', () => {
    it('should return recommended groups', async () => {
      const groups = await groupService.getRecommendedGroups();

      expect(Array.isArray(groups)).toBe(true);
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
  });

  describe('joinGroup', () => {
    it('should join a group successfully', async () => {
      const groups = await groupService.getAllGroups();
      const recruitingGroup = groups.find(g => g.status === 'recruiting');

      if (recruitingGroup) {
        const result = await groupService.joinGroup(recruitingGroup.id);
        expect(result).toBe(true);
      }
    });

    it('should throw error when joining full group', async () => {
      const groups = await groupService.getAllGroups();
      const fullGroup = groups.find(g => g.status === 'full');

      if (fullGroup) {
        await expect(groupService.joinGroup(fullGroup.id)).rejects.toThrow();
      }
    });
  });

  describe('leaveGroup', () => {
    it('should leave a group successfully', async () => {
      const groups = await groupService.getAllGroups();
      const recruitingGroup = groups.find(g => g.status === 'recruiting');

      if (recruitingGroup) {
        await groupService.joinGroup(recruitingGroup.id);
        const result = await groupService.leaveGroup(recruitingGroup.id);
        expect(result).toBe(true);
      }
    });
  });

  describe('getGroup', () => {
    it('should return group by id', async () => {
      const groups = await groupService.getAllGroups();

      if (groups.length > 0) {
        const group = await groupService.getGroup(groups[0].id);
        expect(group).not.toBeNull();
        expect(group?.id).toBe(groups[0].id);
      }
    });

    it('should return null for non-existent group', async () => {
      const group = await groupService.getGroup('non-existent-id');
      expect(group).toBeNull();
    });
  });

  describe('getCurrentUserId', () => {
    it('should return current user id', () => {
      const userId = groupService.getCurrentUserId();
      expect(typeof userId).toBe('string');
      expect(userId.length).toBeGreaterThan(0);
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
