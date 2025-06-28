import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, User, Calendar, MoreHorizontal } from "lucide-react";
import { SizeAwareNotification } from "../SizeAwareNotification";

interface Patient {
  id: string;
  name: string;
  dateOfBirth?: string;
  lastVisit?: string;
  status?: string;
}

interface MobilePatientsListProps {
  patients?: Patient[];
  onPatientSelect?: (patient: Patient) => void;
  onSearch?: (query: string) => void;
}

export const MobilePatientsList: React.FC<MobilePatientsListProps> = ({
  patients = [],
  onPatientSelect,
  onSearch,
}) => {
  // Show only first 3 patients in mobile view to emphasize limitation
  const limitedPatients = patients.slice(0, 3);
  const hasMorePatients = patients.length > 3;

  return (
    <div className="mobile-patients-list h-full flex flex-col">
      {/* Size-aware notification */}
      <div className="p-4 pb-0">
        <SizeAwareNotification context="patients_list" />
      </div>

      {/* Mobile Search Header */}
      <div className="p-4 border-b bg-white sticky top-0 z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Quick search..."
            className="pl-10 h-12 text-base"
            onChange={(e) => onSearch?.(e.target.value)}
          />
        </div>
      </div>

      {/* Mobile Patient Cards - Limited View */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {limitedPatients.map((patient) => (
          <Card
            key={patient.id}
            className="cursor-pointer hover:shadow-md transition-shadow border border-gray-200"
            onClick={() => onPatientSelect?.(patient)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base truncate">
                    {patient.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {patient.status || "Active"}
                  </p>
                </div>
                <MoreHorizontal className="h-4 w-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Simplified info for mobile */}
              <div className="space-y-1">
                {patient.lastVisit && (
                  <div className="text-sm text-gray-600">
                    Last visit: {patient.lastVisit}
                  </div>
                )}
              </div>
              <div className="mt-3">
                <Button
                  variant="default"
                  size="sm"
                  className="w-full h-9 bg-[#335df3] hover:bg-[#2952e8]"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPatientSelect?.(patient);
                  }}
                >
                  Start Encounter
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Show "more patients" indicator */}
        {hasMorePatients && (
          <Card className="border-dashed border-2 border-gray-300 bg-gray-50">
            <CardContent className="p-6 text-center">
              <div className="text-gray-500">
                <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">
                  +{patients.length - 3} more patients
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Expand view to see all patients
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {patients.length === 0 && (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No patients found</p>
          </div>
        )}
      </div>
    </div>
  );
};
