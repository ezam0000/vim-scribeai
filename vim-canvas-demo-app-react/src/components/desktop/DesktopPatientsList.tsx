import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, User, Calendar, Phone, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SizeAwareNotification } from "../SizeAwareNotification";
import { useAppSize } from "@/hooks/useAppSize";

interface Patient {
  id: string;
  name: string;
  dateOfBirth?: string;
  lastVisit?: string;
  status?: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface DesktopPatientsListProps {
  patients?: Patient[];
  onPatientSelect?: (patient: Patient) => void;
  onSearch?: (query: string) => void;
}

export const DesktopPatientsList: React.FC<DesktopPatientsListProps> = ({
  patients = [],
  onPatientSelect,
  onSearch,
}) => {
  const { currentSize } = useAppSize();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredPatients = patients.filter((patient) => {
    if (statusFilter === "all") return true;
    return patient.status?.toLowerCase() === statusFilter.toLowerCase();
  });

  const isLimitedView = currentSize === "LARGE";

  return (
    <div className="desktop-patients-list h-full flex">
      {/* Main Table Area */}
      <div className="flex-1 flex flex-col">
        {/* Size-aware notification */}
        <div className="p-6 pb-0">
          <SizeAwareNotification context="patients_list" />
        </div>

        {/* Desktop Header with Search and Filters */}
        <div className="p-6 border-b bg-white">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
            <Button
              variant="default"
              className="bg-[#335df3] hover:bg-[#2952e8]"
            >
              Add New Patient
            </Button>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={
                  isLimitedView
                    ? "Basic search..."
                    : "Search patients by name, phone, or email..."
                }
                className="pl-10"
                onChange={(e) => onSearch?.(e.target.value)}
              />
            </div>

            {!isLimitedView && (
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Patients</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Desktop Data Table */}
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient Name</TableHead>
                {!isLimitedView && <TableHead>Date of Birth</TableHead>}
                <TableHead>Last Visit</TableHead>
                <TableHead>Status</TableHead>
                {!isLimitedView && <TableHead>Contact</TableHead>}
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.map((patient) => (
                <TableRow
                  key={patient.id}
                  className={`cursor-pointer hover:bg-gray-50 ${
                    selectedPatient?.id === patient.id ? "bg-blue-50" : ""
                  }`}
                  onClick={() => setSelectedPatient(patient)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <span>{patient.name}</span>
                    </div>
                  </TableCell>
                  {!isLimitedView && (
                    <TableCell>{patient.dateOfBirth || "—"}</TableCell>
                  )}
                  <TableCell>{patient.lastVisit || "—"}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        patient.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {patient.status || "Active"}
                    </span>
                  </TableCell>
                  {!isLimitedView && (
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {patient.phone && (
                          <div className="flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            {patient.phone}
                          </div>
                        )}
                        {patient.email && (
                          <div className="flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {patient.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex space-x-2">
                      {!isLimitedView && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPatient(patient);
                          }}
                        >
                          View
                        </Button>
                      )}
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-[#335df3] hover:bg-[#2952e8]"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPatientSelect?.(patient);
                        }}
                      >
                        {isLimitedView ? "Select" : "Start Encounter"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredPatients.length === 0 && (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No patients found</p>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Side Panel for Patient Details - Only in EXTRA_LARGE */}
      {selectedPatient && !isLimitedView && (
        <div className="w-80 border-l bg-gray-50 p-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">{selectedPatient.name}</h3>
                  <p className="text-sm text-gray-500">
                    {selectedPatient.status || "Active"}
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedPatient.dateOfBirth && (
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="font-medium">DOB:</span>
                  <span className="ml-2">{selectedPatient.dateOfBirth}</span>
                </div>
              )}

              {selectedPatient.phone && (
                <div className="flex items-center text-sm">
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="font-medium">Phone:</span>
                  <span className="ml-2">{selectedPatient.phone}</span>
                </div>
              )}

              {selectedPatient.email && (
                <div className="flex items-center text-sm">
                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="font-medium">Email:</span>
                  <span className="ml-2">{selectedPatient.email}</span>
                </div>
              )}

              {selectedPatient.lastVisit && (
                <div className="text-sm">
                  <span className="font-medium">Last Visit:</span>
                  <span className="ml-2">{selectedPatient.lastVisit}</span>
                </div>
              )}

              <div className="pt-4 space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    // Handle view patient details
                  }}
                >
                  View Full Details
                </Button>
                <Button
                  variant="default"
                  className="w-full bg-[#335df3] hover:bg-[#2952e8]"
                  onClick={() => onPatientSelect?.(selectedPatient)}
                >
                  Start Encounter
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
