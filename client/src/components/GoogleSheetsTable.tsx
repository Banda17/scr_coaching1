import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export interface SheetData {
  trainNumber: string;
  type: string;
  status: string;
  from: string;
  to: string;
  scheduledDeparture: string;
  actualDeparture: string;
  scheduledArrival: string;
  actualArrival: string;
  lastUpdated: string;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

export default function GoogleSheetsTable() {
  const { data: sheetResponse, isLoading, error } = useQuery<{ success: boolean; timestamp: string; count: number; data: SheetData[] }, Error>({
    queryKey: ['sheetsData'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/sheets/data');
        console.log('[Sheets] Response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json() as ErrorResponse;
          throw new Error(errorData.error || 'Failed to fetch Google Sheets data');
        }
        
        const responseData = await response.json();
        console.log('[Sheets] Successfully fetched data:', { 
          timestamp: responseData.timestamp,
          count: responseData.count 
        });
        
        if (!responseData.success) {
          throw new Error('API returned unsuccessful response');
        }
        
        return responseData;
      } catch (err) {
        console.error('[Sheets] Error fetching data:', err);
        throw err instanceof Error ? err : new Error('Unknown error occurred');
      }
    },
    refetchInterval: 300000, // Refresh every 5 minutes
    staleTime: 240000, // Consider data stale after 4 minutes
  });

  const sheetData = sheetResponse?.data;

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-red-500">Error Loading Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Failed to load data from Google Sheets. Please try again later.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Train Schedule Data</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Train Number</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Scheduled Departure</TableHead>
                <TableHead>Actual Departure</TableHead>
                <TableHead>Scheduled Arrival</TableHead>
                <TableHead>Actual Arrival</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    {Array.from({ length: 10 }).map((_, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Skeleton className="h-4 w-[100px]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                sheetData?.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.trainNumber}</TableCell>
                    <TableCell>{row.type}</TableCell>
                    <TableCell>{row.status}</TableCell>
                    <TableCell>{row.from}</TableCell>
                    <TableCell>{row.to}</TableCell>
                    <TableCell>{row.scheduledDeparture}</TableCell>
                    <TableCell>{row.actualDeparture}</TableCell>
                    <TableCell>{row.scheduledArrival}</TableCell>
                    <TableCell>{row.actualArrival}</TableCell>
                    <TableCell>{row.lastUpdated}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
