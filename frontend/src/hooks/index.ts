/**
 * Hooks Index
 *
 * 커스텀 훅들을 한 곳에서 export합니다.
 */

export {
  useAuth,
  useIsAuthenticated,
  useUser,
  useProfile,
  useCreditsBalance,
  AuthContext,
  type AuthContextType,
  type Profile,
} from "./use-auth";

export {
  useRealtimeSubscription,
  useRealtimeComments,
  useRealtimeLikes,
  useRealtimeJobStatus,
  useRealtimeNotifications,
} from "./use-realtime";

export {
  useDashboardRealtime,
  useJobRealtimeStatus,
} from "./use-dashboard-realtime";
