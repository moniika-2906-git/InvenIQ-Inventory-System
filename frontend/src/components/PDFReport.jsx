import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function PDFReport({ summary, inventory, theme }) {
  const generatePDF = () => {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('en-IN');

    // ── Cover Page ──
    doc.setFillColor(26, 26, 46);
    doc.rect(0, 0, 210, 60, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Roquette SAP Inventory Report", 105, 28, { align: "center" });

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Rudrapur Plant | Generated on: " + today, 105, 42, { align: "center" });

    // ── Summary Section ──
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Executive Summary", 14, 75);

    // Summary boxes
    const summaryItems = [
      { label: "Total Items", value: summary.total_items, color: [67, 97, 238] },
      { label: "Low Stock Alerts", value: summary.low_stock_count, color: [230, 57, 70] },
      { label: "Total Value (INR)", value: `₹${(summary.total_stock_value).toLocaleString('en-IN')}`, color: [42, 157, 143] }
    ];

    summaryItems.forEach((item, i) => {
      const x = 14 + i * 65;
      doc.setFillColor(...item.color);
      doc.roundedRect(x, 82, 58, 28, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text(item.label, x + 29, 91, { align: "center" });
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text(String(item.value), x + 29, 103, { align: "center" });
    });

    // Health Score
    const score = Math.round(
      ((summary.total_items - summary.low_stock_count) / summary.total_items) * 100
    );
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Inventory Health Score: ${score}%`, 14, 122);

    // ── Category Breakdown ──
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Category Breakdown", 14, 135);

    const categoryData = Object.entries(summary.categories).map(([cat, count]) => [
      cat, count, `${Math.round((count / summary.total_items) * 100)}%`
    ]);

    autoTable(doc, {
      startY: 140,
      head: [["Category", "Items", "Percentage"]],
      body: categoryData,
      theme: "grid",
      headStyles: { fillColor: [26, 26, 46], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 255] },
      margin: { left: 14, right: 14 }
    });

    // ── Plant Breakdown ──
    const afterCategory = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Plant Wise Distribution", 14, afterCategory);

    const plantData = Object.entries(summary.plants).map(([plant, count]) => [
      plant, count, `${Math.round((count / summary.total_items) * 100)}%`
    ]);

    autoTable(doc, {
      startY: afterCategory + 5,
      head: [["Plant", "Items", "Percentage"]],
      body: plantData,
      theme: "grid",
      headStyles: { fillColor: [42, 157, 143], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 255, 253] },
      margin: { left: 14, right: 14 }
    });

    // ── New Page — Full Inventory ──
    doc.addPage();

    doc.setFillColor(26, 26, 46);
    doc.rect(0, 0, 210, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Complete Inventory List", 105, 13, { align: "center" });

    const inventoryData = inventory.map(item => [
      item.Material_ID,
      item.Description.substring(0, 22),
      item.Category,
      item.Stock_Qty,
      item.Min_Stock_Level,
      item.Plant,
      item.Low_Stock ? "⚠ Low" : "OK"
    ]);

    autoTable(doc, {
      startY: 25,
      head: [["ID", "Description", "Category", "Stock", "Min", "Plant", "Status"]],
      body: inventoryData,
      theme: "striped",
      headStyles: { fillColor: [26, 26, 46], textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 7.5 },
      alternateRowStyles: { fillColor: [248, 249, 255] },
      didParseCell: (data) => {
        if (data.column.index === 6 && data.cell.raw === "⚠ Low") {
          data.cell.styles.textColor = [230, 57, 70];
          data.cell.styles.fontStyle = "bold";
        }
      },
      margin: { left: 10, right: 10 }
    });

    // ── New Page — Low Stock Only ──
    doc.addPage();

    doc.setFillColor(230, 57, 70);
    doc.rect(0, 0, 210, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("⚠ Low Stock Alert Items", 105, 13, { align: "center" });

    const lowStockData = inventory
      .filter(i => i.Low_Stock)
      .map(item => [
        item.Material_ID,
        item.Description,
        item.Stock_Qty,
        item.Min_Stock_Level,
        item.Min_Stock_Level - item.Stock_Qty,
        item.Plant,
        item.Supplier
      ]);

    autoTable(doc, {
      startY: 25,
      head: [["ID", "Description", "Stock", "Min Level", "Shortage", "Plant", "Supplier"]],
      body: lowStockData,
      theme: "grid",
      headStyles: { fillColor: [230, 57, 70], textColor: 255 },
      bodyStyles: { textColor: [50, 50, 50] },
      alternateRowStyles: { fillColor: [255, 245, 245] },
      margin: { left: 10, right: 10 }
    });

    // ── Footer on all pages ──
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Roquette SAP Dashboard | Page ${i} of ${pageCount} | ${today}`,
        105, 290, { align: "center" }
      );
    }

    doc.save(`Roquette_Inventory_Report_${today}.pdf`);
  };

  return (
    <button
      onClick={generatePDF}
      style={{
        background: "#e63946", color: "white",
        border: "none", padding: "10px 20px",
        borderRadius: "8px", cursor: "pointer",
        fontWeight: "600", fontSize: "0.95rem"
      }}
    >
      📄 Export PDF
    </button>
  );
}

export default PDFReport;