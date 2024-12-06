import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import type { Schedule, Location } from "@db/schema";
import type { TrainType } from "@db/schema";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Train {
  id: number;
  trainNumber: string;
  type: TrainType;
  description: string | null;
}

interface ImportantStation {
  locationId: number;
  locationName: string;
  arrivalTime: string;
  departureTime: string;
}

type ScheduleWithRelations = Omit<Schedule, 'train' | 'trainId'> & {
  train?: Train;
  departureLocation?: Location;
  arrivalLocation?: Location;
  trainId: number | null;
  importantStations?: ImportantStation[];
};

export default function ExportButton() {
  const { toast } = useToast();
  const { data: schedules } = useQuery<ScheduleWithRelations[]>({
    queryKey: ['schedules'],
    queryFn: async () => {
      const response = await fetch('/api/schedules/export');
      if (!response.ok) {
        throw new Error('Failed to export schedules');
      }
      const result = await response.json();
      return result.data;
    }
  });

  const handleExportJSON = () => {
    if (!schedules) return;
    
    try {
      const exportData = schedules.map(schedule => ({
        trainId: schedule.trainId,
        trainNumber: schedule.train?.trainNumber,
        trainType: schedule.train?.type,
        trainDescription: schedule.train?.description,
        departureLocationId: schedule.departureLocationId,
        departureLocation: schedule.departureLocation?.name,
        departureCode: schedule.departureLocation?.code,
        arrivalLocationId: schedule.arrivalLocationId,
        arrivalLocation: schedule.arrivalLocation?.name,
        arrivalCode: schedule.arrivalLocation?.code,
        scheduledDeparture: new Date(schedule.scheduledDeparture).toISOString(),
        scheduledArrival: new Date(schedule.scheduledArrival).toISOString(),
        actualDeparture: schedule.actualDeparture ? new Date(schedule.actualDeparture).toISOString() : null,
        actualArrival: schedule.actualArrival ? new Date(schedule.actualArrival).toISOString() : null,
        status: schedule.status,
        isCancelled: schedule.isCancelled,
        runningDays: schedule.runningDays,
        effectiveStartDate: new Date(schedule.effectiveStartDate).toISOString(),
        effectiveEndDate: schedule.effectiveEndDate ? new Date(schedule.effectiveEndDate).toISOString() : null,
        attachDetails: schedule.attachTrainNumber ? {
          trainNumber: schedule.attachTrainNumber,
          time: schedule.attachTime ? new Date(schedule.attachTime).toISOString() : null,
          status: schedule.attachStatus,
          locationId: schedule.attachLocationId,
          locationName: schedule.departureLocation?.name
        } : null,
        detachDetails: schedule.detachLocationId ? {
          locationId: schedule.detachLocationId,
          locationName: schedule.arrivalLocation?.name
        } : null,
        importantStations: schedule.importantStations?.map(station => ({
          locationId: station.locationId,
          name: station.locationName,
          arrivalTime: new Date(station.arrivalTime).toISOString(),
          departureTime: new Date(station.departureTime).toISOString()
        })) || []
      }));
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      downloadFile(dataBlob, 'railway_schedules.json', 'application/json');
      
      toast({
        title: "Export successful",
        description: "Schedule data has been exported to JSON"
      });
    } catch (error) {
      handleExportError(error);
    }
  };

  const handleExportExcel = () => {
    if (!schedules) return;
    
    try {
      const exportData = schedules.map(schedule => ({
        'Train Number': schedule.train?.trainNumber || (schedule.trainId ? schedule.trainId.toString() : 'N/A'),
        'Train Type': schedule.train?.type || 'N/A',
        'Train Description': schedule.train?.description || 'N/A',
        'Departure Location': schedule.departureLocation?.name || '',
        'Departure Code': schedule.departureLocation?.code || '',
        'Arrival Location': schedule.arrivalLocation?.name || '',
        'Arrival Code': schedule.arrivalLocation?.code || '',
        'Scheduled Departure': new Date(schedule.scheduledDeparture).toLocaleString(),
        'Scheduled Arrival': new Date(schedule.scheduledArrival).toLocaleString(),
        'Actual Departure': schedule.actualDeparture ? new Date(schedule.actualDeparture).toLocaleString() : 'N/A',
        'Actual Arrival': schedule.actualArrival ? new Date(schedule.actualArrival).toLocaleString() : 'N/A',
        'Status': schedule.status,
        'Cancelled': schedule.isCancelled ? 'Yes' : 'No',
        'Running Days': schedule.runningDays.map((day, index) => 
          day ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][index] : ''
        ).filter(Boolean).join(', '),
        'Effective From': new Date(schedule.effectiveStartDate).toLocaleDateString(),
        'Effective Until': schedule.effectiveEndDate ? new Date(schedule.effectiveEndDate).toLocaleDateString() : 'N/A',
        'Attach Details': schedule.attachTrainNumber ? 
          `Train: ${schedule.attachTrainNumber} | Status: ${schedule.attachStatus || 'N/A'} | Location: ${schedule.departureLocation?.name || 'N/A'} | Time: ${schedule.attachTime ? new Date(schedule.attachTime).toLocaleString() : 'N/A'}` : 'N/A',
        'Detach Details': schedule.detachLocationId ?
          `Location: ${schedule.arrivalLocation?.name || 'N/A'} | Time: ${schedule.detachTime ? new Date(schedule.detachTime).toLocaleString() : 'N/A'}` : 'N/A',
        'Important Stations': schedule.importantStations?.map(station => 
          `${station.locationName}\nArr: ${new Date(station.arrivalTime).toLocaleString()}\nDep: ${new Date(station.departureTime).toLocaleString()}`
        ).join('\n---\n') || 'N/A'
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      const colWidths = [
        { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 12 },
        { wch: 20 }, { wch: 12 }, { wch: 22 }, { wch: 22 }, { wch: 12 },
        { wch: 10 }, { wch: 50 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
        { wch: 12 }, { wch: 22 }, { wch: 15 }, { wch: 22 }, { wch: 50 }
      ];
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, "Schedules");
      
      const excelBuffer = XLSX.write(wb, { 
        bookType: 'xlsx', 
        type: 'array',
        bookSST: false,
        compression: true
      });
      
      const dataBlob = new Blob(
        [excelBuffer], 
        { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      );
      
      downloadFile(
        dataBlob, 
        `railway_schedules_${new Date().toISOString().split('T')[0]}.xlsx`,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );

      toast({
        title: "Export successful",
        description: `${schedules.length} schedules exported to Excel successfully`
      });
    } catch (error) {
      handleExportError(error);
    }
  };

  const handleExportPDF = () => {
    if (!schedules) return;
    
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.width;
      doc.setFontSize(16);
      doc.text('Railway Operations Schedule Report', pageWidth / 2, 15, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth / 2, 22, { align: 'center' });

      const tableData = schedules.map(schedule => {
        const row = [
          schedule.train?.trainNumber || (schedule.trainId ? schedule.trainId.toString() : 'N/A'),
          `${schedule.departureLocation?.name || 'N/A'}\n(${schedule.departureLocation?.code || 'N/A'})`,
          `${schedule.arrivalLocation?.name || 'N/A'}\n(${schedule.arrivalLocation?.code || 'N/A'})`,
          `Sch: ${new Date(schedule.scheduledDeparture).toLocaleString()}\n${schedule.actualDeparture ? `Act: ${new Date(schedule.actualDeparture).toLocaleString()}` : ''}`,
          `Sch: ${new Date(schedule.scheduledArrival).toLocaleString()}\n${schedule.actualArrival ? `Act: ${new Date(schedule.actualArrival).toLocaleString()}` : ''}`,
          schedule.isCancelled ? 'Cancelled' : schedule.status,
          schedule.runningDays
            .map((day, index) => day ? ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][index] : '')
            .filter(Boolean)
            .join(', '),
          schedule.train?.type || 'N/A',
          schedule.attachTrainNumber ? 
            `Train: ${schedule.attachTrainNumber}\nStatus: ${schedule.attachStatus}\nTime: ${schedule.attachTime ? new Date(schedule.attachTime).toLocaleTimeString() : 'N/A'}` : 'N/A',
          schedule.detachLocationId ? schedule.arrivalLocation?.name || 'N/A' : 'N/A',
          schedule.importantStations?.map(station => 
            `${station.locationName}\nArr: ${new Date(station.arrivalTime).toLocaleString()}\nDep: ${new Date(station.departureTime).toLocaleString()}`
          ).join('\n---\n') || 'N/A'
        ];

        return row;
      });

      const tableOptions: UserOptions = {
        head: [['Train', 'From', 'To', 'Departure', 'Arrival', 'Status', 'Days', 'Type', 'Attach', 'Detach', 'Important Stations']],
        body: tableData,
        startY: 30,
        theme: 'grid',
        headStyles: { fillColor: [66, 66, 66] },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 20 },  // Train
          1: { cellWidth: 25 },  // From
          2: { cellWidth: 25 },  // To
          3: { cellWidth: 25 },  // Departure
          4: { cellWidth: 25 },  // Arrival
          5: { cellWidth: 15 },  // Status
          6: { cellWidth: 15 },  // Days
          7: { cellWidth: 15 },  // Type
          8: { cellWidth: 20 },  // Attach
          9: { cellWidth: 15 },  // Detach
          10: { cellWidth: 40 }  // Important Stations
        },
        didDrawPage: function(data) {
          doc.setFontSize(8);
          const pageNumber = doc.getNumberOfPages();
          doc.text(
            `Page ${pageNumber}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
          );
        }
      };

      autoTable(doc, tableOptions);
      doc.save('railway_schedules.pdf');

      toast({
        title: "Export successful",
        description: "Schedule data has been exported to PDF"
      });
    } catch (error) {
      handleExportError(error);
    }
  };

  const downloadFile = (blob: Blob, filename: string, mimeType: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportError = (error: unknown) => {
    toast({
      title: "Export failed",
      description: error instanceof Error ? error.message : "Failed to export schedule data",
      variant: "destructive"
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700">
          <Download className="mr-2 h-4 w-4" />
          Export Schedules
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={handleExportJSON}>
          Download as JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportExcel}>
          Download as Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPDF}>
          Download as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
