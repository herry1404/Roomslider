const PDFDocument = require("pdfkit");
const cloudinary = require("../config/cloudinary");

function createReceiptPdf({ room, payment, tenantName }) {
  return new Promise((resolve, reject) => {
    const document = new PDFDocument({ size: "A4", margin: 52 });
    const chunks = [];
    document.on("data", (chunk) => chunks.push(chunk));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);

    document.fontSize(22).fillColor("#111827").text("RoomSlider", { continued: true });
    document.fontSize(12).fillColor("#64748b").text("  RENT RECEIPT", { align: "right" });
    document.moveDown(2);
    document.fontSize(11).fillColor("#334155");
    document.text(`Receipt ID: ${payment._id}`);
    document.text(`Date: ${new Date(payment.date).toLocaleDateString("en-IN")}`);
    document.moveDown();
    document.fontSize(14).fillColor("#111827").text("Payment received");
    document.moveDown(0.5);
    document.fontSize(11).fillColor("#334155");
    document.text(`Tenant: ${tenantName || room.currentTenant?.name || "Tenant"}`);
    document.text(`Property: ${room.title || "Room"}`);
    document.text(`Address: ${room.location || "—"}`);
    document.text(`Room: ${room.roomNumber || "—"}`);
    document.text(`Payment method: ${payment.method || "—"}`);
    document.moveDown();
    document.fontSize(16).fillColor("#047857").text(
      `Amount: INR ${Number(payment.amount || 0).toLocaleString("en-IN")}`
    );
    document.moveDown(2);
    document.fontSize(9).fillColor("#64748b").text(
      "This receipt confirms the rent payment recorded on RoomSlider."
    );
    document.end();
  });
}

async function uploadRentReceipt(room, payment, tenantName) {
  const buffer = await createReceiptPdf({ room, payment, tenantName });

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: "roomslider/rent-receipts",
        public_id: `${room._id}-${payment._id}.pdf`,
        overwrite: true,
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result?.secure_url) return reject(new Error("Receipt upload returned no URL"));
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

module.exports = { createReceiptPdf, uploadRentReceipt };
