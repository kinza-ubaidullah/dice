
import { useRef } from 'react'

/**
 * MOCKED SOCKET HOOK
 * The provided backend documentation describes a REST API (Cloud Run).
 * Standard Socket.IO connections will fail with "transport close" or "xhr poll error".
 * This hook mocks the interface to prevent errors while maintaining code structure.
 */
export const useSocket = () => {
    // Mock ref to satisfy any strict checks, though we won't use it for real connection
    const socketRef = useRef<any>(null)

    const trackLiveUsers = (uid: string, displayName: string) => {
        // No-op: Backend does not support socket-based presence.
        // Presence is likely handled via REST API activity or 'searchPlayers' polling.
        // console.log(`[MockSocket] Tracking presence for ${displayName} (${uid})`);
    }

    return { socket: socketRef.current, trackLiveUsers }
}
