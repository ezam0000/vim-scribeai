# VIM Dynamic Sizing Implementation Plan

## Overview

The VIM app supports 3 dynamic sizing modes that we can leverage to provide different user experiences based on available screen real estate.

## Current Dynamic Sizes

### 1. **SMALL Mode**

- **Use Case**: Minimal footprint, quick access
- **Characteristics**: Compact widget-like interface
- **Typical Dimensions**: ~300-400px width

### 2. **CLASSIC Mode** (Current)

- **Use Case**: Standard workflow, balanced functionality
- **Characteristics**: Medium-sized interface with full features
- **Typical Dimensions**: ~600-800px width

### 3. **LARGE Mode**

- **Use Case**: Full workflow, maximum functionality
- **Characteristics**: Expanded interface with enhanced features
- **Typical Dimensions**: ~1000+ px width

---

## Implementation Strategy

### Phase 1: Size Detection & State Management

**1. Add VIM Size Context**

```typescript
// src/hooks/useVimSize.tsx
export type VimSizeMode = "SMALL" | "CLASSIC" | "LARGE";

export const useVimSize = () => {
  const [currentSize, setCurrentSize] = useState<VimSizeMode>("CLASSIC");

  // Listen to VIM OS size changes
  useEffect(() => {
    vimOS.hub.onSizeChange((newSize) => {
      setCurrentSize(newSize);
    });
  }, []);

  return { currentSize, setSize: vimOS.hub.setDynamicAppSize };
};
```

**2. Responsive Layout Hook**

```typescript
// src/hooks/useResponsiveLayout.tsx
export const useResponsiveLayout = () => {
  const { currentSize } = useVimSize();

  const layouts = {
    SMALL: {
      showSidebar: false,
      compactMode: true,
      hideSecondaryFeatures: true,
    },
    CLASSIC: {
      showSidebar: true,
      compactMode: false,
      hideSecondaryFeatures: false,
    },
    LARGE: {
      showSidebar: true,
      compactMode: false,
      hideSecondaryFeatures: false,
      enhancedFeatures: true,
    },
  };

  return layouts[currentSize];
};
```

### Phase 2: Component Adaptations

**1. ScribeAI Integration Adaptations**

**SMALL Mode:**

- Hide sidebar completely
- Compact recording controls (icon-only buttons)
- Minimal transcript display
- Hide additional notes section
- Quick action buttons only

**CLASSIC Mode:** (Current)

- Standard layout as implemented
- Sidebar available via hamburger menu
- Full feature set

**LARGE Mode:**

- Sidebar always visible (no hamburger needed)
- Split-screen layout: encounters list on left, main content on right
- Enhanced transcript view with word-by-word highlighting
- Multiple encounter comparison view
- Advanced note editing features

**2. Encounter Sidebar Adaptations**

**SMALL Mode:**

- Hidden completely
- Access via modal/overlay only

**CLASSIC Mode:**

- Current hamburger menu implementation
- Slide-in sidebar

**LARGE Mode:**

- Always visible as left panel
- Wider encounter list (400px)
- Preview pane for selected encounters
- Drag & drop encounter organization

**3. Keyphrases Manager Adaptations**

**SMALL Mode:**

- Collapsed by default
- Icon-only indicator showing count
- Quick add via inline input

**CLASSIC Mode:**

- Current collapsible implementation

**LARGE Mode:**

- Dedicated right panel
- Visual keyphrase editor
- Keyphrase usage analytics
- Import/export functionality

### Phase 3: Enhanced Features by Size

**SMALL Mode Features:**

- ⚡ Quick recording start/stop
- 📝 Minimal transcript view
- 🎯 One-click note generation
- 🔄 Auto-save everything

**CLASSIC Mode Features:** (Current)

- 🎙️ Full recording controls
- 📋 Complete transcript editing
- 🗂️ Encounter management
- 🔑 Keyphrase management

**LARGE Mode Features:**

- 👁️ Multi-encounter view
- 📊 Encounter analytics dashboard
- 🔍 Advanced search & filtering
- ⚙️ Bulk operations
- 📈 Usage statistics
- 🎨 Customizable workspace layout

### Phase 4: User Experience Enhancements

**1. Smart Size Switching**

```typescript
// Auto-suggest size changes based on user actions
const suggestSizeChange = (action: string) => {
  if (action === "viewMultipleEncounters" && currentSize !== "LARGE") {
    toast({
      title: "Expand for better view?",
      description: "Switch to Large mode for multi-encounter view",
      action: <Button onClick={() => setSize("LARGE")}>Expand</Button>,
    });
  }
};
```

**2. Size-Specific Shortcuts**

- **SMALL**: Space bar = quick record toggle
- **CLASSIC**: Current shortcuts + sidebar toggle
- **LARGE**: Advanced keyboard navigation

**3. Responsive Animations**

- Smooth transitions between size modes
- Content reorganization animations
- Progressive disclosure of features

---

## Implementation Priority

### Phase 1 (Immediate) ⚡

1. Fix hamburger icon positioning ✅
2. Add VIM size detection hook
3. Basic responsive layout adjustments

### Phase 2 (Short-term) 📅

1. SMALL mode optimizations
2. LARGE mode enhancements
3. Sidebar behavior adaptations

### Phase 3 (Medium-term) 🚀

1. Enhanced LARGE mode features
2. Multi-encounter workflows
3. Advanced analytics

### Phase 4 (Long-term) 🎯

1. AI-powered size suggestions
2. Customizable layouts
3. Advanced user preferences

---

## Technical Considerations

**1. Performance**

- Lazy load LARGE mode features
- Efficient re-rendering on size changes
- Memory management for multiple encounters

**2. State Management**

- Preserve user state across size changes
- Smart caching of encounter data
- Optimistic UI updates

**3. Accessibility**

- Keyboard navigation for all sizes
- Screen reader compatibility
- High contrast mode support

**4. Testing Strategy**

- Automated tests for each size mode
- Visual regression testing
- User acceptance testing per mode

---

## Success Metrics

**SMALL Mode:**

- Faster task completion for quick recordings
- Reduced cognitive load
- Higher adoption for brief encounters

**CLASSIC Mode:**

- Balanced functionality and usability
- Current user satisfaction maintained
- Smooth workflow transitions

**LARGE Mode:**

- Increased productivity for complex workflows
- Better multi-encounter management
- Enhanced power-user features adoption

---

This plan ensures we take full advantage of VIM's dynamic sizing capabilities while providing users with optimized experiences for different use cases and screen real estate scenarios.
