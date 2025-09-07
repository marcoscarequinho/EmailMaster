import { useQuery } from "@tanstack/react-query";

import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ["/api/user"],
    retry: false,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes to prevent excessive requests
    refetchOnWindowFocus: false, // Disable refetch on focus to prevent loops
    refetchOnMount: false, // Only fetch once per component lifecycle
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });


  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAuthError: !!error,
  };
}
