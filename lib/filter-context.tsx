"use client";

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { FilterState, Rating, Theme, TimeRange, UseCase } from "./types";
import { DEFAULT_FILTER_STATE } from "./types";

type FilterAction =
  | { type: "SET_TIME_RANGE"; payload: TimeRange }
  | { type: "TOGGLE_RATING"; payload: Rating }
  | { type: "SET_VERIFIED_ONLY"; payload: boolean }
  | { type: "TOGGLE_THEME"; payload: Theme }
  | { type: "SET_THEMES"; payload: Theme[] }
  | { type: "SET_KEYWORD"; payload: string }
  | { type: "SET_SEGMENT"; payload: UseCase | null }
  | { type: "RESET" };

function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case "SET_TIME_RANGE":
      return { ...state, timeRange: action.payload };
    case "TOGGLE_RATING": {
      const ratings = state.ratings.includes(action.payload)
        ? state.ratings.filter((r) => r !== action.payload)
        : [...state.ratings, action.payload];
      return { ...state, ratings };
    }
    case "SET_VERIFIED_ONLY":
      return { ...state, verifiedOnly: action.payload };
    case "TOGGLE_THEME": {
      const themes = state.themes.includes(action.payload)
        ? state.themes.filter((t) => t !== action.payload)
        : [...state.themes, action.payload];
      return { ...state, themes };
    }
    case "SET_THEMES":
      return { ...state, themes: action.payload };
    case "SET_KEYWORD":
      return { ...state, keyword: action.payload };
    case "SET_SEGMENT":
      return { ...state, segment: state.segment === action.payload ? null : action.payload };
    case "RESET":
      return DEFAULT_FILTER_STATE;
    default:
      return state;
  }
}

type FilterContextValue = {
  filter: FilterState;
  setTimeRange: (range: TimeRange) => void;
  toggleRating: (rating: Rating) => void;
  setVerifiedOnly: (value: boolean) => void;
  toggleTheme: (theme: Theme) => void;
  setThemes: (themes: Theme[]) => void;
  setKeyword: (keyword: string) => void;
  setSegment: (segment: UseCase | null) => void;
  reset: () => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
};

const FilterContext = createContext<FilterContextValue | null>(null);

export function FilterProvider({
  children,
  initialState,
}: {
  children: ReactNode;
  initialState?: Partial<FilterState>;
}) {
  const [filter, dispatch] = useReducer(filterReducer, {
    ...DEFAULT_FILTER_STATE,
    ...initialState,
  });

  const setTimeRange = useCallback((range: TimeRange) => {
    dispatch({ type: "SET_TIME_RANGE", payload: range });
  }, []);
  const toggleRating = useCallback((rating: Rating) => {
    dispatch({ type: "TOGGLE_RATING", payload: rating });
  }, []);
  const setVerifiedOnly = useCallback((value: boolean) => {
    dispatch({ type: "SET_VERIFIED_ONLY", payload: value });
  }, []);
  const toggleTheme = useCallback((theme: Theme) => {
    dispatch({ type: "TOGGLE_THEME", payload: theme });
  }, []);
  const setThemes = useCallback((themes: Theme[]) => {
    dispatch({ type: "SET_THEMES", payload: themes });
  }, []);
  const setKeyword = useCallback((keyword: string) => {
    dispatch({ type: "SET_KEYWORD", payload: keyword });
  }, []);
  const setSegment = useCallback((segment: UseCase | null) => {
    dispatch({ type: "SET_SEGMENT", payload: segment });
  }, []);
  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filter.timeRange !== DEFAULT_FILTER_STATE.timeRange) n++;
    if (filter.ratings.length > 0) n++;
    if (filter.verifiedOnly) n++;
    if (filter.themes.length > 0) n++;
    if (filter.keyword.trim()) n++;
    if (filter.segment) n++;
    return n;
  }, [filter]);

  const hasActiveFilters = activeFilterCount > 0;

  const value = useMemo(
    () => ({
      filter,
      setTimeRange,
      toggleRating,
      setVerifiedOnly,
      toggleTheme,
      setThemes,
      setKeyword,
      setSegment,
      reset,
      hasActiveFilters,
      activeFilterCount,
    }),
    [
      filter,
      setTimeRange,
      toggleRating,
      setVerifiedOnly,
      toggleTheme,
      setThemes,
      setKeyword,
      setSegment,
      reset,
      hasActiveFilters,
      activeFilterCount,
    ],
  );

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilter(): FilterContextValue {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error("useFilter must be used within a FilterProvider");
  }
  return context;
}
