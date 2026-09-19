type MockClientConfig = {
  connectHeaders?: Record<string, string>;
  beforeConnect?: (client: unknown) => void | Promise<void>;
  webSocketFactory: () => unknown;
  onConnect: () => void;
  onStompError: (frame?: unknown) => void;
  onWebSocketError: (event?: Event) => void;
};

type MockClientInstance = MockClientConfig & {
  active: boolean;
  connected: boolean;
  activate: jest.Mock;
  deactivate: jest.Mock;
  subscribe: jest.Mock;
  publish: jest.Mock;
};

var mockClientInstance: MockClientInstance;
var mockActivate = jest.fn(() => {
  if (mockClientInstance.beforeConnect) {
    void Promise.resolve(mockClientInstance.beforeConnect(mockClientInstance));
  }
});
var mockDeactivate = jest.fn();

jest.mock('@stomp/stompjs', () => ({
  Client: jest.fn().mockImplementation((config: MockClientConfig) => {
    mockClientInstance = {
      ...config,
      active: false,
      connected: false,
      connectHeaders: config.connectHeaders,
      activate: mockActivate,
      deactivate: mockDeactivate,
      subscribe: jest.fn(),
      publish: jest.fn(),
    };
    return mockClientInstance;
  }),
}));

jest.mock('sockjs-client', () => jest.fn());

jest.mock('./authService', () => ({
  authService: {
    getValidToken: jest.fn(),
  },
}));

jest.mock('./apiConfig', () => ({
  getWebSocketUrl: jest.fn(() => 'http://localhost:8080/api/ws'),
}));

const { websocketService } = require('./websocketService') as typeof import('./websocketService');
const { authService } = require('./authService') as typeof import('./authService');
const SockJS = require('sockjs-client') as jest.Mock;

const mockAuthService = authService as jest.Mocked<typeof authService>;

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

describe('WebSocketService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockActivate.mockImplementation(() => {
      if (mockClientInstance.beforeConnect) {
        void Promise.resolve(mockClientInstance.beforeConnect(mockClientInstance));
      }
    });
    mockClientInstance.active = false;
    mockClientInstance.connected = false;
    mockClientInstance.connectHeaders = {};
  });

  it('refreshes auth headers through beforeConnect before opening STOMP', async () => {
    mockAuthService.getValidToken.mockResolvedValueOnce('fresh-token');

    const connectPromise = websocketService.connect();
    await flushPromises();

    expect(mockAuthService.getValidToken).toHaveBeenCalledTimes(1);
    expect(mockClientInstance.connectHeaders).toEqual({
      Authorization: 'Bearer fresh-token',
    });
    expect(mockActivate).toHaveBeenCalledTimes(1);

    mockClientInstance.onConnect();
    await expect(connectPromise).resolves.toBeUndefined();
  });

  it('refreshes auth headers again for STOMP reconnect attempts', async () => {
    mockAuthService.getValidToken
      .mockResolvedValueOnce('first-token')
      .mockResolvedValueOnce('second-token');

    const connectPromise = websocketService.connect();
    await flushPromises();
    mockClientInstance.onConnect();
    await connectPromise;

    await mockClientInstance.beforeConnect?.(mockClientInstance);

    expect(mockAuthService.getValidToken).toHaveBeenCalledTimes(2);
    expect(mockClientInstance.connectHeaders).toEqual({
      Authorization: 'Bearer second-token',
    });
  });

  it('waits for an active STOMP reconnect instead of resolving early', async () => {
    mockClientInstance.active = true;
    mockClientInstance.connected = false;

    let settled = false;
    const connectPromise = websocketService.connect().then(() => {
      settled = true;
    });
    await flushPromises();

    expect(settled).toBe(false);
    expect(mockActivate).not.toHaveBeenCalled();

    mockClientInstance.connected = true;
    mockClientInstance.onConnect();
    await connectPromise;

    expect(settled).toBe(true);
  });

  it('uses the central WebSocket URL for the SockJS factory', () => {
    mockClientInstance.webSocketFactory();

    expect(SockJS).toHaveBeenCalledWith('http://localhost:8080/api/ws');
  });

  it('publishes room join and leave payloads with backend DTO field names', () => {
    mockClientInstance.active = true;
    mockClientInstance.connected = true;

    websocketService.joinRoom('42', '7');
    websocketService.leaveRoom('42', '7');

    expect(mockClientInstance.publish).toHaveBeenNthCalledWith(1, {
      destination: '/app/chat.join',
      body: JSON.stringify({ chatRoomId: '42', userId: '7' }),
    });
    expect(mockClientInstance.publish).toHaveBeenNthCalledWith(2, {
      destination: '/app/chat.leave',
      body: JSON.stringify({ chatRoomId: '42', userId: '7' }),
    });
  });

  it('publishes typing status with backend DTO field names', () => {
    mockClientInstance.active = true;
    mockClientInstance.connected = true;

    websocketService.sendTypingStatus('42', '7', true);

    expect(mockClientInstance.publish).toHaveBeenCalledWith({
      destination: '/app/chat.typing',
      body: JSON.stringify({ chatRoomId: '42', userId: '7', isTyping: true }),
    });
  });

  it('does not publish while STOMP is active but not connected', () => {
    mockClientInstance.active = true;
    mockClientInstance.connected = false;

    expect(() => websocketService.joinRoom('42', '7')).toThrow('WebSocket is not connected');
    websocketService.sendTypingStatus('42', '7', true);

    expect(mockClientInstance.publish).not.toHaveBeenCalled();
  });
});
