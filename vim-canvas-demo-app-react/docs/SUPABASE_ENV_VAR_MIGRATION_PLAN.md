# MIGRATION PLAN: Supabase Environment Variables

## 1. Current State Analysis

- **Environment Management**: A robust system exists at `src/config/env.ts`, handling both Vite (`import.meta.env`) and Node.js (`process.env`) environments.
- **`.env` File**: An `.env` file is already in use for other credentials.
- **Vite Configuration**: The `vite.config.ts` file is properly set up to manage environment variables.
- **Hardcoded Variables**: Supabase URL and anonymous key are currently hardcoded in `src/utils/supabase.ts`.

---

## 2. Variables to Migrate

The following values need to be extracted from `src/utils/supabase.ts` and moved into environment variables:

- **`SUPABASE_URL`**: `"https://kfdtyvcntmaopgfbuytb.supabase.co"`
- **`SUPABASE_ANON_KEY`**: `"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmZHR5dmNudG1hb3BnZmJ1eXRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyOTAzODQsImV4cCI6MjA1Njg2NjM4NH0.KaRU4o12cCPu1Tx3ESqzokxwv8XHcskqAgLgSs7M_so"`

---

## 3. Implementation Steps (Sequential)

### Step 1: Add Supabase Configuration to `src/config/env.ts`

- **Action**: Modify the environment configuration file to include the new Supabase variables.
- **Details**: Follow the existing pattern, using the `VITE_` prefix for client-side access.

### Step 2: Update `src/utils/supabase.ts`

- **Action**: Refactor the Supabase client initialization to use the newly defined environment variables.
- **Details**: Import `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `src/config/env.ts` and replace the hardcoded strings.

### Step 3: Add Supabase Variables to `.env` File

- **Action**: Update the local `.env` file with the Supabase credentials.
- **Details**: Use the current hardcoded values as defaults for local development.

### Step 4: Update `.env.example`

- **Action**: Add placeholder entries for the new Supabase variables to the example file.
- **Details**: This ensures that new developers know which environment variables are required.

### Step 5: Update `vite.config.ts`

- **Action**: Add the new Supabase variables to the `define` section of the Vite configuration.
- **Details**: This step is crucial for making the variables accessible in the bundled client-side code.

### Step 6: Document Heroku Configuration Variables

- **Action**: Create a record of the required environment variables for deployment.
- **Details**: List the new Supabase variables so they can be securely configured in Heroku.

---

## 4. Benefits of This Approach

- **Improved Local Development**: Simplifies testing against different Supabase instances.
- **Enhanced Security**: Eliminates hardcoded secrets from the codebase, aligning with best practices.
- **Deployment Consistency**: Ensures a clear and reliable process for setting up production and staging environments on Heroku.
- **Code Maintainability**: Follows the existing architectural patterns of the project.
