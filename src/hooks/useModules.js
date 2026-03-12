import { useDealership } from "./useDealership";

export function useModules() {

  const { dealership } = useDealership();

  const modules = dealership?.modules ?? {};

  const hasModule = (key) => modules?.[key] === true;

  return { modules, hasModule };

}