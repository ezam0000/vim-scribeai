# Supabase Architecture and Data Storage Plan

## 1. Overview

This document outlines the plan for storing transcriptions and generated notes from the `vim-canvas-demo-app-react` application in Supabase. It also clarifies the Supabase project architecture for both the VIM and Healthie applications.

## 2. Supabase Project Strategy

To maintain clarity and separation of concerns while simplifying development, we will adopt the following strategy:

- **Authentication Project**: The **ScribeAI Staging** project (`kfdtyvcntmaopgfbuytb`) will serve as the central authentication provider for _both_ `vim-canvas-demo-app-react` and `ScribeAIHealthie`. This is the current setup and allows for a single user base across applications.
- **Data Storage Project**: For simplicity and to avoid managing multiple Supabase client instances within the same application, all application data will also be stored in the **ScribeAI Staging** project.

### Data Isolation

Data for each application will be isolated at the table level:

- **`ScribeAIHealthie`**: Uses the existing `healthie_encounters` table.
- **`vim-canvas-demo-app-react`**: Will use a new `vim_encounters` table.

This approach avoids architectural complexity and leverages the existing, working Supabase connection for both authentication and data operations.

## 3. Proposed Database Schema for VIM Encounters

I will create a new table named `vim_encounters` in the **ScribeAI Staging** Supabase project.

### `vim_encounters` Table Schema

| Column Name           | Data Type     | Constraints                              | Description                               |
| --------------------- | ------------- | ---------------------------------------- | ----------------------------------------- |
| `id`                  | `uuid`        | Primary Key, `gen_random_uuid()` default | Unique identifier for the encounter row.  |
| `user_id`             | `uuid`        | Foreign Key to `auth.users(id)`          | Links to the authenticated user.          |
| `encounter_id`        | `text`        |                                          | The VIM-specific encounter ID.            |
| `patient_id`          | `text`        |                                          | The VIM-specific patient ID.              |
| `transcript_content`  | `text`        |                                          | Stores the raw transcription text.        |
| `transcript_metadata` | `jsonb`       |                                          | Metadata for the transcription.           |
| `note_content`        | `text`        |                                          | Stores the generated SOAP note content.   |
| `note_metadata`       | `jsonb`       |                                          | Metadata for the generated note.          |
| `created_at`          | `timestamptz` | Not Null, `now()` default                | Timestamp of when the record was created. |
| `updated_at`          | `timestamptz` | Not Null, `now()` default                | Timestamp of the last update.             |

## 4. Implementation Plan

1.  **Create Migration**: I will provide the SQL script to create the `vim_encounters` table and set up row-level security policies.
2.  **Create Utility Functions**: A new file, `src/utils/vimEncounterUtils.ts`, will be created. It will contain functions to `create`, `update`, and `get` encounter data from the `vim_encounters` table, mirroring the logic in `ScribeAIHealthie`'s `healthieNotesUtils.ts`.
3.  **Integrate into UI**: The new utility functions will be integrated with the `NoteGenerator` and other relevant components to automatically save transcription and note data to Supabase when generated or updated.
