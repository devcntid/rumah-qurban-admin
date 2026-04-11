import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  Image, 
  Font 
} from "@react-pdf/renderer";
import { formatIDR, terbilang } from "@/lib/pdf/utils";

// Register fonts if needed, or use defaults
// For a premium look, we'd use custom fonts, but standard fonts are safer for initialization
// Font.register({ family: 'Inter', src: 'https://rsms.me/inter/font-files/Inter-Regular.woff2?v=3.19' });

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1e293b",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottom : 2,
    borderBottomColor: "#102a43",
    paddingBottom: 15,
    marginBottom: 20,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logo: {
    width: 150,
    height: 50,
    objectFit: "contain",
  },
  branchTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1e293b",
    marginTop: 1,
  },
  branchAddress: {
    fontSize: 8,
    color: "#64748b",
    maxWidth: 250,
    marginTop: 2,
    lineHeight: 1.2,
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#102a43",
    textAlign: "right",
  },
  invoiceInfo: {
    textAlign: "right",
    fontSize: 9,
    color: "#64748b",
    marginTop: 5,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#102a43",
    textTransform: "uppercase",
    borderBottom: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 3,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    marginBottom: 5,
  },
  label: {
    width: 100,
    color: "#64748b",
  },
  value: {
    flex: 1,
    fontWeight: "bold",
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#102a43",
    color: "white",
    padding: 8,
    borderRadius: 4,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: 1,
    borderBottomColor: "#f1f5f9",
    padding: 8,
    alignItems: "center",
  },
  cellNo: { width: "5%" },
  cellItem: { width: "50%" },
  cellQty: { width: "10%", textAlign: "center" },
  cellPrice: { width: "15%", textAlign: "right" },
  cellTotal: { width: "20%", textAlign: "right" },
  
  participantsTable: {
    marginLeft: 25,
    marginTop: 4,
    backgroundColor: "#f8fafc",
    padding: 6,
    borderRadius: 4,
  },
  participantRow: {
    fontSize: 8,
    color: "#475569",
    marginBottom: 2,
  },

  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  terbilangBox: {
    width: "60%",
    backgroundColor: "#f1f5f9",
    padding: 10,
    borderRadius: 8,
  },
  terbilangLabel: {
    fontSize: 7,
    textTransform: "uppercase",
    color: "#64748b",
    marginBottom: 4,
  },
  terbilangText: {
    fontSize: 10,
    fontWeight: "bold",
    fontStyle: "italic",
    color: "#102a43",
  },
  totalsBox: {
    width: "35%",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#102a43",
  },
  grandTotalValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#102a43",
  },
  
  footer: {
    marginTop: 50,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureBox: {
    width: 150,
    textAlign: "center",
  },
  signatureLine: {
    marginTop: 60,
    borderTop: 1,
    borderTopColor: "#1e293b",
    paddingTop: 5,
    fontWeight: "bold",
  },
  stamp: {
    position: "absolute",
    top: 10,
    left: 45,
    width: 60,
    height: 60,
    opacity: 0.1,
  }
});

interface InvoiceTemplateProps {
  order: any;
  items: any[];
  participants: any[];
  branch?: any;
  logoPath?: string;
}

export function InvoiceTemplate({ order, items, participants, branch, logoPath }: InvoiceTemplateProps) {
  const dateStr = new Date(order.createdAt).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            {logoPath ? (
              <Image src={logoPath} style={styles.logo} />
            ) : (
              <View style={{ width: 150, height: 50, backgroundColor: '#102a43', borderRadius: 8 }} />
            )}
            <View style={{ marginLeft: 15 }}>
              <Text style={styles.branchTitle}>{branch?.name || "Pusat Operasional"}</Text>
              <Text style={styles.branchAddress}>{branch?.address || "Jl. Pemuda No. 1, Indonesia"}</Text>
            </View>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>KWITANSI</Text>
            <Text style={styles.invoiceInfo}>{order.invoiceNumber}</Text>
            <Text style={styles.invoiceInfo}>{dateStr}</Text>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detail Pelanggan</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nama Pelanggan</Text>
            <Text style={styles.value}>: {order.customerName} {order.companyName ? `(${order.companyName})` : ""}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Telepon</Text>
            <Text style={styles.value}>: {order.customerPhone || "-"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Alamat Kirim</Text>
            <Text style={styles.value}>: {order.deliveryAddress || "-"}</Text>
          </View>
          {order.latitude && (
            <View style={styles.row}>
              <Text style={styles.label}>Koordinat</Text>
              <Text style={styles.value}>: {order.latitude}, {order.longitude}</Text>
            </View>
          )}
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.cellNo}>No</Text>
            <Text style={styles.cellItem}>Produk / Jasa</Text>
            <Text style={styles.cellQty}>Qty</Text>
            <Text style={styles.cellPrice}>Harga</Text>
            <Text style={styles.cellTotal}>Total</Text>
          </View>

          {items.map((item, index) => {
            const itemParticipants = participants.filter(p => p.orderItemId === item.id);
            return (
              <View key={item.id} wrap={false}>
                <View style={styles.tableRow}>
                  <Text style={styles.cellNo}>{index + 1}</Text>
                  <Text style={styles.cellItem}>{item.itemName}</Text>
                  <Text style={styles.cellQty}>{item.quantity}</Text>
                  <Text style={styles.cellPrice}>{formatIDR(item.unitPrice)}</Text>
                  <Text style={styles.cellTotal}>{formatIDR(item.totalPrice)}</Text>
                </View>
                {itemParticipants.length > 0 && (
                  <View style={styles.participantsTable}>
                    <Text style={{ fontSize: 7, color: '#94a3b8', marginBottom: 2 }}>NAMA PESERTA QURBAN:</Text>
                    {itemParticipants.map((p, pIdx) => (
                      <Text key={p.id} style={styles.participantRow}>
                        {pIdx + 1}. {p.participantName} {p.fatherName ? `bin/binti ${p.fatherName}` : ""}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Financial Summary */}
        <View style={styles.summaryContainer} wrap={false}>
          <View style={styles.terbilangBox}>
            <Text style={styles.terbilangLabel}>Terbilang</Text>
            <Text style={styles.terbilangText}># {terbilang(parseFloat(order.grandTotal)).toUpperCase()} RUPIAH #</Text>
          </View>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={{ color: '#64748b' }}>Subtotal</Text>
              <Text>{formatIDR(order.subtotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={{ color: '#64748b' }}>Diskon</Text>
              <Text>- {formatIDR(order.discount)}</Text>
            </View>
            <View style={[styles.totalRow, { marginTop: 5, borderTop: 1, borderTopColor: '#e2e8f0', paddingTop: 5 }]}>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={styles.grandTotalValue}>{formatIDR(order.grandTotal)}</Text>
            </View>
            <View style={[styles.totalRow, { marginTop: 5 }]}>
              <Text style={{ color: '#64748b', fontSize: 9 }}>Telah Dibayar (DP)</Text>
              <Text style={{ color: '#16a34a', fontWeight: 'bold' }}>{formatIDR(order.dpPaid)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={{ color: '#ef4444', fontSize: 9, fontWeight: 'bold' }}>Sisa Tagihan</Text>
              <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>{formatIDR(order.remainingBalance)}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} wrap={false}>
          <View style={{ width: '60%' }}>
            <Text style={{ color: '#64748b', fontSize: 8, marginBottom: 5 }}>CATATAN / BANK TRANSFER:</Text>
            <Text style={{ fontSize: 9 }}>- Mandiri: 131-00-11111-22-3 (Yayasan Rumah Qurban)</Text>
            <Text style={{ fontSize: 9 }}>- BCA: 008-222-333-1 (Rumah Qurban Solo)</Text>
            <Text style={{ fontSize: 8, color: '#94a3b8', marginTop: 10 }}>
              * Kwitansi ini sah jika pembayaran telah divalidasi oleh sistem Finance.
            </Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={{ fontSize: 9, color: '#64748b' }}>Adm. Rumah Qurban,</Text>
            <View style={styles.signatureLine}>
              <Text>SISTEM TERVALIDASI</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
