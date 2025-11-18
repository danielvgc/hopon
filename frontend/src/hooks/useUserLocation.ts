import { useState, useEffect, useRef } from "react";

interface LocationCoords {
  lat: number;
  lng: number;
}

/**
 * Hook to get user's current location with fallback to profile location.
 * Attempts to get real-time geolocation first, falls back to profile location if:
 * - User denies permission
 * - Geolocation not supported
 * - Error occurs
 */
export function useUserLocation(profileLocation?: { lat?: number; lng?: number } | null) {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const watchIdRef = useRef<number | null>(null);
  const permissionCheckedRef = useRef(false);

  useEffect(() => {
    // If we already checked permissions, don't try again
    if (permissionCheckedRef.current) {
      return;
    }

    if (typeof navigator === "undefined") {
      // Fallback to profile location if not in browser
      if (profileLocation?.lat && profileLocation?.lng) {
        setLocation({ lat: profileLocation.lat, lng: profileLocation.lng });
      }
      setIsLoadingLocation(false);
      return;
    }

    if (!navigator.geolocation) {
      console.warn("Geolocation not supported, using profile location");
      // Fallback to profile location
      if (profileLocation?.lat && profileLocation?.lng) {
        setLocation({ lat: profileLocation.lat, lng: profileLocation.lng });
      }
      setIsLoadingLocation(false);
      permissionCheckedRef.current = true;
      return;
    }

    // Try to get current position (this will prompt for permission on first call)
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log("[useUserLocation] Got real-time location:", latitude, longitude);
        setLocation({ lat: latitude, lng: longitude });
        setIsLoadingLocation(false);
        permissionCheckedRef.current = true;
      },
      (error) => {
        console.warn("[useUserLocation] Geolocation error:", error);
        // Fallback to profile location on error
        if (profileLocation?.lat && profileLocation?.lng) {
          console.log("[useUserLocation] Falling back to profile location");
          setLocation({ lat: profileLocation.lat, lng: profileLocation.lng });
        }
        setIsLoadingLocation(false);
        permissionCheckedRef.current = true;
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );

    watchIdRef.current = watchId;

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [profileLocation?.lat, profileLocation?.lng]);

  return { location, isLoadingLocation };
}
