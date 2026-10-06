import toast from "react-hot-toast";
import { useCallback } from "react";
import { getApiErrorMessage } from "../utils/apiError";

export default function useToastError() {
  return useCallback((error, fallback) => {
    toast.error(getApiErrorMessage(error, fallback));
  }, []);
}

