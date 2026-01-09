import { create } from 'zustand'
import type { DishEntryData, CuisineCategory, CuisineSubcategory } from '../types'

type EntryStep = 'dish' | 'restaurant' | 'cuisine' | 'photo' | 'complete'

interface EntryState {
  // Current step in the wizard
  currentStep: EntryStep

  // Entry data
  data: DishEntryData

  // Actions
  setStep: (step: EntryStep) => void
  nextStep: () => void
  prevStep: () => void

  setDishName: (name: string) => void
  setRestaurant: (restaurant: DishEntryData['restaurant']) => void
  setCuisineCategory: (category: CuisineCategory | null) => void
  setCuisineSubcategory: (subcategory: CuisineSubcategory | null) => void
  setPhoto: (file: File | null, preview: string | null) => void

  // Reset
  reset: () => void
}

const STEP_ORDER: EntryStep[] = ['dish', 'restaurant', 'cuisine', 'photo', 'complete']

const initialData: DishEntryData = {
  dishName: '',
  restaurant: null,
  cuisineCategory: null,
  cuisineSubcategory: null,
  photoFile: null,
  photoPreview: null,
}

export const useEntryStore = create<EntryState>()((set, get) => ({
  currentStep: 'dish',
  data: initialData,

  setStep: (step) => set({ currentStep: step }),

  nextStep: () => {
    const { currentStep } = get()
    const currentIndex = STEP_ORDER.indexOf(currentStep)
    if (currentIndex < STEP_ORDER.length - 1) {
      set({ currentStep: STEP_ORDER[currentIndex + 1] })
    }
  },

  prevStep: () => {
    const { currentStep } = get()
    const currentIndex = STEP_ORDER.indexOf(currentStep)
    if (currentIndex > 0) {
      set({ currentStep: STEP_ORDER[currentIndex - 1] })
    }
  },

  setDishName: (dishName) =>
    set((state) => ({
      data: { ...state.data, dishName },
    })),

  setRestaurant: (restaurant) =>
    set((state) => ({
      data: { ...state.data, restaurant },
    })),

  setCuisineCategory: (cuisineCategory) =>
    set((state) => ({
      data: {
        ...state.data,
        cuisineCategory,
        // Reset subcategory when category changes
        cuisineSubcategory: null,
      },
    })),

  setCuisineSubcategory: (cuisineSubcategory) =>
    set((state) => ({
      data: { ...state.data, cuisineSubcategory },
    })),

  setPhoto: (photoFile, photoPreview) =>
    set((state) => ({
      data: { ...state.data, photoFile, photoPreview },
    })),

  reset: () =>
    set({
      currentStep: 'dish',
      data: initialData,
    }),
}))
