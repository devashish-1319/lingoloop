import { useQuery } from "@tanstack/react-query";
import { getAuthUser } from "../lib/api";

const useAuthUser = () => {
  const authUser = useQuery({
    queryKey: ["authUser"],
    queryFn: getAuthUser,
    retry: false, // auth check
  });

  return {
    isLoading: authUser.isLoading,
    isError: authUser.isError,
    refetch: authUser.refetch,
    authUser: authUser.data?.user,
  };
};
export default useAuthUser;
