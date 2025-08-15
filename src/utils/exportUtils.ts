// src/utils/exportUtils.ts

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- TYPE DEFINITIONS ---
// FIX: Properties are marked as optional (?) to reflect that they might not exist in the API response.
// This makes our code more honest about the data it handles.
interface FinancialMetrics {
  total_sales?: number;
  total_expenses?: number;
  net_profit?: number;
  profit_margin?: number;
}

interface TopSellingItem {
  item_name?: string;
  quantity_sold?: number;
  total_revenue?: number;
}

interface Analytics {
  financial_metrics?: FinancialMetrics; // Also marked as optional for safety.
  top_selling?: TopSellingItem[];
}


/**
 * Generates and downloads a PDF report from analytics data.
 * @param analytics The analytics data object from the API.
 * @param timeRange A string describing the time period (e.g., "Last 30 Days").
 */
export const exportToPDF = (analytics: Analytics, timeRange: string) => {
  const doc = new jsPDF();
  
  // --- Header ---
  doc.setFontSize(20);
  doc.text('Business Analytics Report', 20, 20);
  
  doc.setFontSize(12);
  doc.text(`Period: ${timeRange}`, 20, 35);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 45);
  
  // --- Financial Metrics Section ---
  doc.setFontSize(16);
  doc.text('Financial Overview', 20, 65);
  
  // FIX: This section now safely handles cases where `financial_metrics` or any of its properties are missing.
  // The Nullish Coalescing Operator (??) provides a default value of 0 if a property is null or undefined.
  const financialData = analytics.financial_metrics ? [
    ['Total Sales', `$${(analytics.financial_metrics.total_sales ?? 0).toLocaleString()}`],
    ['Total Expenses', `$${(analytics.financial_metrics.total_expenses ?? 0).toLocaleString()}`],
    ['Net Profit', `$${(analytics.financial_metrics.net_profit ?? 0).toLocaleString()}`],
    ['Profit Margin', `${(analytics.financial_metrics.profit_margin ?? 0).toFixed(1)}%`]
  ] : [
    // Provide a fallback if the entire financial_metrics object is missing.
    ['Total Sales', 'N/A'],
    ['Total Expenses', 'N/A'],
    ['Net Profit', 'N/A'],
    ['Profit Margin', 'N/A']
  ];
  
  autoTable(doc, {
    startY: 75,
    head: [['Metric', 'Value']],
    body: financialData,
    theme: 'grid'
  });
  
  // --- Top Selling Products Section ---
  // A helper interface to access jspdf-autotable's specific properties on the doc object.
  interface JsPDFWithAutoTable extends jsPDF {
    lastAutoTable?: { finalY?: number };
  }
  const docWithAutoTable = doc as JsPDFWithAutoTable;

  // Calculate the starting position for the next table.
  const yPosition = docWithAutoTable.lastAutoTable?.finalY ? docWithAutoTable.lastAutoTable.finalY + 20 : 150; // Fallback Y
  doc.setFontSize(16);
  doc.text('Top Selling Products', 20, yPosition);
  
  // FIX: This is the most critical fix. It now safely handles incomplete items within the `top_selling` array.
  // We check each property of `item` before trying to use it.
  const topSellingData = analytics.top_selling?.map((item: TopSellingItem) => [
    item?.item_name ?? 'N/A',                      // Use 'N/A' if item_name is missing
    (item?.quantity_sold ?? 0).toString(),         // Use 0 if quantity_sold is missing
    `$${(item?.total_revenue ?? 0).toLocaleString()}` // Use 0 if total_revenue is missing
  ]) || []; // If the entire top_selling array is missing, default to an empty array.
  
  autoTable(doc, {
    startY: yPosition + 10,
    head: [['Product', 'Quantity Sold', 'Revenue']],
    body: topSellingData,
    theme: 'grid'
  });
  
  // --- Save the Document ---
  doc.save(`business-report-${new Date().toISOString().split('T')[0]}.pdf`);
};


/**
 * Generates and downloads a CSV file from an array of objects.
 * @param data The array of data to export.
 * @param filename The desired filename for the downloaded file.
 */
export const exportToCSV = (data: Record<string, unknown>[], filename: string) => {
  if (!data || data.length === 0) {
    alert('No data to export.');
    return;
  }
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle values that might contain commas by wrapping them in quotes.
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      }).join(',')
    )
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};