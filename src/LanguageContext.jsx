import { createContext, useContext } from "react";

export const LanguageContext = createContext({
  language: "zh",
  setLanguage: () => {},
});

export function useLanguage() {
  return useContext(LanguageContext);
}
