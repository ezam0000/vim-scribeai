# VIM App Enhancement Implementation Plan

**Date:** June 26, 2025  
**Project:** vim-canvas-demo-app-react  
**Database:** Shared Supabase instance with scribeai_api

---

## 🎯 **Overview**

This plan outlines three major enhancements to the VIM app:

1. **Keyphrases/Dot Phrases** - Text expansion functionality
2. **Patient Management** - Patient list, details, and historical notes
3. **UI Design Update** - Match mobile app design language

**Key Reference:** `scribeai_api/public/client.js` - Our primary reference for database patterns, API calls, and implementation logic since we share the same Supabase database.

---

## 📊 **Database Schema Reference**

Based on `client.js` analysis, we're using these existing Supabase tables:

### `key_phrases` Table

```sql
- id (uuid, primary key)
- user_id (uuid, foreign key to auth.users)
- key_phrase (text) -- Short trigger phrase (e.g., "hpi")
- full_text (text) -- Expanded text (e.g., "History of Present Illness:")
- created_at (timestamp)
```

### `patients` Table

```sql
- id (uuid, primary key)
- user_id (uuid, foreign key to auth.users)
- name (text)
- date_of_birth (date)
- chief_complaint (text)
- weight (text)
- created_at (timestamp)
- updated_at (timestamp)
```

### `notes` Table

```sql
- id (uuid, primary key)
- patient_id (uuid, foreign key to patients.id)
- user_id (uuid, foreign key to auth.users)
- note_type (text) -- 'soap', 'progress', 'mental_health', etc.
- content (text)
- created_at (timestamp)
```

---

## 🚀 **Phase 1: Keyphrases Implementation**

**Priority:** HIGH | **Risk:** LOW | **Reference:** `client.js:658-676, 5459-5572`

### **Reference Implementation Analysis**

From `client.js`, keyphrases work as follows:

- `keyPhraseMappings = {}` (line 659) - In-memory storage
- `fetchKeyPhraseMappings()` (line 5459) - Loads from Supabase
- `updateKeyPhraseList()` (line 2347) - Updates UI display
- Real-time expansion during transcription

### **Files to Create**

#### 1. `src/hooks/useKeyPhrases.tsx`

```typescript
// Pattern from client.js:5459-5480
export const useKeyPhrases = () => {
  const [keyPhrases, setKeyPhrases] = useState<KeyPhrase[]>([]);
  const [keyPhraseMappings, setKeyPhraseMappings] = useState<Record<string, string>>({});

  // Mirrors fetchKeyPhraseMappings() from client.js:5459
  const fetchKeyPhrases = async () => {
    const { data, error } = await supabase
      .from('key_phrases')
      .select('*')
      .eq('user_id', user.id);
    // Convert to mappings object like client.js:5472-5479
  };

  // Mirrors client.js pattern for CRUD operations
  const addKeyPhrase = async (keyPhrase: string, fullText: string) => { ... };
  const updateKeyPhrase = async (id: string, keyPhrase: string, fullText: string) => { ... };
  const deleteKeyPhrase = async (id: string) => { ... };

  return { keyPhrases, keyPhraseMappings, fetchKeyPhrases, addKeyPhrase, updateKeyPhrase, deleteKeyPhrase };
};
```

#### 2. `src/components/KeyPhraseManager.tsx`

```typescript
// UI pattern from client.js:2347-2408 (updateKeyPhraseList)
export const KeyPhraseManager = () => {
  const { keyPhrases, addKeyPhrase, updateKeyPhrase, deleteKeyPhrase } =
    useKeyPhrases();

  // Toggle functionality from client.js:665-676
  const [isExpanded, setIsExpanded] = useState(false);

  // CRUD UI similar to client.js implementation
  return (
    <div className="keyphrase-manager">
      <button onClick={() => setIsExpanded(!isExpanded)}>
        {isExpanded ? "-" : "+"} Keyphrases
      </button>
      {isExpanded && (
        <div className="keyphrase-container">{/* Add/Edit/Delete UI */}</div>
      )}
    </div>
  );
};
```

#### 3. Update Transcription Logic

```typescript
// In src/utils/scribeaiWebSocketUtils.ts
// Pattern from client.js real-time expansion logic
export const expandKeyPhrases = (
  text: string,
  keyPhraseMappings: Record<string, string>
) => {
  let expandedText = text;
  Object.entries(keyPhraseMappings).forEach(([keyPhrase, fullText]) => {
    const regex = new RegExp(`\\b${escapeRegExp(keyPhrase)}\\b`, "gi");
    expandedText = expandedText.replace(regex, fullText);
  });
  return expandedText;
};
```

### **Integration Points**

- Add KeyPhraseManager to encounter page
- Integrate expansion logic in WebSocket transcription handler
- Add keyphrase toggle to settings/preferences

---

## 👥 **Phase 2: Patient Management**

**Priority:** HIGH | **Risk:** MEDIUM | **Reference:** `client.js:3280-3393, 3153-3279`

### **Reference Implementation Analysis**

From `client.js`, patient management includes:

- `fetchPatientList(searchTerm)` (line 3280) - Search and filter patients
- `loadPatientIntoMainView(patientId)` (line 3393) - Load patient details
- `savePatientInfo(patientInfo)` (line 3153) - CRUD operations

### **Files to Create**

#### 1. `src/hooks/usePatients.tsx`

```typescript
// Pattern from client.js:3280-3393
export const usePatients = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Mirrors fetchPatientList from client.js:3280
  const fetchPatients = async (searchTerm = '') => {
    let query = supabase
      .from('patients')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (searchTerm) {
      query = query.ilike('name', `%${searchTerm}%`);
    }

    const { data, error } = await query;
    // Handle response like client.js:3300-3320
  };

  // Mirrors savePatientInfo from client.js:3153
  const savePatient = async (patientInfo: PatientInfo) => { ... };

  return { patients, selectedPatient, fetchPatients, savePatient, setSelectedPatient };
};
```

#### 2. `src/hooks/usePatientNotes.tsx`

```typescript
// Pattern for fetching patient notes (referenced in client.js)
export const usePatientNotes = (patientId: string) => {
  const [notes, setNotes] = useState<Note[]>([]);

  const fetchPatientNotes = async () => {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("patient_id", patientId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
  };

  return { notes, fetchPatientNotes };
};
```

#### 3. `src/components/PatientList.tsx`

```typescript
// UI pattern from mobile app screenshots + client.js logic
export const PatientList = () => {
  const { patients, fetchPatients } = usePatients();
  const [searchTerm, setSearchTerm] = useState("");

  // Debounced search like client.js:679-687
  const debouncedSearch = useCallback(
    debounce((term: string) => fetchPatients(term), 300),
    [fetchPatients]
  );

  return (
    <div className="patient-list">
      <div className="search-container">
        <input
          type="text"
          placeholder="Search patients"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            debouncedSearch(e.target.value);
          }}
        />
      </div>

      <div className="patients-grid">
        {patients.map((patient) => (
          <PatientCard key={patient.id} patient={patient} />
        ))}
      </div>
    </div>
  );
};
```

#### 4. `src/components/PatientDetail.tsx`

```typescript
// Pattern from client.js:3393-4318 (loadPatientIntoMainView)
export const PatientDetail = ({ patient }: { patient: Patient }) => {
  const { notes } = usePatientNotes(patient.id);

  return (
    <div className="patient-detail">
      <div className="patient-info">
        <h2>{patient.name}</h2>
        <p>DOB: {patient.date_of_birth}</p>
        <p>Chief Complaint: {patient.chief_complaint}</p>
      </div>

      <div className="patient-notes">
        <h3>Historical Notes</h3>
        {notes.map((note) => (
          <div key={note.id} className="note-card">
            <span className="note-type">{note.note_type}</span>
            <span className="note-date">{note.created_at}</span>
            <div className="note-content">{note.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### **Integration Points**

- Add patient selection to encounter workflow
- Create new patient creation flow
- Link generated notes to selected patient
- Add patient search functionality

---

## 🎨 **Phase 3: UI Design Updates**

**Priority:** MEDIUM | **Risk:** LOW | **Reference:** Mobile app screenshots

### **Design System Changes**

#### 1. Color Scheme Update (`tailwind.config.js`)

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          500: "#335df3", // Main blue from scribeai app (styles.css --blue)
          600: "#2b4fcc",
          700: "#1e3a8a",
        },
        green: "#68e095", // From styles.css --green
        grey: "#d9d9d9", // From styles.css --grey
        lightGrey: "#fafafa", // From styles.css --lightGrey
      },
    },
  },
};
```

#### 2. Global Styles Update (`src/globals.css`)

```css
/* Mobile app design language */
.btn-primary {
  @apply bg-primary-500 text-white px-6 py-3 rounded-lg font-medium;
}

.btn-secondary {
  @apply bg-white text-primary-500 border border-primary-500 px-6 py-3 rounded-lg font-medium;
}

.card {
  @apply bg-white rounded-lg shadow-sm border p-6;
}

/* Mobile-first responsive design */
@media (max-width: 768px) {
  .main-container {
    @apply px-4 py-4;
  }
}
```

#### 3. Header/Navigation Update (`src/components/Navbar.tsx`)

```typescript
// Design matching mobile app header
export const Navbar = () => {
  return (
    <nav className="bg-primary-500 text-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <img src="/logo.svg" alt="ScribeAI" className="h-8" />
          <span className="text-xl font-semibold">ScribeAI</span>
        </div>

        <button className="md:hidden">{/* Hamburger menu for mobile */}</button>
      </div>
    </nav>
  );
};
```

### **Components to Update**

- All button components → Match mobile design
- Input fields → Clean, minimal styling
- Cards/containers → Consistent spacing and shadows
- Navigation → Mobile-responsive menu
- Color scheme → Blue primary throughout

---

## 📝 **Implementation Schedule**

### **Week 1: Phase 1 - Keyphrases**

- Day 1-2: Create useKeyPhrases hook
- Day 3-4: Build KeyPhraseManager component
- Day 5: Integrate with transcription logic
- Day 6-7: Testing and refinement

### **Week 2: Phase 2 - Patient Management**

- Day 1-2: Create patient hooks (usePatients, usePatientNotes)
- Day 3-4: Build PatientList and PatientDetail components
- Day 5-6: Integrate with encounter workflow
- Day 7: Testing and data validation

### **Week 3: Phase 3 - UI Updates**

- Day 1-2: Update color scheme and design system
- Day 3-4: Redesign header and navigation
- Day 5-6: Update all components for consistency
- Day 7: Mobile responsiveness testing

---

## ✅ **Testing Strategy**

### **Database Testing**

- Verify keyphrases sync between VIM app and scribeai_api
- Test patient data consistency across both applications
- Validate note associations and historical data

### **Functionality Testing**

- Keyphrase expansion during transcription
- Patient search and selection
- Note generation and storage
- Cross-device responsiveness

### **Integration Testing**

- Authentication flow with existing system
- Supabase queries match client.js patterns
- Real-time features work consistently

---

## 🔄 **Reference Patterns from client.js**

### **Database Query Patterns**

```javascript
// From client.js:5459 - Key phrases fetch
const { data: keyPhrases, error } = await supabaseClient
  .from("key_phrases")
  .select("*")
  .eq("user_id", user.id);

// From client.js:3280 - Patient search
let query = supabaseClient
  .from("patients")
  .select("*")
  .eq("user_id", user.id)
  .order("created_at", { ascending: false });
```

### **Error Handling Patterns**

```javascript
// From client.js consistent error handling
if (error) {
  console.error("Error:", error);
  alert("An error occurred. Please try again.");
  return;
}
```

### **State Management Patterns**

```javascript
// From client.js global state management
window.currentPatientId = patientId;
window.fullTranscript = transcriptText;
```

---

## 🎯 **Success Criteria**

### **Phase 1 Complete When:**

- ✅ Keyphrases can be added, edited, deleted
- ✅ Real-time expansion works during transcription
- ✅ Data syncs with scribeai_api database

### **Phase 2 Complete When:**

- ✅ Patient list displays with search functionality
- ✅ Patient details and historical notes are viewable
- ✅ New encounters can be linked to patients
- ✅ Generated notes are saved to selected patient

### **Phase 3 Complete When:**

- ✅ UI matches mobile app design language
- ✅ Responsive design works on all devices
- ✅ All components use consistent styling
- ✅ User experience is smooth and professional

---

**Ready for Implementation!** 🚀

This plan provides comprehensive guidance while heavily referencing the proven patterns from `client.js`. Each phase builds upon the previous one, ensuring stable and consistent functionality across the shared database system.
