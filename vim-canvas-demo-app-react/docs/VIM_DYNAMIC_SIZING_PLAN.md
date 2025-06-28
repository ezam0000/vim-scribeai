# VIM Dynamic Sizing & Early Activation Plan

## Overview

Transform the VIM app to:

1. **Early Activation**: Available at patients list level (not just encounters)
2. **Responsive Design**: Mobile-style UI for small sizes, desktop-style for large sizes
3. **Context-Aware**: Different features based on current VIM context

## Current State

- ❌ Only available inside specific patient encounters
- ❌ Single UI design regardless of app size
- ❌ Late activation in workflow
- ✅ Working encounter-level functionality

## Target State

- ✅ Available at patients list level (`/scribeai/patients`)
- ✅ Mobile-style UI for CLASSIC size (365px width)
- ✅ Desktop-style UI for LARGE/EXTRA_LARGE sizes (800px/1350px width)
- ✅ Context-aware feature sets

---

## Phase 1: Context Detection & Early Activation

### 1.1 Create Context Detection Hook

```typescript
// src/hooks/useVimContext.tsx
interface VimContextState {
  contextType: "patients_list" | "patient_encounter" | "unknown";
  currentPatientId?: string;
  isLoading: boolean;
}

const useVimContext = () => {
  // Detect current VIM context using vimOS.session
  // Return contextType and relevant data
};
```

### 1.2 Update Activation Logic

```typescript
// src/hooks/useVimActivation.tsx
const useVimActivation = () => {
  const { contextType } = useVimContext();

  useEffect(() => {
    if (
      contextType === "patients_list" ||
      contextType === "patient_encounter"
    ) {
      vimOS.hub.setActivationStatus("ENABLED");
    } else {
      vimOS.hub.setActivationStatus("LOADING");
    }
  }, [contextType]);
};
```

### 1.3 Integration Points

- Update `AppWrapper.tsx` to use new activation logic
- Handle loading states appropriately
- Ensure graceful fallbacks for unknown contexts

---

## Phase 2: Dynamic Sizing System

### 2.1 Create App Size Detection Hook

```typescript
// src/hooks/useAppSize.tsx
interface AppSizeState {
  currentSize: "CLASSIC" | "LARGE" | "EXTRA_LARGE";
  isMobile: boolean; // CLASSIC size
  isDesktop: boolean; // LARGE or EXTRA_LARGE
  dimensions: { width: number; height: number };
}

const useAppSize = () => {
  // Track current app size
  // Provide responsive utilities
  // Handle size change events
};
```

### 2.2 Size Management Hook

```typescript
// src/hooks/useVimSizing.tsx
const useVimSizing = () => {
  const requestSize = (size: ApplicationSize) => {
    vimOS.hub.setDynamicAppSize(size);
  };

  // Manage size requests based on content needs
};
```

### 2.3 Responsive Component System

```typescript
// src/components/ResponsiveWrapper.tsx
interface ResponsiveWrapperProps {
  mobileComponent: React.ComponentType;
  desktopComponent: React.ComponentType;
  children?: React.ReactNode;
}

const ResponsiveWrapper = ({
  mobileComponent: Mobile,
  desktopComponent: Desktop,
}) => {
  const { isMobile } = useAppSize();
  return isMobile ? <Mobile /> : <Desktop />;
};
```

---

## Phase 3: Context-Aware Components

### 3.1 Patients List Components

#### Mobile Version (CLASSIC - 365px)

```typescript
// src/components/mobile/MobilePatientsList.tsx
- Vertical scrollable list
- Simplified patient cards
- Touch-friendly tap targets
- Search bar at top
- Quick action buttons
- Similar to mobile app design patterns
```

#### Desktop Version (LARGE/EXTRA_LARGE - 800px+)

```typescript
// src/components/desktop/DesktopPatientsList.tsx
- Data table with columns
- Advanced filtering options
- Bulk action capabilities
- Detailed patient information
- Side panel for quick preview
- Similar to current desktop app
```

### 3.2 Encounter Components

#### Mobile Version

```typescript
// src/components/mobile/MobileEncounter.tsx
- Tab-based navigation
- Stacked form fields
- Simplified note generation
- Touch-optimized transcription controls
- Collapsible sections
```

#### Desktop Version

```typescript
// src/components/desktop/DesktopEncounter.tsx
- Multi-column layout
- Rich text editors
- Advanced note generation options
- Comprehensive transcription interface
- Side-by-side comparisons
```

---

## Phase 4: Feature Matrix by Context & Size

### Patients List Context

| Feature         | Mobile (CLASSIC)  | Desktop (LARGE+) |
| --------------- | ----------------- | ---------------- |
| Patient Search  | Simple search bar | Advanced filters |
| Patient List    | Card-based scroll | Data table       |
| Quick Actions   | Swipe gestures    | Dropdown menus   |
| Patient Details | Modal overlay     | Side panel       |
| Navigation      | Bottom tabs       | Top navigation   |

### Encounter Context

| Feature         | Mobile (CLASSIC)     | Desktop (LARGE+)   |
| --------------- | -------------------- | ------------------ |
| Transcription   | Simple controls      | Advanced controls  |
| Note Generation | Basic templates      | Full customization |
| Patient Info    | Collapsible sections | Always visible     |
| History         | Tab navigation       | Multi-panel        |
| Actions         | Stacked buttons      | Toolbar            |

---

## Phase 5: Implementation Strategy

### 5.1 Development Order

1. ✅ **Context Detection** - Create hooks for VIM context awareness
2. ✅ **Early Activation** - Enable app at patients list level
3. ✅ **Size Detection** - Implement app size tracking
4. ✅ **Responsive Wrapper** - Create component switching system
5. ✅ **Mobile Components** - Build mobile-optimized components
6. ✅ **Desktop Components** - Enhance desktop components
7. ✅ **Feature Integration** - Connect features to appropriate contexts
8. ✅ **Testing & Polish** - Test all combinations and edge cases

### 5.2 File Structure

```
src/
├── hooks/
│   ├── useVimContext.tsx       # Context detection
│   ├── useVimActivation.tsx    # Activation management
│   ├── useAppSize.tsx          # Size detection
│   └── useVimSizing.tsx        # Size management
├── components/
│   ├── ResponsiveWrapper.tsx   # Size-based switching
│   ├── mobile/                 # Mobile-optimized components
│   │   ├── MobilePatientsList.tsx
│   │   ├── MobileEncounter.tsx
│   │   └── ...
│   └── desktop/                # Desktop-optimized components
│       ├── DesktopPatientsList.tsx
│       ├── DesktopEncounter.tsx
│       └── ...
└── utils/
    ├── vimContextUtils.ts      # Context detection utilities
    └── vimSizingUtils.ts       # Size management utilities
```

### 5.3 Integration Points

- Update `AppWrapper.tsx` to use new activation logic
- Enhance existing components with responsive wrappers
- Maintain backward compatibility during transition
- Add proper TypeScript types for all new interfaces

---

## Phase 6: Testing Strategy

### 6.1 Context Testing

- [ ] Test activation at patients list level
- [ ] Test activation during encounter navigation
- [ ] Test handling of unknown contexts
- [ ] Test context transitions

### 6.2 Size Testing

- [ ] Test CLASSIC size mobile components
- [ ] Test LARGE size desktop components
- [ ] Test EXTRA_LARGE size desktop components
- [ ] Test dynamic size changes
- [ ] Test responsive switching

### 6.3 Integration Testing

- [ ] Test all context + size combinations
- [ ] Test feature availability matrix
- [ ] Test navigation between contexts
- [ ] Test state persistence across size changes

---

## Success Criteria

✅ **Early Activation**: App available at patients list level
✅ **Responsive Design**: Different UIs for different sizes
✅ **Context Awareness**: Appropriate features per context
✅ **Smooth Transitions**: Seamless size and context changes
✅ **Performance**: No degradation in app performance
✅ **User Experience**: Intuitive and familiar interfaces

---

## Risk Mitigation

| Risk                       | Mitigation                                     |
| -------------------------- | ---------------------------------------------- |
| VIM SDK limitations        | Thorough SDK documentation review and testing  |
| Context detection failures | Robust fallback mechanisms                     |
| Size change performance    | Efficient re-rendering strategies              |
| User confusion             | Clear visual indicators and smooth transitions |
| Backward compatibility     | Gradual rollout and feature flags              |

---

## Timeline Estimate

- **Phase 1**: Context Detection & Early Activation (2-3 days)
- **Phase 2**: Dynamic Sizing System (2-3 days)
- **Phase 3**: Context-Aware Components (4-5 days)
- **Phase 4**: Feature Integration (2-3 days)
- **Phase 5**: Testing & Polish (2-3 days)

**Total Estimated Time**: 12-17 days

---

This plan provides a comprehensive roadmap for implementing dynamic sizing and early activation while maintaining clean architecture and excellent user experience across all contexts and sizes.
