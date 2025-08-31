import { useQuery } from "@tanstack/react-query";

import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ["/api/user"],
    retry: false,
    staleTime: 0, // Always fetch fresh auth state
    refetchOnWindowFocus: true, // Refetch when window gets focus
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAuthError: !!error,
  };
}
