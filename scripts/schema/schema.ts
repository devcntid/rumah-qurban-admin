import {
  bigserial,
  bigint,
  boolean,
  date,
  decimal,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const branches = pgTable(
  "branches",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    coaCode: varchar("coa_code", { length: 50 }),
    address: text("address"),
    isActive: boolean("is_active").default(true),
  },
  (t) => [uniqueIndex("branches_name_uniq").on(t.name)]
);

export const vendors = pgTable(
  "vendors",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    location: text("location"),
  },
  (t) => [uniqueIndex("vendors_name_uniq").on(t.name)]
);

export const salesAgents = pgTable(
  "sales_agents",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    category: varchar("category", { length: 50 }).notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [uniqueIndex("sales_agents_name_uniq").on(t.name)]
);

export const animalVariants = pgTable("animal_variants", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  species: varchar("species", { length: 50 }).notNull(),
  classGrade: varchar("class_grade", { length: 10 }),
  weightRange: varchar("weight_range", { length: 50 }),
  description: text("description"),
});

export const paymentMethods = pgTable("payment_methods", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  coaCode: varchar("coa_code", { length: 50 }),
  accountHolderName: varchar("account_holder_name", { length: 100 }),
  bankName: varchar("bank_name", { length: 100 }),
  accountNumber: varchar("account_number", { length: 50 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const paymentInstructions = pgTable(
  "payment_instructions",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    paymentMethodCode: varchar("payment_method_code", { length: 50 })
      .notNull()
      .references(() => paymentMethods.code, { onDelete: "cascade" }),
    channel: varchar("channel", { length: 50 }).notNull(),
    instructionSteps: text("instruction_steps").notNull(),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [
    uniqueIndex("payment_instructions_method_channel_uniq").on(
      t.paymentMethodCode,
      t.channel
    ),
  ]
);

export const products = pgTable("products", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  requiresShipping: boolean("requires_shipping").default(false),
  coaCode: varchar("coa_code", { length: 50 }),
});

export const catalogOffers = pgTable(
  "catalog_offers",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    productId: bigint("product_id", { mode: "number" }).references(() => products.id),
    animalVariantId: bigint("animal_variant_id", { mode: "number" }).references(
      () => animalVariants.id
    ),
    branchId: bigint("branch_id", { mode: "number" }).references(() => branches.id),
    vendorId: bigint("vendor_id", { mode: "number" }).references(() => vendors.id),
    displayName: varchar("display_name", { length: 255 }).notNull(),
    subType: varchar("sub_type", { length: 50 }),
    skuCode: varchar("sku_code", { length: 50 }),
    projectedWeight: varchar("projected_weight", { length: 50 }),
    weightRange: varchar("weight_range", { length: 50 }),
    description: text("description"),
    price: numeric("price", { precision: 15, scale: 2 }).notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").default(true),
  },
  (t) => [
    index("idx_catalog_offers_branch").on(t.branchId),
    index("idx_catalog_offers_product").on(t.productId),
  ]
);

export const services = pgTable(
  "services",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    serviceType: varchar("service_type", { length: 50 }).notNull(),
    basePrice: numeric("base_price", { precision: 15, scale: 2 }).notNull(),
    branchId: bigint("branch_id", { mode: "number" }).references(() => branches.id),
    animalVariantId: bigint("animal_variant_id", { mode: "number" }).references(
      () => animalVariants.id
    ),
    coaCode: varchar("coa_code", { length: 50 }),
  },
  (t) => [index("idx_services_branch").on(t.branchId)]
);

export const salesTargets = pgTable(
  "sales_targets",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    branchId: bigint("branch_id", { mode: "number" })
      .notNull()
      .references(() => branches.id),
    year: integer("year").notNull(),
    season: varchar("season", { length: 50 }),
    species: varchar("species", { length: 50 }).notNull(),
    category: varchar("category", { length: 20 }).notNull(),
    targetEkor: integer("target_ekor").notNull().default(0),
    targetOmset: numeric("target_omset", { precision: 15, scale: 2 }).notNull().default("0"),
    targetHpp: numeric("target_hpp", { precision: 15, scale: 2 }).notNull().default("0"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => [
    uniqueIndex("sales_targets_branch_year_species_category_uniq").on(
      t.branchId,
      t.year,
      t.species,
      t.category
    ),
    index("idx_sales_targets_branch_year").on(t.branchId, t.year),
  ]
);

export const customers = pgTable(
  "customers",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    phoneNormalized: varchar("phone_normalized", { length: 20 }).notNull().unique(),
    name: varchar("name", { length: 150 }).notNull(),
    email: varchar("email", { length: 100 }),
    customerType: varchar("customer_type", { length: 10 }).default("B2C"),
    companyName: varchar("company_name", { length: 150 }),
    totalOrders: integer("total_orders").notNull().default(0),
    totalSpent: numeric("total_spent", { precision: 15, scale: 2 }).notNull().default("0"),
    firstOrderDate: timestamp("first_order_date"),
    lastOrderDate: timestamp("last_order_date"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => [
    uniqueIndex("customers_phone_normalized_uniq").on(t.phoneNormalized),
    index("idx_customers_last_order").on(t.lastOrderDate),
    index("idx_customers_total_spent").on(t.totalSpent),
  ]
);

export const orders = pgTable(
  "orders",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),
    branchId: bigint("branch_id", { mode: "number" }).references(() => branches.id),
    salesAgentId: bigint("sales_agent_id", { mode: "number" }).references(
      () => salesAgents.id
    ),
    customerId: bigint("customer_id", { mode: "number" }).references(() => customers.id),
    customerType: varchar("customer_type", { length: 10 }).default("B2C"),
    customerName: varchar("customer_name", { length: 150 }).notNull(),
    companyName: varchar("company_name", { length: 150 }),
    customerPhone: varchar("customer_phone", { length: 20 }),
    customerEmail: varchar("customer_email", { length: 100 }),
    deliveryAddress: text("delivery_address"),
    latitude: decimal("latitude", { precision: 10, scale: 8 }),
    longitude: decimal("longitude", { precision: 11, scale: 8 }),
    subtotal: numeric("subtotal", { precision: 15, scale: 2 }).notNull(),
    discount: numeric("discount", { precision: 15, scale: 2 }).default("0"),
    grandTotal: numeric("grand_total", { precision: 15, scale: 2 }).notNull(),
    dpPaid: numeric("dp_paid", { precision: 15, scale: 2 }).default("0"),
    remainingBalance: numeric("remaining_balance", { precision: 15, scale: 2 }).notNull(),
    status: varchar("status", { length: 50 }).default("PENDING"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [
    index("idx_orders_branch_id").on(t.branchId),
    index("idx_orders_customer_id").on(t.customerId),
  ]
);

export const orderItems = pgTable(
  "order_items",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    orderId: bigint("order_id", { mode: "number" })
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    itemType: varchar("item_type", { length: 20 }).notNull(),
    catalogOfferId: bigint("catalog_offer_id", { mode: "number" }).references(
      () => catalogOffers.id
    ),
    serviceId: bigint("service_id", { mode: "number" }).references(() => services.id),
    itemName: varchar("item_name", { length: 255 }).notNull(),
    quantity: integer("quantity").notNull().default(1),
    unitPrice: numeric("unit_price", { precision: 15, scale: 2 }).notNull(),
    totalPrice: numeric("total_price", { precision: 15, scale: 2 }).notNull(),
    coaCode: varchar("coa_code", { length: 50 }),
  },
  (t) => [
    index("idx_order_items_order_id").on(t.orderId),
    index("idx_order_items_catalog_offer_id").on(t.catalogOfferId),
    index("idx_order_items_service_id").on(t.serviceId),
  ]
);

export const orderParticipants = pgTable(
  "order_participants",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    orderItemId: bigint("order_item_id", { mode: "number" })
      .notNull()
      .references(() => orderItems.id, { onDelete: "cascade" }),
    participantName: varchar("participant_name", { length: 150 }).notNull(),
    fatherName: varchar("father_name", { length: 150 }),
  },
  (t) => [index("idx_order_participants_order_item_id").on(t.orderItemId)]
);

export const farmPens = pgTable(
  "farm_pens",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    branchId: bigint("branch_id", { mode: "number" }).references(() => branches.id),
    name: varchar("name", { length: 100 }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [uniqueIndex("farm_pens_name_branch_uniq").on(t.name, t.branchId)]
);

export const farmInventories = pgTable(
  "farm_inventories",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    generatedId: varchar("generated_id", { length: 50 }).notNull().unique(),
    farmAnimalId: varchar("farm_animal_id", { length: 50 }),
    eartagId: varchar("eartag_id", { length: 50 }).notNull().unique(),
    animalVariantId: bigint("animal_variant_id", { mode: "number" }).references(
      () => animalVariants.id
    ),
    branchId: bigint("branch_id", { mode: "number" }).references(() => branches.id),
    vendorId: bigint("vendor_id", { mode: "number" }).references(() => vendors.id),
    entryDate: date("entry_date"),
    acquisitionType: varchar("acquisition_type", { length: 50 }),
    initialProductType: varchar("initial_product_type", { length: 100 }),
    penId: bigint("pen_id", { mode: "number" }).references(() => farmPens.id),
    panName: varchar("pan_name", { length: 50 }),
    purchasePrice: numeric("purchase_price", { precision: 15, scale: 2 }),
    initialWeightSource: numeric("initial_weight_source", { precision: 10, scale: 2 }),
    pricePerKg: numeric("price_per_kg", { precision: 15, scale: 2 }),
    shippingCost: numeric("shipping_cost", { precision: 15, scale: 2 }),
    totalHpp: numeric("total_hpp", { precision: 15, scale: 2 }),
    hornType: varchar("horn_type", { length: 50 }),
    initialWeight: numeric("initial_weight", { precision: 10, scale: 2 }),
    initialType: varchar("initial_type", { length: 50 }),
    finalType: varchar("final_type", { length: 50 }),
    weightActual: numeric("weight_actual", { precision: 10, scale: 2 }),
    photoUrl: text("photo_url"),
    status: varchar("status", { length: 50 }).default("AVAILABLE"),
    orderItemId: bigint("order_item_id", { mode: "number" }).references(() => orderItems.id),
    exitDate: date("exit_date"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [
    index("idx_farm_inv_branch").on(t.branchId),
    index("idx_farm_inv_variant").on(t.animalVariantId),
    index("idx_farm_inv_status").on(t.status),
    index("idx_farm_inv_pen").on(t.penId),
    index("idx_farm_inv_farm_animal_id").on(t.farmAnimalId),
  ]
);

export const inventoryAllocations = pgTable(
  "inventory_allocations",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    orderItemId: bigint("order_item_id", { mode: "number" })
      .notNull()
      .references(() => orderItems.id, { onDelete: "cascade" }),
    farmInventoryId: bigint("farm_inventory_id", { mode: "number" })
      .notNull()
      .references(() => farmInventories.id, { onDelete: "cascade" }),
    allocatedAt: timestamp("allocated_at").defaultNow(),
  },
  (t) => [
    uniqueIndex("inventory_allocations_farm_inventory_id_uniq").on(t.farmInventoryId),
    index("idx_inventory_allocations_order_item").on(t.orderItemId),
  ]
);

export const animalTrackings = pgTable(
  "animal_trackings",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    farmInventoryId: bigint("farm_inventory_id", { mode: "number" })
      .notNull()
      .references(() => farmInventories.id, { onDelete: "cascade" }),
    milestone: varchar("milestone", { length: 50 }).notNull(),
    description: text("description"),
    locationLat: decimal("location_lat", { precision: 10, scale: 8 }),
    locationLng: decimal("location_lng", { precision: 11, scale: 8 }),
    mediaUrl: text("media_url"),
    loggedAt: timestamp("logged_at").defaultNow(),
  },
  (t) => [index("idx_animal_trackings_farm_inv").on(t.farmInventoryId)]
);

export const logisticsTrips = pgTable("logistics_trips", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  branchId: bigint("branch_id", { mode: "number" }).references(() => branches.id),
  vehiclePlate: varchar("vehicle_plate", { length: 20 }).notNull(),
  driverName: varchar("driver_name", { length: 100 }).notNull(),
  scheduledDate: date("scheduled_date").notNull(),
  status: varchar("status", { length: 50 }).default("PREPARING"),
});

export const deliveryManifests = pgTable(
  "delivery_manifests",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    tripId: bigint("trip_id", { mode: "number" })
      .notNull()
      .references(() => logisticsTrips.id, { onDelete: "cascade" }),
    farmInventoryId: bigint("farm_inventory_id", { mode: "number" }).references(
      () => farmInventories.id
    ),
    destinationAddress: text("destination_address"),
    destinationLat: decimal("destination_lat", { precision: 10, scale: 8 }),
    destinationLng: decimal("destination_lng", { precision: 11, scale: 8 }),
    deliveryStatus: varchar("delivery_status", { length: 50 }).default("PENDING"),
  },
  (t) => [index("idx_delivery_manifests_trip").on(t.tripId)]
);

export const transactions = pgTable(
  "transactions",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    orderId: bigint("order_id", { mode: "number" }).references(() => orders.id),
    paymentMethodCode: varchar("payment_method_code", { length: 50 }).references(
      () => paymentMethods.code
    ),
    transactionType: varchar("transaction_type", { length: 50 }).default("PELUNASAN"),
    amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
    vaNumber: varchar("va_number", { length: 50 }),
    qrCodeUrl: text("qr_code_url"),
    status: varchar("status", { length: 50 }).default("PENDING"),
    transactionDate: timestamp("transaction_date").defaultNow(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [index("idx_transactions_order_id").on(t.orderId)]
);

export const paymentReceipts = pgTable("payment_receipts", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  transactionId: bigint("transaction_id", { mode: "number" }).references(() => transactions.id),
  fileUrl: text("file_url").notNull(),
  status: varchar("status", { length: 50 }).default("PENDING"),
  verifierNotes: text("verifier_notes"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  verifiedAt: timestamp("verified_at"),
});

export const paymentLogs = pgTable(
  "payment_logs",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    transactionId: bigint("transaction_id", { mode: "number" })
      .notNull()
      .references(() => transactions.id, { onDelete: "cascade" }),
    referenceId: varchar("reference_id", { length: 100 }),
    logType: varchar("log_type", { length: 50 }),
    payload: jsonb("payload"),
    response: jsonb("response"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [
    index("idx_payment_logs_transaction_id").on(t.transactionId),
    index("idx_payment_logs_reference_id").on(t.referenceId),
  ]
);

export const notifTemplates = pgTable("notif_templates", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  templateText: text("template_text").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifLogs = pgTable(
  "notif_logs",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    orderId: bigint("order_id", { mode: "number" }).references(() => orders.id, {
      onDelete: "set null",
    }),
    templateId: bigint("template_id", { mode: "number" }).references(() => notifTemplates.id),
    targetNumber: varchar("target_number", { length: 20 }).notNull(),
    status: varchar("status", { length: 50 }).notNull(),
    payload: jsonb("payload"),
    providerResponse: jsonb("provider_response"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [
    index("idx_notif_logs_order_id").on(t.orderId),
    index("idx_notif_logs_target_number").on(t.targetNumber),
  ]
);

export const zainsLogs = pgTable("zains_logs", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  endpoint: varchar("endpoint", { length: 255 }).notNull(),
  method: varchar("method", { length: 10 }).notNull(),
  payload: jsonb("payload"),
  response: jsonb("response"),
  statusCode: integer("status_code"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const faqs = pgTable(
  "faqs",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    productId: bigint("product_id", { mode: "number" })
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    category: varchar("category", { length: 100 }).notNull(),
    question: text("question").notNull(),
    answer: text("answer").notNull(),
    displayOrder: integer("display_order").notNull().default(0),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => [
    index("idx_faqs_product_id").on(t.productId),
    index("idx_faqs_category").on(t.category),
    index("idx_faqs_active").on(t.isActive),
  ]
);

export const adminUsers = pgTable(
  "admin_users",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    email: varchar("email", { length: 100 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    fullName: varchar("full_name", { length: 150 }).notNull(),
    role: varchar("role", { length: 50 }).notNull(),
    branchId: bigint("branch_id", { mode: "number" }).references(() => branches.id),
    isActive: boolean("is_active").default(true),
    lastLoginAt: timestamp("last_login_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => [
    uniqueIndex("unique_idx_admin_users_email").on(t.email),
    index("idx_admin_users_branch").on(t.branchId),
    index("idx_admin_users_role").on(t.role),
  ]
);

export const slaughterRecords = pgTable(
  "slaughter_records",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    farmInventoryId: bigint("farm_inventory_id", { mode: "number" })
      .notNull()
      .references(() => farmInventories.id, { onDelete: "cascade" }),
    orderItemId: bigint("order_item_id", { mode: "number" })
      .notNull()
      .references(() => orderItems.id, { onDelete: "cascade" }),
    slaughteredAt: timestamp("slaughtered_at").notNull(),
    slaughterLocation: varchar("slaughter_location", { length: 255 }),
    slaughterLatitude: decimal("slaughter_latitude", { precision: 10, scale: 8 }),
    slaughterLongitude: decimal("slaughter_longitude", { precision: 11, scale: 8 }),
    documentationPhotos: jsonb("documentation_photos").default([]),
    certificateUrl: text("certificate_url"),
    notes: text("notes"),
    performedBy: varchar("performed_by", { length: 150 }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => [
    index("idx_slaughter_records_farm_inventory").on(t.farmInventoryId),
    index("idx_slaughter_records_order_item").on(t.orderItemId),
    index("idx_slaughter_records_date").on(t.slaughteredAt),
  ]
);
