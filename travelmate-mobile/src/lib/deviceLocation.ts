import * as Location from 'expo-location';

const LAST_KNOWN_MAX_AGE_MS = 5 * 60 * 1000;
const FRESH_FIX_TIMEOUT_MS = 8000;

/**
 * 기기 위치를 가져온다.
 *
 * `getCurrentPositionAsync`만 부르면 새 측위가 잡힐 때까지 기다리는데, 실내나 지하처럼
 * 위성이 안 잡히는 곳에서는 응답이 오지 않거나 던져서 화면이 그대로 빈 채로 남는다.
 * 그래서 ①최근 위치가 있으면 그걸 먼저 쓰고 ②없을 때만 새 측위를 기다리되 시간 제한을 둔다.
 */
export const getDeviceLocation = async (): Promise<Location.LocationObject | null> => {
  try {
    const lastKnown = await Location.getLastKnownPositionAsync({
      maxAge: LAST_KNOWN_MAX_AGE_MS,
    });
    if (lastKnown) return lastKnown;
  } catch {
    // 최근 위치는 있으면 쓰는 값이라 실패해도 새 측위로 넘어간다.
  }

  try {
    return await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<null>(resolve => setTimeout(() => resolve(null), FRESH_FIX_TIMEOUT_MS)),
    ]);
  } catch {
    return null;
  }
};
