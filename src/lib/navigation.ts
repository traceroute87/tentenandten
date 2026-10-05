import { useNavigate, type NavigateOptions, type To } from "react-router-dom";

export const supportsViewTransitions =
  typeof document !== "undefined" && "startViewTransition" in document;

export function useAppNavigate() {
  const navigate = useNavigate();
  return (to: To | number, options?: NavigateOptions) => {
    if (typeof to === "number") return navigate(to);
    return navigate(to, { ...options, viewTransition: supportsViewTransitions && options?.viewTransition !== false });
  };
}
