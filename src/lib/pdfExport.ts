// Report PDF export functionality
export interface ReportData {
  name: string;
  type: string;
  generatedAt: string;
  filters: Record<string, any>;
  data: any[];
}

export const exportReportToPDF = async (reportData: ReportData): Promise<void> => {
  // Mock implementation - in production, use a library like jsPDF or similar
  return new Promise((resolve) => {
    setTimeout(() => {
      // Create a mock PDF blob
      const content = `
Report Name: ${reportData.name}
Type: ${reportData.type}
Generated: ${reportData.generatedAt}
Filters: ${JSON.stringify(reportData.filters, null, 2)}
Data: ${JSON.stringify(reportData.data, null, 2)}
      `.trim();

      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportData.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      resolve();
    }, 1000);
  });
};

// Application PDF export removed after pivot to DIMS/Avec.
export const exportApplicationToPDF = async () => {
  console.warn('exportApplicationToPDF: application export removed after pivot to DIMS');
  return;
};

