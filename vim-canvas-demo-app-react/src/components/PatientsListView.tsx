import React, { useState } from "react";
import { ResponsiveWrapper } from "./ResponsiveWrapper";
import { MobilePatientsList } from "./mobile/MobilePatientsList";
import { DesktopPatientsList } from "./desktop/DesktopPatientsList";
import { useAppSize } from "@/hooks/useAppSize";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { FileText, User } from "lucide-react";

// Sample patient data
const samplePatients = [
  {
    id: "1",
    name: "John Doe",
    dateOfBirth: "1985-03-15",
    lastVisit: "2024-01-15",
    status: "Active",
    phone: "(555) 123-4567",
    email: "john.doe@email.com",
  },
  {
    id: "2",
    name: "Jane Smith",
    dateOfBirth: "1990-07-22",
    lastVisit: "2024-01-10",
    status: "Active",
    phone: "(555) 987-6543",
    email: "jane.smith@email.com",
  },
  {
    id: "3",
    name: "Bob Johnson",
    dateOfBirth: "1978-11-03",
    lastVisit: "2023-12-20",
    status: "Inactive",
    phone: "(555) 456-7890",
    email: "bob.johnson@email.com",
  },
  {
    id: "4",
    name: "Alice Williams",
    dateOfBirth: "1992-05-18",
    lastVisit: "2024-01-12",
    status: "Active",
    phone: "(555) 234-5678",
    email: "alice.williams@email.com",
  },
  {
    id: "5",
    name: "Charlie Brown",
    dateOfBirth: "1980-09-30",
    lastVisit: "2024-01-08",
    status: "Active",
    phone: "(555) 345-6789",
    email: "charlie.brown@email.com",
  },
  {
    id: "6",
    name: "Diana Prince",
    dateOfBirth: "1988-12-12",
    lastVisit: "2023-12-15",
    status: "Active",
    phone: "(555) 567-8901",
    email: "diana.prince@email.com",
  },
  {
    id: "7",
    name: "Edward Norton",
    dateOfBirth: "1975-02-28",
    lastVisit: "2024-01-05",
    status: "Inactive",
    phone: "(555) 678-9012",
    email: "edward.norton@email.com",
  },
  {
    id: "8",
    name: "Fiona Green",
    dateOfBirth: "1995-08-14",
    lastVisit: "2024-01-18",
    status: "Active",
    phone: "(555) 789-0123",
    email: "fiona.green@email.com",
  },
];

// Sample notes for selected patient
const sampleNotes = [
  {
    id: "1",
    date: "2024-01-15",
    type: "SOAP Note",
    content:
      "Chief Complaint: Patient presents with upper respiratory symptoms...",
  },
  {
    id: "2",
    date: "2024-01-10",
    type: "Progress Note",
    content: "Follow-up visit for hypertension management...",
  },
];

export const PatientsListView: React.FC = () => {
  const { currentSize, isMobile } = useAppSize();
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  const handlePatientSelect = (patient: any) => {
    setSelectedPatient(patient);
  };

  const handleSearch = (query: string) => {
    console.log("Search query:", query);
    // In a real app, this would filter the patients list
  };

  // For mobile view, show full screen patients list or notes
  if (isMobile) {
    return (
      <div className="h-full">
        {selectedPatient ? (
          // Mobile: Show notes view
          <div className="h-full flex flex-col">
            <div className="p-4 border-b bg-gray-50">
              <button
                onClick={() => setSelectedPatient(null)}
                className="text-blue-600 hover:text-blue-800 mb-2"
              >
                ← Back to Patients
              </button>
              <h2 className="text-lg font-semibold">{selectedPatient.name}</h2>
              <p className="text-sm text-gray-600">
                DOB: {selectedPatient.dateOfBirth}
              </p>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                {sampleNotes.map((note) => (
                  <Card key={note.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-sm">{note.type}</CardTitle>
                        <span className="text-xs text-gray-500">
                          {note.date}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{note.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Mobile: Show patients list
          <ResponsiveWrapper
            mobileComponent={MobilePatientsList}
            desktopComponent={DesktopPatientsList}
          />
        )}
      </div>
    );
  }

  // Desktop view: Left-right layout
  return (
    <div className="h-full flex">
      {/* Left Column: Patients List */}
      <div
        className={`border-r bg-gray-50 overflow-y-auto ${
          currentSize === "CLASSIC"
            ? "w-full"
            : currentSize === "LARGE"
            ? "w-1/2"
            : "w-1/3"
        }`}
      >
        <ResponsiveWrapper
          mobileComponent={MobilePatientsList}
          desktopComponent={DesktopPatientsList}
        />
      </div>

      {/* Right Side: Notes/Content Area */}
      {currentSize !== "CLASSIC" && (
        <div className="flex-1 flex flex-col">
          {selectedPatient ? (
            <>
              {/* Patient Header */}
              <div className="p-4 border-b bg-white">
                <div className="flex items-center space-x-3">
                  <User className="h-6 w-6 text-gray-400" />
                  <div>
                    <h2 className="text-lg font-semibold">
                      {selectedPatient.name}
                    </h2>
                    <div className="flex space-x-4 text-sm text-gray-600">
                      <span>DOB: {selectedPatient.dateOfBirth}</span>
                      <span>Last Visit: {selectedPatient.lastVisit}</span>
                      <span>Status: {selectedPatient.status}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes Content */}
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <h3 className="text-lg font-medium">Clinical Notes</h3>
                  </div>

                  {sampleNotes.map((note) => (
                    <Card key={note.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-base">
                            {note.type}
                          </CardTitle>
                          <span className="text-sm text-gray-500">
                            {note.date}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm leading-relaxed">
                          {note.content}
                        </p>
                      </CardContent>
                    </Card>
                  ))}

                  {sampleNotes.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No notes available for this patient</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            // No patient selected
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Select a patient to view their notes</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
