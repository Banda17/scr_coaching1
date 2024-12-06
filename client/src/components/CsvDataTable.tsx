import { useQuery } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Download } from "lucide-react";
import * as XLSX from 'xlsx';

interface CsvResponse {
  headers: string[];
  data: Record<string, string>[];
  recordCount: number;
}

type ApiError = {
  message: string;
  status?: number;
};

export default function CsvDataTable() {
  const defaultColumnCount = 5;
  const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQw-vgQw8H4RxYVHEsRr_0DPCZ4_M1PqR8kxvnxnxFp8nAYZnmqyYL9JVsXKHv6GmGqEGr_PvCyG2Hm/pub?output=csv'; // Replace with your actual CSV URL

  const { data: csvResponse, isLoading, error } = useQuery<CsvResponse, ApiError>({
    queryKey: ['csvData'],
    queryFn: async () => {
      const response = await fetch(csvUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch CSV data');
      }
      
      const csvText = await response.text();
      const rows = csvText.split('\n');
      const headers = rows[0].split(',').map(header => header.trim());
      
      const data = rows.slice(1)
        .filter(row => row.trim())
        .map(row => {
          const values = row.split(',').map(value => value.trim());
          return headers.reduce((obj, header, index) => {
            obj[header] = values[index] || '';
            return obj;
          }, {} as Record<string, string>);
        });

      return {
        headers,
        data,
        recordCount: data.length
      };
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const handleExport = () => {
    if (!csvResponse?.data) return;

    const ws = XLSX.utils.json_to_sheet(csvResponse.data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Train Schedule Data");
    XLSX.writeFile(wb, "train-schedule-data.xlsx");
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Live Train Schedule Data</CardTitle>
          {csvResponse?.data && csvResponse.data.length > 0 && (
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export to Excel
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error.message}
            </AlertDescription>
          </Alert>
        )}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                {isLoading ? (
                  [...Array(defaultColumnCount)].map((_, index) => (
                    <TableHead key={`loading-${index}`}>
                      <Skeleton className="h-4 w-[100px]" />
                    </TableHead>
                  ))
                ) : csvResponse?.headers ? (
                  csvResponse.headers.map((header, index) => (
                    <TableHead key={`header-${index}`}>{header}</TableHead>
                  ))
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, rowIndex) => (
                  <TableRow key={`loading-row-${rowIndex}`}>
                    <TableCell>
                      <Skeleton className="h-4 w-[30px]" />
                    </TableCell>
                    {[...Array(defaultColumnCount)].map((_, cellIndex) => (
                      <TableCell key={`loading-cell-${rowIndex}-${cellIndex}`}>
                        <Skeleton className="h-4 w-[100px]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : csvResponse?.data && csvResponse.headers ? (
                csvResponse.data.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    <TableCell className="font-medium">{rowIndex + 1}</TableCell>
                    {csvResponse.headers.map((header, colIndex) => (
                      <TableCell key={colIndex}>{row[header]}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell 
                    colSpan={csvResponse?.headers?.length ? csvResponse.headers.length + 1 : defaultColumnCount + 1}
                    className="text-center py-4 text-muted-foreground"
                  >
                    Loading train schedule data...
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {csvResponse && csvResponse.headers && (
          <div className="mt-4 flex justify-between items-center text-sm text-muted-foreground">
            <span>
              Loaded {csvResponse.recordCount.toString()} records with {csvResponse.headers.length.toString()} columns
            </span>
            <span>
              Last updated: {new Date().toLocaleTimeString()}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
