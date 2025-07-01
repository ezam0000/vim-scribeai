import React from "react";
import { ResponsiveWrapper } from "./ResponsiveWrapper";
import { MobilePatientsList } from "./mobile/MobilePatientsList";
import { DesktopPatientsList } from "./desktop/DesktopPatientsList";
import { useAppSize } from "@/hooks/useAppSize";
import { useVimSizing } from "@/hooks/useVimSizing";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Monitor, Smartphone, Tablet } from "lucide-react";

// Expanded sample patient data for demo
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

export const SizingDemo: React.FC = () => {
  const { currentSize, isMobile, dimensions } = useAppSize();
  const { requestSize } = useVimSizing();

  const handlePatientSelect = (patient: any) => {
    console.log("Selected patient:", patient);
    // In a real app, this would navigate to the encounter
  };

  const handleSearch = (query: string) => {
    console.log("Search query:", query);
    // In a real app, this would filter the patients list
  };

  return (
    <div className="sizing-demo h-full flex flex-col">
      {/* Demo Controls Header */}
      <Card className="m-4">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Monitor className="h-5 w-5" />
            <span>VIM Responsive Sizing Demo</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Current Size Info */}
            <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                {isMobile ? (
                  <Smartphone className="h-4 w-4 text-blue-600" />
                ) : (
                  <Monitor className="h-4 w-4 text-blue-600" />
                )}
                <span className="font-medium">Current Size:</span>
                <span className="text-blue-600 font-semibold">
                  {currentSize}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                {dimensions.width}x{dimensions.height}px
              </div>
              <div className="text-sm text-gray-600">
                Mode: {isMobile ? "Mobile" : "Desktop"}
              </div>
            </div>

            {/* Size Control Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={currentSize === "CLASSIC" ? "default" : "outline"}
                size="sm"
                onClick={() => requestSize("CLASSIC")}
                className="flex items-center space-x-2"
              >
                <Smartphone className="h-4 w-4" />
                <span>CLASSIC (365px)</span>
              </Button>
              <Button
                variant={currentSize === "LARGE" ? "default" : "outline"}
                size="sm"
                onClick={() => requestSize("LARGE")}
                className="flex items-center space-x-2"
              >
                <Tablet className="h-4 w-4" />
                <span>LARGE (800px)</span>
              </Button>
              <Button
                variant={currentSize === "EXTRA_LARGE" ? "default" : "outline"}
                size="sm"
                onClick={() => requestSize("EXTRA_LARGE")}
                className="flex items-center space-x-2"
              >
                <Monitor className="h-4 w-4" />
                <span>EXTRA_LARGE (1350px)</span>
              </Button>
            </div>

            {/* Feature Matrix Display */}
            <div className="text-sm bg-blue-50 p-3 rounded-lg">
              <div className="font-medium text-blue-900 mb-2">
                Current View Features:
              </div>
              <div className="text-blue-700">
                {currentSize === "CLASSIC" && (
                  <ul className="list-disc list-inside space-y-1">
                    <li>Shows first 3 patients only</li>
                    <li>Simplified patient cards</li>
                    <li>Basic search</li>
                    <li>Single action button</li>
                  </ul>
                )}
                {currentSize === "LARGE" && (
                  <ul className="list-disc list-inside space-y-1">
                    <li>Table view with limited columns</li>
                    <li>Basic search only</li>
                    <li>No side panel</li>
                    <li>No advanced filters</li>
                  </ul>
                )}
                {currentSize === "EXTRA_LARGE" && (
                  <ul className="list-disc list-inside space-y-1">
                    <li>Full table with all columns</li>
                    <li>Advanced search & filters</li>
                    <li>Patient details side panel</li>
                    <li>Complete contact information</li>
                  </ul>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Responsive Patient List Demo */}
      <div className="flex-1 mx-4 mb-4">
        <ResponsiveWrapper
          mobileComponent={MobilePatientsList}
          desktopComponent={DesktopPatientsList}
          componentProps={{
            patients: samplePatients,
            onPatientSelect: handlePatientSelect,
            onSearch: handleSearch,
          }}
        />
      </div>
    </div>
  );
};
