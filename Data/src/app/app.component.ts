import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface TableItem {
  key: string;
  value: string | number | null;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [CommonModule, HttpClientModule]
})
export class AppComponent {
  fileName: string = '';
  selectedFile: File | null = null;
  tableData: TableItem[] = [];
  isLoading: boolean = false;
  uploadComplete: boolean = false;
  errorMessage: string | null = null;

  constructor(private http: HttpClient) {}

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file && file.type === "application/pdf") {
      this.selectedFile = file;
      this.fileName = file.name;
      this.errorMessage = null;
      this.uploadComplete = false;
    } else {
      this.errorMessage = "Please upload a valid PDF file.";
      this.selectedFile = null;
      this.fileName = '';
    }
  }

  uploadFile() {
    if (!this.selectedFile) {
      this.errorMessage = "No file selected!";
      return;
    }
    this.isLoading = true;
    this.errorMessage = null;
    this.tableData = [];
    const formData = new FormData();
    formData.append("file", this.selectedFile);
    
    this.http.post<any>('http://10.70.9.95:8001/extract-data/', formData).subscribe({
      next: (response) => {
        console.log("File uploaded successfully:", response);
        if (response && response.data) {
          this.tableData = Object.entries(response.data).map(([key, value]) => ({
            key,
            value: this.formatValue(value)
          }));
          console.log("Formatted tableData:", this.tableData);
        } else {
          console.error("Unexpected response format:", response);
          this.errorMessage = "Server returned an unexpected response format.";
        }
        this.isLoading = false;
        this.uploadComplete = true;
        console.log("Upload successful!");
      },
      error: (error) => {
        console.error("Upload failed:", error);
        this.isLoading = false;
        this.uploadComplete = true;
        this.errorMessage = "Failed to upload file. Please try again later.";
        console.log("Upload failed!");
      }
    });
  }

  private formatValue(value: unknown): string | number | null {
    if (value === null || value === undefined) {
      return null;
    }
    if (typeof value === 'string' || typeof value === 'number') {
      return value;
    }
    return String(value);
  }

  downloadPDF() {
    const doc = new jsPDF();
    
    
    const tableData = this.tableData.map((item) => [item.key, item.value ?? ' ']);
    
    // Generate the PDF table
    autoTable(doc, {
      head: [['Field', 'Value']],
      body: tableData,
      startY: 20,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [67, 118, 230] }
    });
    
    
    const originalName = this.fileName.replace('.pdf', '');
    doc.save(`${originalName}_extracted_data.pdf`);
  }
  reUpload() {
    this.uploadComplete = false;
    this.selectedFile = null;
    this.fileName = '';
    this.tableData = [];
    this.errorMessage = null;
  }
}
