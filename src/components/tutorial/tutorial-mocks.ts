import type { QueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setTutorialRuntimeActive } from "./tutorial-runtime-state";

const TAG = "[TUTORIAL]";

// Mock IDs must be valid UUID v4 (8-4-4-4-12 hex, version "4", variant
// [89ab]). Detail-screen API validators run zod uuid checks before our
// mocked queryFn even sees the request — non-UUID strings like "tut-..."
// fail validation with "validation failed (uuid is expected)" and the
// detail screen renders "dados invalidos" instead of the mock data.
const id = (n: number) => {
  const pad8 = n.toString(16).padStart(8, "0");
  const pad12 = n.toString(16).padStart(12, "0");
  return `${pad8}-aaaa-4bbb-acac-${pad12}`;
};

const offset = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

const hours = (h: number) => {
  const d = new Date();
  d.setHours(d.getHours() + h);
  return d;
};

// ===========================================================================
// CUSTOMERS — multiple so the detail-screen deep-link by id resolves.
// ===========================================================================

const mockCustomerA = {
  id: id(101),
  fantasyName: "Cliente Demonstração Ltda",
  corporateName: "Cliente Demonstração LTDA",
  cnpj: "12.345.678/0001-00",
  email: "contato@demo.com.br",
  phones: ["44999990001"],
  tags: ["Demo", "Frota"],
  registrationStatus: "ACTIVE",
  stateRegistration: "ISENTO",
  logo: null,
  address: "Rua das Demonstrações, 100",
  addressNumber: "100",
  addressComplement: null,
  neighborhood: "Centro",
  city: "Ibiporã",
  state: "PR",
  zipCode: "86200-000",
};

const mockCustomerB = {
  id: id(102),
  fantasyName: "Frota Modelo S.A.",
  corporateName: "Frota Modelo SA",
  cnpj: "98.765.432/0001-11",
  email: "frota@modelo.com.br",
  phones: ["44988880002"],
  tags: ["Frota"],
  registrationStatus: "ACTIVE",
  stateRegistration: null,
  logo: null,
  address: "Av. Modelo, 200",
  addressNumber: "200",
  neighborhood: "Industrial",
  city: "Londrina",
  state: "PR",
  zipCode: "86000-000",
};

const mockCustomerC = {
  id: id(103),
  fantasyName: "Transportadora Tour",
  corporateName: "Transportadora Tour LTDA",
  cnpj: "11.222.333/0001-44",
  email: "operacoes@tour.com.br",
  phones: ["44977770003"],
  tags: ["Logística"],
  registrationStatus: "ACTIVE",
  stateRegistration: "1234567890",
  logo: null,
  address: "Rod. BR-369, KM 100",
  addressNumber: "S/N",
  neighborhood: "Zona Rural",
  city: "Cambé",
  state: "PR",
  zipCode: "86180-000",
};

export const mockCustomers = [mockCustomerA, mockCustomerB, mockCustomerC];
export const mockCustomer = mockCustomerA;

// ===========================================================================
// SECTORS
// ===========================================================================

export const mockSector = {
  id: id(201),
  name: "Produção",
  privileges: "PRODUCTION",
  leaderId: null,
  leader: null,
};

const mockSectorCommercial = {
  id: id(202),
  name: "Comercial",
  privileges: "COMMERCIAL",
  leaderId: null,
  leader: null,
};

export const mockSectors = [mockSector, mockSectorCommercial];

// ===========================================================================
// USERS / RESPONSIBLES
// ===========================================================================

const mockResponsibles: any[] = [
  {
    id: id(601),
    name: "Maria Líder Demo",
    role: "PRODUCTION_LEADER",
    phone: "44999990001",
    statusId: null,
    sectorId: mockSector.id,
    ledSector: mockSector,
  },
  {
    id: id(602),
    name: "João Comercial Demo",
    role: "COMMERCIAL",
    phone: "44988880002",
    statusId: null,
    sectorId: mockSectorCommercial.id,
    ledSector: null,
  },
];

const mockCreatedBy = {
  id: id(701),
  name: "Carlos Comercial Demo",
  role: "COMMERCIAL",
  ledSector: null,
  sectorId: mockSectorCommercial.id,
};

const mockAssignedTo = {
  id: id(702),
  name: "Pedro Pintor Demo",
  role: "PRODUCTION",
  ledSector: null,
  sectorId: mockSector.id,
};

// ===========================================================================
// PAINTS — brand, type, formulas, swatches
// ===========================================================================

// Brands mirror typical real-database entries (Suvinil / Lazzuril / PPG /
// Sherwin Williams are common in the production-paint space). Two
// brand records are enough to demo brand-grouping behaviour.
const mockPaintBrandSuvinil = { id: id(801), name: "Suvinil", description: "Tintas Suvinil" };
const mockPaintBrandLazzuril = { id: id(802), name: "Lazzuril", description: "Tintas Lazzuril Automotivas" };

export const mockPaintBrands = [mockPaintBrandSuvinil, mockPaintBrandLazzuril];

const mockPaintTypePoliester = {
  id: id(803),
  name: "Poliéster",
  needGround: true,
};
const mockPaintTypeFundo = {
  id: id(804),
  name: "Fundo Cinza",
  needGround: false,
};
const mockPaintTypeAcrilico = {
  id: id(805),
  name: "Acrílico",
  needGround: false,
};

// Aliases kept so existing references in this file don't break.
const mockPaintTypeBase = mockPaintTypePoliester;
const mockPaintTypeGround = mockPaintTypeFundo;
const mockPaintTypeSpecial = mockPaintTypeAcrilico;

// Brand aliases — keep existing identifiers working without renaming
// every reference site below.
const mockPaintBrandPremium = mockPaintBrandSuvinil;
const mockPaintBrandStandard = mockPaintBrandLazzuril;

export const mockPaintTypes = [mockPaintTypePoliester, mockPaintTypeFundo, mockPaintTypeAcrilico];

const mockPaintGroundBranco = {
  id: id(812),
  name: "Fundo Cinza Médio",
  code: "FND-GRY",
  hex: "#A8A8A8",
  finish: "MATTE",
  manufacturer: "SCANIA",
  paintType: mockPaintTypeGround,
  paintTypeId: mockPaintTypeGround.id,
  paintBrand: mockPaintBrandStandard,
  paintBrandId: mockPaintBrandStandard.id,
  colorOrder: 1,
  tags: ["primer"],
  formulas: [],
  paintGrounds: [],
};

const mockGeneralPaint = {
  id: id(810),
  name: "Branco Geada",
  code: "BRC-GEADA",
  hex: "#F5F5F5",
  finish: "SOLID",
  manufacturer: "SCANIA",
  paintType: mockPaintTypeBase,
  paintTypeId: mockPaintTypeBase.id,
  paintBrand: mockPaintBrandPremium,
  paintBrandId: mockPaintBrandPremium.id,
  colorOrder: 2,
  tags: ["frota", "destaque"],
  paintGrounds: [
    { id: id(811), groundPaint: mockPaintGroundBranco, groundPaintId: mockPaintGroundBranco.id },
  ],
  formulas: [
    {
      id: id(814),
      description: "Fórmula Padrão",
      density: 1.05,
      pricePerLiter: 89.9,
      components: [
        { id: id(815), name: "Base Branca", ratio: 92 },
        { id: id(816), name: "Pigmento Titânio", ratio: 6 },
        { id: id(817), name: "Aditivo", ratio: 2 },
      ],
    },
  ],
};

// Logo paints — match the Ankaa truck reference (green tones over white):
// a vibrant green "Ankaa Verde" for the star + body wave, and a deeper
// green outline used on the trailer detail strip.
const mockLogoPaintVerdeAnkaa = {
  id: id(820),
  name: "Verde Ankaa",
  code: "LOGO-VRD-ANKAA",
  hex: "#16A34A",
  finish: "SOLID",
  manufacturer: "SCANIA",
  paintType: mockPaintTypeAcrilico,
  paintTypeId: mockPaintTypeAcrilico.id,
  paintBrand: mockPaintBrandSuvinil,
  paintBrandId: mockPaintBrandSuvinil.id,
  colorOrder: 10,
  tags: ["logo", "marca"],
  paintGrounds: [],
  formulas: [],
};

const mockLogoPaintVerdeEscuro = {
  id: id(821),
  name: "Verde Floresta",
  code: "LOGO-VRD-FLOR",
  hex: "#15803D",
  finish: "SOLID",
  manufacturer: "SCANIA",
  paintType: mockPaintTypeAcrilico,
  paintTypeId: mockPaintTypeAcrilico.id,
  paintBrand: mockPaintBrandSuvinil,
  paintBrandId: mockPaintBrandSuvinil.id,
  colorOrder: 11,
  tags: ["logo", "marca", "detalhe"],
  paintGrounds: [],
  formulas: [],
};

const mockLogoPaintVerdeClaro = {
  id: id(822),
  name: "Verde Limão Claro",
  code: "LOGO-VRD-CLR",
  hex: "#86EFAC",
  finish: "SOLID",
  manufacturer: "SCANIA",
  paintType: mockPaintTypeAcrilico,
  paintTypeId: mockPaintTypeAcrilico.id,
  paintBrand: mockPaintBrandLazzuril,
  paintBrandId: mockPaintBrandLazzuril.id,
  colorOrder: 12,
  tags: ["logo", "detalhe"],
  paintGrounds: [],
  formulas: [],
};

// Aliases kept so any downstream reference (logoPaints, mockPaints, etc.)
// continues to resolve to a valid object.
const mockLogoPaintDourada = mockLogoPaintVerdeAnkaa;
const mockLogoPaintPreta = mockLogoPaintVerdeEscuro;

const mockLogoPaints = [
  mockLogoPaintVerdeAnkaa,
  mockLogoPaintVerdeEscuro,
  mockLogoPaintVerdeClaro,
];

const mockPaintAzulFrota = {
  id: id(401),
  name: "Azul Frota",
  code: "AZL-FROTA",
  hex: "#1565C0",
  finish: "SOLID",
  manufacturer: "VOLVO",
  paintType: mockPaintTypeBase,
  paintTypeId: mockPaintTypeBase.id,
  paintBrand: mockPaintBrandPremium,
  paintBrandId: mockPaintBrandPremium.id,
  colorOrder: 3,
  tags: ["frota"],
  paintGrounds: [],
  formulas: [],
};

const mockPaintBrancoBase = {
  id: id(402),
  name: "Branco Base",
  code: "BRC-BAS",
  hex: "#FAFAFA",
  finish: "SOLID",
  manufacturer: "VOLKSWAGEN",
  paintType: mockPaintTypeBase,
  paintTypeId: mockPaintTypeBase.id,
  paintBrand: mockPaintBrandStandard,
  paintBrandId: mockPaintBrandStandard.id,
  colorOrder: 4,
  tags: ["padrão"],
  paintGrounds: [],
  formulas: [],
};

const mockPaintVerdeMatte = {
  id: id(403),
  name: "Verde Militar Matte",
  code: "VRD-MIL",
  hex: "#3E5641",
  finish: "MATTE",
  manufacturer: "MERCEDES_BENZ",
  paintType: mockPaintTypeBase,
  paintTypeId: mockPaintTypeBase.id,
  paintBrand: mockPaintBrandPremium,
  paintBrandId: mockPaintBrandPremium.id,
  colorOrder: 5,
  tags: ["customização"],
  paintGrounds: [],
  formulas: [],
};

export const mockPaints = [
  mockGeneralPaint,
  mockLogoPaintDourada,
  mockLogoPaintPreta,
  mockPaintGroundBranco,
  mockPaintAzulFrota,
  mockPaintBrancoBase,
  mockPaintVerdeMatte,
];

export const mockPaintFormulas = mockGeneralPaint.formulas;

// ===========================================================================
// FILES — referenced by artworks / projects / observations / cuts
// ===========================================================================

const mkFile = (n: number, filename: string, mimetype: string, size: number) => ({
  id: id(n),
  filename,
  mimetype,
  size,
  thumbnail: null,
  path: `/uploads/demo/${filename}`,
  uploadedAt: offset(-2),
});

// The Ankaa truck render is bundled in /assets so the artworks gallery can
// show real artwork imagery instead of placeholder file icons. Each mock
// artwork file carries an `assetSource` that FileItem prefers over the
// remote thumbnail URL (which would 404 against the tutorial mock backend).
const mockArtworkAsset = require(
  "../../../assets/923e17f4-8b03-426d-a4a2-835faa659add.png"
);

const mockArtworkFiles = [
  { ...mkFile(831, "demo-layout-lateral-direita.png", "image/png", 2_048_000), assetSource: mockArtworkAsset },
  { ...mkFile(833, "demo-layout-tampa-traseira.png", "image/png", 1_450_000), assetSource: mockArtworkAsset },
  { ...mkFile(834, "demo-layout-frente.png", "image/png", 1_280_000), assetSource: mockArtworkAsset },
];

const mockBaseFiles = [
  mkFile(840, "demo-base-original.psd", "application/vnd.adobe.photoshop", 5_000_000),
  mkFile(841, "demo-base-vetorizada.ai", "application/postscript", 3_200_000),
];

const mockProjectFiles = [
  mkFile(850, "demo-projeto-final.ai", "application/postscript", 3_000_000),
  mkFile(851, "demo-orientacao-tecnica.pdf", "application/pdf", 850_000),
];

// Cuts use EPS vector files (the production-floor source format for vinyl
// and stencil cuts). Filenames describe the shape so the list reads as a
// real production batch instead of generic placeholders.
const mockCutFiles = [
  mkFile(901, "estrela-lateral.eps", "application/postscript", 480_000),
  mkFile(902, "logomarca-traseira.eps", "application/postscript", 520_000),
  mkFile(903, "numero-frota-001.eps", "application/postscript", 320_000),
  mkFile(904, "faixa-curva-lateral.eps", "application/postscript", 660_000),
  mkFile(905, "stencil-numeracao-direita.eps", "application/postscript", 410_000),
  mkFile(906, "logomarca-frente-pequena.eps", "application/postscript", 380_000),
];

const mockCheckinFiles = [
  mkFile(870, "checkin-lateral-direita.jpg", "image/jpeg", 1_800_000),
  mkFile(871, "checkin-lateral-esquerda.jpg", "image/jpeg", 1_850_000),
];

const mockCheckoutFiles = [
  mkFile(872, "checkout-pintura-finalizada.jpg", "image/jpeg", 2_100_000),
];

export const mockFiles = [
  ...mockArtworkFiles,
  ...mockBaseFiles,
  ...mockProjectFiles,
  ...mockCutFiles,
  ...mockCheckinFiles,
  ...mockCheckoutFiles,
];

// ===========================================================================
// SERVICE ORDERS — used both as task.serviceOrders[] and standalone list
// ===========================================================================

const mkSo = (
  i: number,
  description: string,
  status: string,
  type: string,
  position: number,
  taskRef: { id: string; name: string },
  extras: Partial<{
    statusOrder: number;
    startedAt: Date | null;
    finishedAt: Date | null;
    assignedTo: typeof mockAssignedTo | null;
    assignedToId: string | null;
    observation: string | null;
    checkinFiles: any[];
    checkoutFiles: any[];
  }> = {},
) => ({
  id: id(500 + i),
  description,
  status,
  statusOrder:
    extras.statusOrder ??
    (status === "PENDING" ? 1
      : status === "IN_PROGRESS" ? 2
      : status === "PAUSED" ? 3
      : status === "WAITING_APPROVE" ? 4
      : status === "COMPLETED" ? 5
      : 6),
  type,
  position,
  taskId: taskRef.id,
  task: taskRef,
  startedAt: extras.startedAt ?? (status === "IN_PROGRESS" ? offset(-2) : null),
  finishedAt: extras.finishedAt ?? (status === "COMPLETED" ? offset(-1) : null),
  assignedToId: extras.assignedToId ?? null,
  assignedTo: extras.assignedTo ?? null,
  observation: extras.observation ?? null,
  checkinFiles: extras.checkinFiles ?? [],
  checkoutFiles: extras.checkoutFiles ?? [],
  files: [],
  createdAt: offset(-3),
  updatedAt: offset(0),
});

// ===========================================================================
// TASKS — primary educational dataset
// ===========================================================================
// task[0]: fully-loaded production demo (every detail card has data)
// task[1]: WAITING_PRODUCTION (default cronograma filter shows it)
// task[2]: PREPARATION (different paint, different customer)
// task[3]: IN_PRODUCTION overdue (red "Atrasado" badge)
// task[4]: IN_PRODUCTION with partial commission
// task[5]: COMPLETED (for historico)
// task[6]: COMPLETED long-finished (for historico-concluidos)

const truckOf = (
  taskId: string,
  i: number,
  plate: string,
  model: string,
  manufacturer: string,
  category: string | null = null,
  implementType: string | null = null,
  spot: string | null = null,
  chassisNumber: string | null = null,
) => ({
  id: id(300 + i),
  taskId,
  plate,
  licensePlate: plate,
  model,
  manufacturer,
  category,
  implementType,
  garageSpot: spot,
  chassisNumber,
  leftSideLayout: null,
  rightSideLayout: null,
  backSideLayout: null,
});

const taskRef = (taskId: string, name: string) => ({ id: taskId, name });

// --- task[0] ---------------------------------------------------------------
const task0Id = id(1);
const task0Name = `${TAG} Caminhão Demo - Lateral Direita`;
const task0Ref = taskRef(task0Id, task0Name);

const task0ServiceOrders = [
  mkSo(1, "Pintura Geral", "IN_PROGRESS", "PRODUCTION", 0, task0Ref, {
    assignedTo: mockAssignedTo,
    assignedToId: mockAssignedTo.id,
    checkinFiles: mockCheckinFiles,
    checkoutFiles: mockCheckoutFiles,
  }),
  mkSo(2, "Aplicação de Logomarca", "PENDING", "PRODUCTION", 1, task0Ref, {
    observation: "Aguardar secagem completa da pintura geral antes de aplicar.",
  }),
  mkSo(3, "Orientação Comercial", "COMPLETED", "COMMERCIAL", 2, task0Ref, {
    assignedTo: mockResponsibles[1],
    assignedToId: mockResponsibles[1].id,
    finishedAt: offset(-5),
  }),
  mkSo(4, "Outros", "WAITING_APPROVE", "ARTWORK", 3, task0Ref, {
    observation: "Cliente solicitou aprovação do layout final antes da execução.",
  }),
];

const task0 = {
  id: task0Id,
  name: task0Name,
  status: "IN_PRODUCTION",
  statusOrder: 3,
  serialNumber: "DEMO-001",
  plate: "DEMO-1A23",
  details:
    "Tarefa de demonstração para o tutorial. Os dados são fictícios. Toda funcionalidade visível aqui também aparece em tarefas reais.",
  entryDate: offset(-3),
  startedAt: offset(-2),
  term: offset(7),
  forecastDate: offset(5),
  finishedAt: null,
  cleared: false,
  commission: "PARTIAL_COMMISSION",
  commissionOrder: 2,
  customerId: mockCustomerA.id,
  customer: mockCustomerA,
  sectorId: mockSector.id,
  sector: mockSector,
  paintId: mockGeneralPaint.id,
  paint: { id: mockGeneralPaint.id, name: mockGeneralPaint.name, hex: mockGeneralPaint.hex },
  truck: truckOf(
    task0Id,
    1,
    "DEMO-1A23",
    "Bitruck Demo",
    "SCANIA",
    "BITRUCK",
    "DRY_CARGO",
    "A-12",
    "9BWZZZ377VT004251",
  ),
  generalPainting: mockGeneralPaint,
  logoPaints: mockLogoPaints,
  artworks: mockArtworkFiles.slice(0, 2).map((file, i) => ({
    id: id(830 + i * 2),
    status: "APPROVED",
    file,
    fileId: file.id,
    taskId: task0Id,
  })),
  baseFiles: [],
  baseFileIds: [],
  projectFiles: [],
  projectFileIds: [],
  checkinFileIds: mockCheckinFiles.map((f) => f.id),
  checkinFiles: mockCheckinFiles,
  checkoutFileIds: mockCheckoutFiles.map((f) => f.id),
  checkoutFiles: mockCheckoutFiles,
  observation: {
    id: id(860),
    taskId: task0Id,
    description:
      "Vazamento de tinta na lateral direita próximo à roda — necessário lixar e refazer trecho. Logomarca da traseira ficou 3 cm fora da posição aprovada — reposicionar. Pequena falha de acabamento no canto superior do baú detectada na inspeção. Anexei fotos.",
    files: [mockArtworkFiles[2]],
    createdAt: offset(-1),
    updatedAt: offset(0),
  },
  services: task0ServiceOrders,
  serviceOrders: task0ServiceOrders,
  responsibles: mockResponsibles,
  responsibleIds: mockResponsibles.map((r) => r.id),
  createdBy: mockCreatedBy,
  createdById: mockCreatedBy.id,
  budgetIds: [],
  invoiceIds: [],
  receiptIds: [],
  bankSlipIds: [],
  reimbursementIds: [],
  reimbursementInvoiceIds: [],
  budgets: [],
  invoices: [],
  receipts: [],
  bankSlips: [],
  reimbursements: [],
  invoiceReimbursements: [],
  relatedTasks: [],
  relatedTo: [],
  bonuses: [],
  bonusDiscount: null,
  bonusDiscountId: null,
  quote: null,
  quoteId: null,
  forecastHistory: [
    {
      id: id(880),
      previousDate: offset(2),
      newDate: offset(5),
      reason: "Aguardando aprovação do layout pelo cliente",
      source: "MANUAL",
      changedBy: { id: mockResponsibles[0].id, name: mockResponsibles[0].name },
      createdAt: offset(-1),
    },
  ],
  createdAt: offset(-3),
  updatedAt: offset(0),
};

// --- task[1] ---------------------------------------------------------------
const task1Id = id(2);
const task1Name = `${TAG} Aguardando - Lateral Esquerda`;
const task1Ref = taskRef(task1Id, task1Name);

const task1 = {
  id: task1Id,
  name: task1Name,
  status: "WAITING_PRODUCTION",
  statusOrder: 2,
  serialNumber: "DEMO-002",
  plate: "DEMO-2B45",
  details: "Aguardando início. Próxima tarefa do dia.",
  entryDate: offset(-1),
  startedAt: null,
  term: offset(10),
  forecastDate: offset(8),
  finishedAt: null,
  cleared: false,
  commission: "NO_COMMISSION",
  commissionOrder: 1,
  customerId: mockCustomerB.id,
  customer: mockCustomerB,
  sectorId: mockSector.id,
  sector: mockSector,
  paintId: mockPaintAzulFrota.id,
  paint: { id: mockPaintAzulFrota.id, name: mockPaintAzulFrota.name, hex: mockPaintAzulFrota.hex },
  truck: truckOf(task1Id, 2, "DEMO-2B45", "Truck Frota", "VOLVO", "TRUCK", "DRY_CARGO", "B-04"),
  generalPainting: mockPaintAzulFrota,
  logoPaints: [mockLogoPaintDourada],
  artworks: [
    {
      id: id(835),
      status: "APPROVED",
      file: mkFile(836, "task1-layout-aprovado.png", "image/png", 1_320_000),
      fileId: id(836),
      taskId: task1Id,
    },
  ],
  baseFiles: [],
  baseFileIds: [],
  projectFiles: [],
  projectFileIds: [],
  checkinFiles: [],
  checkinFileIds: [],
  checkoutFiles: [],
  checkoutFileIds: [],
  observation: null,
  services: [mkSo(10, "Pintura Geral", "PENDING", "PRODUCTION", 0, task1Ref)],
  serviceOrders: [mkSo(10, "Pintura Geral", "PENDING", "PRODUCTION", 0, task1Ref)],
  responsibles: mockResponsibles,
  responsibleIds: mockResponsibles.map((r) => r.id),
  createdBy: mockCreatedBy,
  createdById: mockCreatedBy.id,
  budgets: [],
  invoices: [],
  receipts: [],
  forecastHistory: [],
  createdAt: offset(-1),
  updatedAt: offset(0),
};

// --- task[2] ---------------------------------------------------------------
const task2Id = id(3);
const task2Name = `${TAG} Em Preparação - Tampa Traseira`;
const task2Ref = taskRef(task2Id, task2Name);

const task2 = {
  id: task2Id,
  name: task2Name,
  status: "PREPARATION",
  statusOrder: 1,
  serialNumber: "DEMO-003",
  plate: "DEMO-3C67",
  details: "Veículo em preparação — desmontagem em andamento.",
  entryDate: offset(-2),
  startedAt: null,
  term: offset(5),
  forecastDate: offset(3),
  finishedAt: null,
  cleared: false,
  commission: "NO_COMMISSION",
  commissionOrder: 1,
  customerId: mockCustomerC.id,
  customer: mockCustomerC,
  sectorId: mockSector.id,
  sector: mockSector,
  paintId: mockPaintBrancoBase.id,
  paint: { id: mockPaintBrancoBase.id, name: mockPaintBrancoBase.name, hex: mockPaintBrancoBase.hex },
  truck: truckOf(task2Id, 3, "DEMO-3C67", "Carreta Tour", "MERCEDES_BENZ", "SEMI_TRAILER", "CURTAIN_SIDE", "C-02"),
  generalPainting: mockPaintBrancoBase,
  logoPaints: [],
  artworks: [],
  baseFiles: [],
  baseFileIds: [],
  projectFiles: [],
  projectFileIds: [],
  observation: null,
  services: [mkSo(20, "Recorte de Letras", "PENDING", "PRODUCTION", 0, task2Ref)],
  serviceOrders: [mkSo(20, "Recorte de Letras", "PENDING", "PRODUCTION", 0, task2Ref)],
  responsibles: mockResponsibles,
  responsibleIds: mockResponsibles.map((r) => r.id),
  createdBy: mockCreatedBy,
  createdById: mockCreatedBy.id,
  forecastHistory: [],
  createdAt: offset(-2),
  updatedAt: offset(0),
};

// --- task[3] ---------------------------------------------------------------
const task3Id = id(4);
const task3Name = `${TAG} Em Produção - ATRASADA`;
const task3Ref = taskRef(task3Id, task3Name);

const task3 = {
  id: task3Id,
  name: task3Name,
  status: "IN_PRODUCTION",
  statusOrder: 3,
  serialNumber: "DEMO-004",
  plate: "DEMO-4D89",
  details: "Tarefa atrasada — passou do prazo e demonstra o destaque vermelho.",
  entryDate: offset(-15),
  startedAt: offset(-12),
  term: offset(-3),
  forecastDate: offset(-1),
  finishedAt: null,
  cleared: false,
  commission: "FULL_COMMISSION",
  commissionOrder: 3,
  customerId: mockCustomerB.id,
  customer: mockCustomerB,
  sectorId: mockSector.id,
  sector: mockSector,
  paintId: mockPaintVerdeMatte.id,
  paint: { id: mockPaintVerdeMatte.id, name: mockPaintVerdeMatte.name, hex: mockPaintVerdeMatte.hex },
  truck: truckOf(task3Id, 4, "DEMO-4D89", "Truck Heavy", "VOLVO", "TRUCK", "TANK", "D-08"),
  generalPainting: mockPaintVerdeMatte,
  logoPaints: [mockLogoPaintPreta],
  artworks: [],
  baseFiles: [],
  baseFileIds: [],
  projectFiles: [],
  projectFileIds: [],
  observation: null,
  services: [mkSo(30, "Pintura Geral", "IN_PROGRESS", "PRODUCTION", 0, task3Ref)],
  serviceOrders: [mkSo(30, "Pintura Geral", "IN_PROGRESS", "PRODUCTION", 0, task3Ref)],
  responsibles: mockResponsibles,
  responsibleIds: mockResponsibles.map((r) => r.id),
  createdBy: mockCreatedBy,
  createdById: mockCreatedBy.id,
  forecastHistory: [],
  createdAt: offset(-15),
  updatedAt: offset(0),
};

// --- task[4] CLEARED ------------------------------------------------------
const task4Id = id(5);
const task4Name = `${TAG} Em Produção - LIBERADA`;
const task4Ref = taskRef(task4Id, task4Name);

const task4 = {
  id: task4Id,
  name: task4Name,
  status: "IN_PRODUCTION",
  statusOrder: 3,
  serialNumber: "DEMO-005",
  plate: "DEMO-5E12",
  details: "Cliente já liberou a tarefa — pode prosseguir sem aguardar aprovação.",
  entryDate: offset(-5),
  startedAt: offset(-3),
  term: offset(12),
  forecastDate: offset(10),
  finishedAt: null,
  cleared: true,
  commission: "FULL_COMMISSION",
  commissionOrder: 3,
  customerId: mockCustomerA.id,
  customer: mockCustomerA,
  sectorId: mockSector.id,
  sector: mockSector,
  paintId: mockGeneralPaint.id,
  paint: { id: mockGeneralPaint.id, name: mockGeneralPaint.name, hex: mockGeneralPaint.hex },
  truck: truckOf(task4Id, 5, "DEMO-5E12", "Bitruck Premium", "SCANIA", "BITRUCK", "DRY_CARGO", "E-01"),
  generalPainting: mockGeneralPaint,
  logoPaints: mockLogoPaints,
  artworks: [],
  baseFiles: [],
  baseFileIds: [],
  projectFiles: [],
  projectFileIds: [],
  observation: null,
  services: [mkSo(40, "Pintura Geral", "IN_PROGRESS", "PRODUCTION", 0, task4Ref)],
  serviceOrders: [mkSo(40, "Pintura Geral", "IN_PROGRESS", "PRODUCTION", 0, task4Ref)],
  responsibles: mockResponsibles,
  responsibleIds: mockResponsibles.map((r) => r.id),
  createdBy: mockCreatedBy,
  createdById: mockCreatedBy.id,
  forecastHistory: [],
  createdAt: offset(-5),
  updatedAt: offset(0),
};

// --- task[5] COMPLETED ----------------------------------------------------
const task5Id = id(50);
const task5Name = `${TAG} Tarefa Concluída - Reforma Modelo`;
const task5Ref = taskRef(task5Id, task5Name);

const task5 = {
  id: task5Id,
  name: task5Name,
  status: "COMPLETED",
  statusOrder: 4,
  serialNumber: "DEMO-COMP-001",
  plate: "DEMO-C001",
  details: "Tarefa concluída — referência para acompanhamento histórico.",
  entryDate: offset(-30),
  startedAt: offset(-25),
  term: offset(-5),
  forecastDate: offset(-7),
  finishedAt: offset(-5),
  cleared: true,
  commission: "FULL_COMMISSION",
  commissionOrder: 3,
  customerId: mockCustomerA.id,
  customer: mockCustomerA,
  sectorId: mockSector.id,
  sector: mockSector,
  paintId: mockGeneralPaint.id,
  paint: { id: mockGeneralPaint.id, name: mockGeneralPaint.name, hex: mockGeneralPaint.hex },
  truck: truckOf(task5Id, 6, "DEMO-C001", "Bitruck Antigo", "SCANIA", "BITRUCK", null, null),
  generalPainting: mockGeneralPaint,
  logoPaints: mockLogoPaints,
  artworks: mockArtworkFiles.slice(0, 1).map((file, i) => ({
    id: id(837 + i),
    status: "APPROVED",
    file,
    fileId: file.id,
    taskId: task5Id,
  })),
  baseFiles: [],
  baseFileIds: [],
  projectFiles: [],
  projectFileIds: [],
  observation: {
    id: id(861),
    taskId: task5Id,
    description: "Entrega realizada com inspeção do cliente. Sem observações pendentes.",
    files: [],
    createdAt: offset(-5),
    updatedAt: offset(-5),
  },
  services: [mkSo(50, "Pintura Geral", "COMPLETED", "PRODUCTION", 0, task5Ref, { finishedAt: offset(-6) })],
  serviceOrders: [mkSo(50, "Pintura Geral", "COMPLETED", "PRODUCTION", 0, task5Ref, { finishedAt: offset(-6) })],
  responsibles: mockResponsibles,
  responsibleIds: mockResponsibles.map((r) => r.id),
  createdBy: mockCreatedBy,
  createdById: mockCreatedBy.id,
  forecastHistory: [],
  createdAt: offset(-30),
  updatedAt: offset(-5),
};

// --- task[6] CANCELLED ----------------------------------------------------
const task6Id = id(60);
const task6Name = `${TAG} Tarefa Cancelada - Demo`;
const task6Ref = taskRef(task6Id, task6Name);

const task6 = {
  id: task6Id,
  name: task6Name,
  status: "CANCELLED",
  statusOrder: 5,
  serialNumber: "DEMO-CAN-001",
  plate: "DEMO-C999",
  details: "Cancelada a pedido do cliente.",
  entryDate: offset(-20),
  startedAt: null,
  term: offset(-10),
  forecastDate: null,
  finishedAt: null,
  cleared: false,
  commission: "NO_COMMISSION",
  commissionOrder: 1,
  customerId: mockCustomerC.id,
  customer: mockCustomerC,
  sectorId: mockSector.id,
  sector: mockSector,
  paintId: mockPaintBrancoBase.id,
  paint: { id: mockPaintBrancoBase.id, name: mockPaintBrancoBase.name, hex: mockPaintBrancoBase.hex },
  truck: truckOf(task6Id, 7, "DEMO-C999", "Truck Cancelado", "IVECO", "TRUCK", null, null),
  generalPainting: mockPaintBrancoBase,
  logoPaints: [],
  artworks: [],
  baseFiles: [],
  projectFiles: [],
  observation: null,
  services: [],
  serviceOrders: [],
  responsibles: [],
  responsibleIds: [],
  createdBy: mockCreatedBy,
  createdById: mockCreatedBy.id,
  forecastHistory: [],
  createdAt: offset(-20),
  updatedAt: offset(-15),
};

// --- task[7] PRAZO APERTADO (Em Produção + < 4h until deadline) ---------
// Triggers the YELLOW/ORANGE row background so the legenda-de-status step
// can demonstrate all four row colours (gray/green/yellow/red) at once.
const task7Id = id(7);
const task7Name = `${TAG} Em Produção - PRAZO APERTADO`;
const task7Ref = taskRef(task7Id, task7Name);

const task7 = {
  id: task7Id,
  name: task7Name,
  status: "IN_PRODUCTION",
  statusOrder: 3,
  serialNumber: "DEMO-007",
  plate: "DEMO-7G34",
  details: "Tarefa em produção com menos de 4 horas até o prazo.",
  entryDate: offset(-8),
  startedAt: offset(-6),
  // Deadline 3 hours from now — falls inside the <=4h yellow window in
  // getRowBackgroundColor (config/list/production/tasks.ts).
  term: hours(3),
  forecastDate: hours(2),
  finishedAt: null,
  cleared: true,
  commission: "PARTIAL_COMMISSION",
  commissionOrder: 2,
  customerId: mockCustomerB.id,
  customer: mockCustomerB,
  sectorId: mockSector.id,
  sector: mockSector,
  paintId: mockPaintVerdeMatte.id,
  paint: { id: mockPaintVerdeMatte.id, name: mockPaintVerdeMatte.name, hex: mockPaintVerdeMatte.hex },
  truck: truckOf(task7Id, 6, "DEMO-7G34", "Truck Urgente", "MERCEDES", "TRUCK", "DRY_CARGO", "G-04"),
  generalPainting: mockPaintVerdeMatte,
  logoPaints: [],
  artworks: [],
  baseFiles: [],
  baseFileIds: [],
  projectFiles: [],
  projectFileIds: [],
  observation: null,
  services: [mkSo(70, "Pintura Geral", "IN_PROGRESS", "PRODUCTION", 0, task7Ref)],
  serviceOrders: [mkSo(70, "Pintura Geral", "IN_PROGRESS", "PRODUCTION", 0, task7Ref)],
  responsibles: mockResponsibles,
  responsibleIds: mockResponsibles.map((r) => r.id),
  createdBy: mockCreatedBy,
  createdById: mockCreatedBy.id,
  forecastHistory: [],
  createdAt: offset(-8),
  updatedAt: offset(0),
};

export const mockTasks = [task0, task1, task2, task3, task4, task5, task6, task7];
export const mockCompletedTasks = [task5];

// All service orders flat list (for /producao/ordens-de-servico)
export const mockServiceOrders = [
  ...task0ServiceOrders,
  ...task1.serviceOrders,
  ...task2.serviceOrders,
  ...task3.serviceOrders,
  ...task4.serviceOrders,
  ...task5.serviceOrders,
];

// ===========================================================================
// CUTS — VINYL/STENCIL + diverse statuses + parent/child recut chain
// ===========================================================================

const mkCut = (
  n: number,
  type: "VINYL" | "STENCIL",
  origin: "PLAN" | "REQUEST",
  status: "PENDING" | "CUTTING" | "COMPLETED",
  fileRef: (typeof mockCutFiles)[number],
  taskObj: any,
  extras: Partial<{
    reason: "WRONG_APPLY" | "LOST" | "WRONG";
    parentCutId: string;
    startedAt: Date | null;
    completedAt: Date | null;
  }> = {},
) => ({
  id: id(n),
  type,
  origin,
  status,
  statusOrder: status === "PENDING" ? 1 : status === "CUTTING" ? 2 : 3,
  fileId: fileRef.id,
  file: fileRef,
  taskId: taskObj.id,
  task: { id: taskObj.id, name: taskObj.name, sectorId: taskObj.sectorId, sector: taskObj.sector, customer: taskObj.customer },
  reason: extras.reason ?? null,
  parentCutId: extras.parentCutId ?? null,
  parentCut: null,
  childCuts: [],
  startedAt: extras.startedAt ?? (status === "COMPLETED" ? offset(-1) : status === "CUTTING" ? offset(0) : null),
  completedAt: extras.completedAt ?? (status === "COMPLETED" ? offset(0) : null),
  createdAt: offset(-2),
  updatedAt: offset(0),
});

export const mockCuts = [
  mkCut(11, "VINYL", "PLAN", "PENDING", mockCutFiles[0], task0),
  mkCut(12, "VINYL", "PLAN", "CUTTING", mockCutFiles[1], task0),
  mkCut(13, "STENCIL", "PLAN", "COMPLETED", mockCutFiles[2], task0),
  mkCut(15, "VINYL", "REQUEST", "CUTTING", mockCutFiles[4], task1, { reason: "LOST" }),
  mkCut(16, "STENCIL", "PLAN", "COMPLETED", mockCutFiles[5], task1),
  mkCut(17, "VINYL", "PLAN", "PENDING", mockCutFiles[0], task2),
  mkCut(18, "VINYL", "REQUEST", "PENDING", mockCutFiles[1], task3, { reason: "WRONG", parentCutId: id(13) }),
];

// ===========================================================================
// OBSERVATIONS — diverse, some with files
// ===========================================================================

export const mockObservations = [
  {
    id: id(60),
    taskId: task0.id,
    description: "Vazado de tinta na lateral esquerda — necessário lixar e refazer 30cm.",
    task: { id: task0.id, name: task0.name, customer: task0.customer },
    files: mockArtworkFiles.slice(2, 3),
    createdAt: offset(-1),
    updatedAt: offset(0),
  },
  {
    id: id(61),
    taskId: task0.id,
    description: "Casca de laranja no acabamento do teto — repolir trecho central antes da próxima demão.",
    task: { id: task0.id, name: task0.name, customer: task0.customer },
    files: [],
    createdAt: offset(-2),
    updatedAt: offset(-1),
  },
  {
    id: id(62),
    taskId: task0.id,
    description: "Logomarca aplicada 5cm acima da posição aprovada — reposicionar com nova máscara.",
    task: { id: task0.id, name: task0.name, customer: task0.customer },
    files: [],
    createdAt: offset(-3),
    updatedAt: offset(-3),
  },
  {
    id: id(63),
    taskId: task1.id,
    description: "Sticker da porta direita com bolha de ar — reaplicar após limpeza do substrato.",
    task: { id: task1.id, name: task1.name, customer: task1.customer },
    files: [],
    createdAt: offset(-1),
    updatedAt: offset(0),
  },
  {
    id: id(64),
    taskId: task5.id,
    description: "Falha no contraste do verde detectada na inspeção final — checar tonalidade da próxima demão. Fotos anexadas.",
    task: { id: task5.id, name: task5.name, customer: task5.customer },
    files: mockCheckoutFiles,
    createdAt: offset(-5),
    updatedAt: offset(-5),
  },
  {
    id: id(65),
    taskId: task3.id,
    description: "Adesivo da traseira aplicado torto — reaplicar com nova máscara após lixamento leve.",
    task: { id: task3.id, name: task3.name, customer: task3.customer },
    files: [],
    createdAt: offset(-2),
    updatedAt: offset(0),
  },
];

// ===========================================================================
// AIRBRUSHINGS — valid AIRBRUSHING_STATUS values + variety
// ===========================================================================

export const mockAirbrushings = [
  {
    id: id(80),
    status: "PENDING",
    statusOrder: 1,
    price: 2500,
    taskId: task0.id,
    task: { id: task0.id, name: task0.name, customer: task0.customer },
    startDate: offset(-1),
    finishDate: null,
    artworks: [],
    receipts: [],
    invoices: [],
    observations: null,
    createdAt: offset(-1),
    updatedAt: offset(0),
  },
  {
    id: id(81),
    status: "IN_PRODUCTION",
    statusOrder: 2,
    price: 1800,
    taskId: task0.id,
    task: { id: task0.id, name: task0.name, customer: task0.customer },
    startDate: offset(-2),
    finishDate: null,
    artworks: mockArtworkFiles.slice(0, 1).map((file, i) => ({
      id: id(890 + i),
      status: "APPROVED",
      file,
      fileId: file.id,
    })),
    receipts: [],
    invoices: [],
    observations: "Aerografia frontal — referência aprovada.",
    createdAt: offset(-2),
    updatedAt: offset(0),
  },
  {
    id: id(82),
    status: "COMPLETED",
    statusOrder: 3,
    price: 3200,
    taskId: task5.id,
    task: { id: task5.id, name: task5.name, customer: task5.customer },
    startDate: offset(-10),
    finishDate: offset(-6),
    artworks: [],
    receipts: [],
    invoices: [],
    observations: null,
    createdAt: offset(-10),
    updatedAt: offset(-6),
  },
  {
    id: id(83),
    status: "CANCELLED",
    statusOrder: 4,
    price: 1500,
    taskId: task6.id,
    task: { id: task6.id, name: task6.name, customer: task6.customer },
    startDate: offset(-20),
    finishDate: null,
    artworks: [],
    receipts: [],
    invoices: [],
    observations: "Cancelada junto com a tarefa.",
    createdAt: offset(-20),
    updatedAt: offset(-15),
  },
];

// ===========================================================================
// NOTIFICATIONS — diverse types and read states
// ===========================================================================

export const mockNotifications = [
  {
    id: id(31),
    title: `${TAG} Nova tarefa atribuída`,
    body: "Você recebeu a tarefa Caminhão Demo - Lateral Direita.",
    type: "TASK_ASSIGNED",
    importance: "NORMAL",
    read: false,
    isSeenByUser: false,
    actionUrl: `/producao/tarefa/${task0.id}`,
    createdAt: offset(0),
  },
  {
    id: id(32),
    title: `${TAG} Recorte pronto`,
    body: "O recorte para Tampa Traseira está pronto para retirada.",
    type: "CUT_READY",
    importance: "NORMAL",
    read: false,
    isSeenByUser: false,
    actionUrl: "/producao/recorte",
    createdAt: offset(-1),
  },
  {
    id: id(33),
    title: `${TAG} Aviso da Liderança`,
    body: "Reunião rápida amanhã às 7h para alinhamento da semana.",
    type: "BROADCAST",
    importance: "HIGH",
    read: true,
    isSeenByUser: true,
    actionUrl: null,
    createdAt: offset(-2),
  },
  {
    id: id(34),
    title: `${TAG} Tarefa atrasada`,
    body: "A tarefa Em Produção - ATRASADA passou do prazo.",
    type: "TASK_OVERDUE",
    importance: "URGENT",
    read: false,
    isSeenByUser: false,
    actionUrl: `/producao/tarefa/${task3.id}`,
    createdAt: hours(-6),
  },
  {
    id: id(35),
    title: `${TAG} Nova mensagem da equipe`,
    body: "Confira o comunicado da diretoria.",
    type: "MESSAGE",
    importance: "NORMAL",
    read: true,
    isSeenByUser: true,
    actionUrl: "/pessoal/minhas-mensagens",
    createdAt: offset(-10),
  },
];

// ===========================================================================
// TRUCKS (derived)
// ===========================================================================

export const mockTrucks = mockTasks.map((t) => t.truck).filter(Boolean);

// ===========================================================================
// LAYOUTS — tied to task0's truck for the spotlight steps
// ===========================================================================

// Local bundled asset for the Ankaa truck render — used by the tutorial's
// task-detail layout step. The `assetSource` field is consumed by
// TruckLayoutPreview to render the Image directly from the bundled
// require() instead of fetching the photo by id from the backend.
const mockLayoutAnkaaAsset = require(
  "../../../assets/923e17f4-8b03-426d-a4a2-835faa659add.png"
);

export const mockLayoutAnkaaImage = {
  id: id(900),
  filename: "ankaa-truck-mockup.png",
  url: "tutorial://ankaa-truck",
  mimetype: "image/png",
  size: 524000,
  assetSource: mockLayoutAnkaaAsset,
};

export const mockLayouts = {
  truckId: task0.truck.id,
  taskId: task0.id,
  leftSideLayout: {
    id: id(901),
    truckId: task0.truck.id,
    height: 2.95,
    photoId: mockLayoutAnkaaImage.id,
    photo: mockLayoutAnkaaImage,
    layoutSections: [
      { id: id(910), layoutId: id(901), width: 4.0, position: 0 },
      { id: id(911), layoutId: id(901), width: 4.0, position: 1 },
      { id: id(912), layoutId: id(901), width: 4.2, position: 2 },
    ],
  },
  rightSideLayout: {
    id: id(902),
    truckId: task0.truck.id,
    height: 2.95,
    photoId: mockLayoutAnkaaImage.id,
    photo: mockLayoutAnkaaImage,
    layoutSections: [
      { id: id(920), layoutId: id(902), width: 4.0, position: 0 },
      { id: id(921), layoutId: id(902), width: 4.0, position: 1 },
      { id: id(922), layoutId: id(902), width: 4.2, position: 2 },
    ],
  },
  backSideLayout: {
    id: id(903),
    truckId: task0.truck.id,
    height: 2.95,
    photoId: mockLayoutAnkaaImage.id,
    photo: mockLayoutAnkaaImage,
    layoutSections: [
      { id: id(930), layoutId: id(903), width: 2.4, position: 0 },
    ],
  },
};

// ===========================================================================
// HOLIDAYS — current + future + a "Hoje" entry
// ===========================================================================

const todayISO = new Date().toISOString().split("T")[0];

export const mockHolidays = [
  {
    id: id(90),
    name: `${TAG} Comemoração de Hoje`,
    date: todayISO,
    type: "COMPANY",
    description: "Feriado interno fictício para demonstração.",
    createdAt: offset(-30),
    updatedAt: offset(-30),
  },
  {
    id: id(91),
    name: `${TAG} Feriado Nacional`,
    date: offset(7).toISOString().split("T")[0],
    type: "NATIONAL",
    description: "Feriado nacional próximo.",
    createdAt: offset(-30),
    updatedAt: offset(-30),
  },
  {
    id: id(92),
    name: `${TAG} Recesso de Demo`,
    date: offset(30).toISOString().split("T")[0],
    type: "COMPANY",
    description: "Recesso interno.",
    createdAt: offset(-30),
    updatedAt: offset(-30),
  },
];

// ───────────────────────────────────────────────────────────────────────
// Secullum ponto endpoints — mocks for the Justificar Ausência /
// Ajustar Ponto tutorial flow. These mirror the real backend shape so
// the existing screens render without any conditional rendering for
// tutorial mode.
// ───────────────────────────────────────────────────────────────────────

const formatYmdDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const weekdayPt = (d: Date) =>
  ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"][
    d.getDay()
  ];

// Three days without punches in the recent past so the user has obvious
// rows to tap on inside the Justificar Ausência screen.
export const mockSecullumMissingDays = [
  {
    date: formatYmdDate(offset(-3)),
    weekdayPt: weekdayPt(offset(-3)),
    saldo: "-08:00",
    totalFaltas: "01:00",
    existePeriodoEncerrado: false,
  },
  {
    date: formatYmdDate(offset(-8)),
    weekdayPt: weekdayPt(offset(-8)),
    saldo: "-08:00",
    totalFaltas: "01:00",
    existePeriodoEncerrado: false,
  },
  {
    date: formatYmdDate(offset(-14)),
    weekdayPt: weekdayPt(offset(-14)),
    saldo: "-04:00",
    totalFaltas: null,
    existePeriodoEncerrado: false,
  },
];

// Secullum justification list — these IDs match the real Secullum option
// set so the form's combobox shows real-looking choices.
export const mockSecullumJustificativas = [
  { id: 1, nomeCompleto: "Atestado Médico", exigirFotoAtestado: true, naoPermitirFuncionariosUtilizar: false },
  { id: 2, nomeCompleto: "Licença Paternidade", exigirFotoAtestado: false, naoPermitirFuncionariosUtilizar: false },
  { id: 3, nomeCompleto: "Licença Maternidade", exigirFotoAtestado: false, naoPermitirFuncionariosUtilizar: false },
  { id: 4, nomeCompleto: "Falta Justificada", exigirFotoAtestado: false, naoPermitirFuncionariosUtilizar: false },
  { id: 5, nomeCompleto: "Compensação de Banco de Horas", exigirFotoAtestado: false, naoPermitirFuncionariosUtilizar: false },
];

// One existing punch (entrada1) plus the rest empty so the Ajustar Ponto
// screen shows a partially-filled day the user can complete.
export const mockSecullumBatidasForDate = {
  entrada1: "07:30",
  saida1: null,
  entrada2: null,
  saida2: null,
  entrada3: null,
  saida3: null,
  entrada4: null,
  saida4: null,
  entrada5: null,
  saida5: null,
  existePeriodoEncerrado: false,
};

// No previous solicitação — the absence form should render fresh.
export const mockSecullumSolicitacao = null;

// ===========================================================================
// PPE DELIVERIES — every status the UI knows about
// ===========================================================================

const ppeItem = (n: number, name: string, category: string) => ({
  id: id(n),
  name,
  brand: { id: id(n + 1), name: "Marca Demo" },
  category: { id: id(n + 2), name: category },
});

export const mockPpeDeliveries = [
  {
    id: id(110),
    status: "DELIVERED",
    statusOrder: 3,
    quantity: 1,
    deliveryDate: offset(-15),
    scheduledDate: offset(-15),
    item: ppeItem(111, "Bota de Segurança Cano Médio", "EPI - Calçados"),
    ppeSchedule: null,
    reviewedByUser: null,
    signature: null,
    ppeSize: { id: id(118), size: "42" },
    createdAt: offset(-15),
    updatedAt: offset(-15),
  },
  {
    id: id(120),
    status: "PENDING",
    statusOrder: 1,
    quantity: 1,
    item: ppeItem(121, "Luva Nitrílica", "EPI - Mãos"),
    ppeSchedule: null,
    reviewedByUser: null,
    ppeSize: { id: id(128), size: "M" },
    createdAt: offset(-2),
    updatedAt: offset(-2),
  },
  {
    id: id(130),
    status: "WAITING_SIGNATURE",
    statusOrder: 4,
    quantity: 1,
    item: ppeItem(131, "Óculos de Proteção", "EPI - Visão"),
    ppeSchedule: null,
    reviewedByUser: null,
    ppeSize: { id: id(138), size: "Único" },
    createdAt: offset(-1),
    updatedAt: hours(-3),
  },
  {
    id: id(140),
    status: "APPROVED",
    statusOrder: 2,
    quantity: 2,
    item: ppeItem(141, "Avental Industrial", "EPI - Corpo"),
    ppeSchedule: null,
    reviewedByUser: null,
    ppeSize: { id: id(148), size: "G" },
    createdAt: offset(-3),
    updatedAt: offset(-2),
  },
];

// ===========================================================================
// MESSAGES
// ===========================================================================

// Each message uses the mobile message-block format the transformer
// understands: `paragraph` blocks with `content: [{text: "..."}]` (mobile
// InlineText format) and proper `list` blocks with `items: [{content:[...]}]`.
// TipTap-style `bulletList`/`listItem` and `{type:"text",text:"..."}` nodes
// would silently render as empty paragraphs.
export const mockMyMessages = [
  {
    id: id(150),
    title: `${TAG} Novo procedimento de inspeção`,
    subject: "Novo procedimento de inspeção",
    content: [
      {
        type: "heading",
        level: 3,
        content: [{ text: "Dupla inspeção em acabamento" }],
      },
      {
        type: "paragraph",
        content: [
          {
            text: "A partir desta semana, toda tarefa em fase de acabamento deve passar por dupla inspeção antes de ser liberada para o cliente.",
          },
        ],
      },
      {
        type: "paragraph",
        content: [{ text: "Etapas do novo procedimento:", styles: ["bold"] }],
      },
      {
        type: "list",
        ordered: true,
        items: [
          { content: [{ text: "Inspeção visual pelo pintor responsável." }] },
          { content: [{ text: "Conferência cruzada pelo líder de produção." }] },
          { content: [{ text: "Registro fotográfico anexado ao check-out." }] },
        ],
      },
      { type: "divider", style: "solid" },
      {
        type: "paragraph",
        content: [
          { text: "Dúvidas? Falar diretamente com a ", },
          { text: "liderança do setor", styles: ["bold"] },
          { text: "." },
        ],
      },
    ],
    createdAt: offset(-1),
    publishedAt: offset(-1),
    viewedAt: null,
    dismissedAt: null,
  },
  {
    id: id(151),
    title: `${TAG} Aniversariantes do mês`,
    subject: "Aniversariantes do mês",
    content: [
      {
        type: "heading",
        level: 3,
        content: [{ text: "🎉 Aniversariantes do mês" }],
      },
      {
        type: "paragraph",
        content: [
          {
            text: "Parabéns aos colegas que celebram aniversário neste mês! Vamos comemorar juntos:",
          },
        ],
      },
      {
        type: "list",
        ordered: false,
        items: [
          { content: [{ text: "Pedro Pintor — dia 08" }] },
          { content: [{ text: "Maria Líder — dia 14" }] },
          { content: [{ text: "Carlos Comercial — dia 22" }] },
          { content: [{ text: "João Recortes — dia 27" }] },
        ],
      },
      {
        type: "quote",
        content: [
          { text: "O bolo será servido no refeitório na sexta-feira às 15h." },
        ],
      },
    ],
    createdAt: offset(-3),
    publishedAt: offset(-3),
    viewedAt: offset(-2),
    dismissedAt: null,
  },
  {
    id: id(152),
    title: `${TAG} Treinamento de segurança`,
    subject: "Treinamento de segurança obrigatório",
    content: [
      {
        type: "heading",
        level: 3,
        content: [{ text: "Treinamento NR-6 obrigatório" }],
      },
      {
        type: "paragraph",
        content: [
          {
            text: "Está marcado o treinamento obrigatório de segurança e uso correto de EPIs para toda a equipe de produção.",
          },
        ],
      },
      {
        type: "list",
        ordered: false,
        items: [
          {
            content: [
              { text: "Data: ", styles: ["bold"] },
              { text: "18/05 (segunda-feira)" },
            ],
          },
          {
            content: [
              { text: "Horário: ", styles: ["bold"] },
              { text: "07h30 às 09h30" },
            ],
          },
          {
            content: [
              { text: "Local: ", styles: ["bold"] },
              { text: "Sala de treinamentos (Bloco B, sala 02)" },
            ],
          },
        ],
      },
      {
        type: "paragraph",
        content: [
          { text: "Presença ", },
          { text: "obrigatória", styles: ["bold"] },
          { text: ". A confirmação será feita por assinatura na entrada da sala." },
        ],
      },
    ],
    createdAt: offset(-7),
    publishedAt: offset(-7),
    viewedAt: offset(-6),
    dismissedAt: null,
  },
];

// ===========================================================================
// WARNINGS / ADVERTÊNCIAS
// ===========================================================================

export const mockWarnings = [
  {
    id: id(160),
    reason: "ATRASO",
    description: "Atraso recorrente — demonstração para o tutorial.",
    severity: "VERBAL",
    severityOrder: 1,
    appliedAt: offset(-30),
    createdAt: offset(-30),
    updatedAt: offset(-30),
  },
  {
    id: id(161),
    reason: "USO_INADEQUADO_EPI",
    description: "Demonstração: registro de uso inadequado de EPI.",
    severity: "WRITTEN",
    severityOrder: 2,
    appliedAt: offset(-60),
    createdAt: offset(-60),
    updatedAt: offset(-60),
  },
];

// ===========================================================================
// BORROWS / EMPRÉSTIMOS
// ===========================================================================

export const mockBorrows = [
  {
    id: id(170),
    status: "ACTIVE",
    quantity: 1,
    item: { id: id(171), name: "Furadeira Industrial", category: { name: "Ferramentas" } },
    borrowedAt: offset(-3),
    returnedAt: null,
    createdAt: offset(-3),
    updatedAt: offset(-3),
  },
  {
    id: id(172),
    status: "RETURNED",
    quantity: 1,
    item: { id: id(173), name: "Pistola de Pintura", category: { name: "Ferramentas" } },
    borrowedAt: offset(-15),
    returnedAt: offset(-10),
    createdAt: offset(-15),
    updatedAt: offset(-10),
  },
];

// ===========================================================================
// EXTERNAL WITHDRAWALS / ACTIVITIES (movimentações pessoais)
// ===========================================================================

export const mockActivities = [
  {
    id: id(180),
    operation: "OUTBOUND",
    quantity: 5,
    item: { id: id(181), name: "Lixa Grão 220", category: { name: "Consumíveis" } },
    reason: "OUT",
    createdAt: offset(-1),
    updatedAt: offset(-1),
  },
  {
    id: id(182),
    operation: "OUTBOUND",
    quantity: 2,
    item: { id: id(183), name: "Fita Crepe 50mm", category: { name: "Consumíveis" } },
    reason: "OUT",
    createdAt: offset(-3),
    updatedAt: offset(-3),
  },
  {
    id: id(184),
    operation: "OUTBOUND",
    quantity: 1,
    item: { id: id(185), name: "Filtro de Cabine", category: { name: "EPIs" } },
    reason: "EPI",
    createdAt: offset(-5),
    updatedAt: offset(-5),
  },
];

// ===========================================================================
// BONUSES / BÔNUS
// ===========================================================================

// Bonus discount references follow the parser format expected by atual.tsx:
//   "Label (count) — dd/mm (hh:mm), dd/mm (hh:mm)"
// `parseDiscountReference` in atual.tsx splits on " — " then ", " to render
// the date list under each discount row. Keep that format intact.

const mockBonusUser = {
  id: id(180),
  name: "Tutorial User",
  position: { id: id(181), name: "Pintor II", bonifiable: true },
  positionId: id(181),
  sector: { id: id(182), name: "Produção" },
  sectorId: id(182),
};

// Current period: 92% assiduidade — 2 unjustified absences trigger a 5%
// discount on the base. Demonstrates the full calculation: base → discount
// → net. Position "Pintor II" makes the user bonifiable for the tutorial.
export const mockBonusCurrent = {
  id: id(200),
  userId: mockBonusUser.id,
  user: mockBonusUser,
  year: 2026,
  month: 5,
  status: "DRAFT",
  baseBonus: 1500,
  netBonus: 1425,
  performanceLevel: 4,
  weightedTasks: 18.5,
  averageTaskPerUser: 16.2,
  eligibleUsersCount: 12,
  calculationPeriodStart: offset(-15),
  calculationPeriodEnd: offset(10),
  bonusDiscounts: [
    {
      id: id(190),
      bonusId: id(200),
      reference: "Faltas (2) — 15/04 (08:30), 16/04 (16:45)",
      percentage: 5.0,
      value: 75,
      calculationOrder: 1,
      createdAt: offset(-10),
    },
  ],
  bonusExtras: [],
  tasks: [] as any[],
  users: Array.from({ length: 12 }).map((_, i) => ({ id: id(300 + i) })),
  createdAt: offset(-15),
  updatedAt: offset(0),
};

export const mockBonusDiscount = mockBonusCurrent.bonusDiscounts[0];

// History: 4 varied periods to demonstrate different outcomes.
export const mockBonusHistory = [
  // Period 1 — Previous month: full attendance, no discounts
  {
    id: id(210),
    userId: mockBonusUser.id,
    user: mockBonusUser,
    year: 2026,
    month: 4,
    status: "CONFIRMED",
    baseBonus: 1500,
    netBonus: 1500,
    performanceLevel: 4,
    weightedTasks: 17.0,
    averageTaskPerUser: 15.8,
    eligibleUsersCount: 12,
    calculationPeriodStart: offset(-45),
    calculationPeriodEnd: offset(-20),
    bonusDiscounts: [],
    bonusExtras: [],
    tasks: [] as any[],
    users: Array.from({ length: 12 }).map((_, i) => ({ id: id(300 + i) })),
    confirmedAt: offset(-18),
    createdAt: offset(-45),
    updatedAt: offset(-18),
  },
  // Period 2 — Two months ago: 88% assiduidade, 3 absences, 7.5% discount
  {
    id: id(211),
    userId: mockBonusUser.id,
    user: mockBonusUser,
    year: 2026,
    month: 3,
    status: "CONFIRMED",
    baseBonus: 1500,
    netBonus: 1387.5,
    performanceLevel: 3,
    weightedTasks: 14.5,
    averageTaskPerUser: 15.2,
    eligibleUsersCount: 11,
    calculationPeriodStart: offset(-75),
    calculationPeriodEnd: offset(-50),
    bonusDiscounts: [
      {
        id: id(220),
        bonusId: id(211),
        reference: "Faltas (3) — 05/03 (08:00), 12/03 (08:00), 20/03 (08:00)",
        percentage: 7.5,
        value: 112.5,
        calculationOrder: 1,
        createdAt: offset(-50),
      },
    ],
    bonusExtras: [],
    tasks: [] as any[],
    users: Array.from({ length: 11 }).map((_, i) => ({ id: id(310 + i) })),
    confirmedAt: offset(-48),
    createdAt: offset(-75),
    updatedAt: offset(-48),
  },
  // Period 3 — Three months ago: minor delay, 3.3% discount
  {
    id: id(212),
    userId: mockBonusUser.id,
    user: mockBonusUser,
    year: 2026,
    month: 2,
    status: "PAID",
    baseBonus: 1500,
    netBonus: 1450,
    performanceLevel: 4,
    weightedTasks: 16.5,
    averageTaskPerUser: 15.0,
    eligibleUsersCount: 11,
    calculationPeriodStart: offset(-105),
    calculationPeriodEnd: offset(-80),
    bonusDiscounts: [
      {
        id: id(221),
        bonusId: id(212),
        reference: "Atraso (1) — 14/02 (08:45)",
        percentage: 3.33,
        value: 50,
        calculationOrder: 1,
        createdAt: offset(-80),
      },
    ],
    bonusExtras: [],
    tasks: [] as any[],
    users: Array.from({ length: 11 }).map((_, i) => ({ id: id(310 + i) })),
    confirmedAt: offset(-78),
    payrollId: id(230),
    createdAt: offset(-105),
    updatedAt: offset(-75),
  },
  // Period 4 — Four months ago: 99% assiduidade earns assiduity extra
  {
    id: id(213),
    userId: mockBonusUser.id,
    user: mockBonusUser,
    year: 2026,
    month: 1,
    status: "PAID",
    baseBonus: 1500,
    netBonus: 1650,
    performanceLevel: 5,
    weightedTasks: 19.0,
    averageTaskPerUser: 16.0,
    eligibleUsersCount: 10,
    calculationPeriodStart: offset(-135),
    calculationPeriodEnd: offset(-110),
    bonusDiscounts: [],
    bonusExtras: [
      {
        id: id(240),
        bonusId: id(213),
        reference: "Assiduidade Extra — 99%",
        percentage: 10.0,
        value: 150,
        calculationOrder: 1,
        createdAt: offset(-110),
      },
    ],
    tasks: [] as any[],
    users: Array.from({ length: 10 }).map((_, i) => ({ id: id(310 + i) })),
    confirmedAt: offset(-108),
    payrollId: id(231),
    createdAt: offset(-135),
    updatedAt: offset(-105),
  },
];

export const mockBonuses = [mockBonusCurrent, ...mockBonusHistory];

// ===========================================================================
// NOTIFICATION PREFERENCES (5 categories x events, each with 4 channels)
// ===========================================================================

const allChannels = ["IN_APP", "PUSH", "EMAIL", "WHATSAPP"] as const;

// Helper: shape one config event with sane defaults (IN_APP mandatory, PUSH
// enabled, EMAIL / WHATSAPP off). Mirrors what a real first-time user sees.
function makeNotifConfig(
  configKey: string,
  eventTitle: string,
  eventDescription: string,
  enabledChannels: ReadonlyArray<string> = ["IN_APP", "PUSH"],
) {
  return {
    configKey,
    notificationType: configKey.split("_")[0] ?? "",
    eventTitle,
    eventDescription,
    channels: allChannels.map((channel) => ({
      channel,
      mandatory: channel === "IN_APP",
      userEnabled: enabledChannels.includes(channel),
    })),
  };
}

// Production-sector users only see categories relevant to their work: their
// own tasks, personal notifications (warnings/absences/EPI/messages from
// liderança) and system-wide announcements. ORDER and STOCK belong to
// commercial / warehouse / admin roles and would NEVER appear for a
// production user — leaving them in the tutorial misrepresents the real
// app and confuses the user.
export const mockNotificationConfigurations = [
  {
    notificationType: "TASK",
    configurations: [
      makeNotifConfig("TASK_ASSIGNED", "Tarefa atribuída", "Quando uma tarefa entra na sua fila de produção."),
      makeNotifConfig("TASK_STATUS_CHANGED", "Status da tarefa mudou", "Atualizações de status nas suas tarefas (entrou em produção, finalizada, etc.)."),
      makeNotifConfig("TASK_DUE_SOON", "Prazo se aproximando", "Tarefas com prazo nas próximas 24h.", ["IN_APP", "PUSH", "EMAIL"]),
    ],
  },
  {
    notificationType: "USER",
    configurations: [
      makeNotifConfig("USER_WARNING", "Nova advertência", "Quando você recebe uma advertência da liderança."),
      makeNotifConfig("USER_ABSENCE", "Aviso de ausência", "Quando uma falta é registrada no seu ponto.", ["IN_APP", "PUSH", "EMAIL"]),
      makeNotifConfig("USER_PPE_DELIVERY", "EPI disponível", "Quando um EPI solicitado fica pronto para retirada.", ["IN_APP", "PUSH"]),
    ],
  },
  {
    notificationType: "SYSTEM",
    configurations: [
      makeNotifConfig("SYSTEM_ANNOUNCEMENT", "Comunicado da empresa", "Mensagens da liderança / RH para todos os colaboradores.", ["IN_APP", "PUSH", "EMAIL"]),
      makeNotifConfig("SYSTEM_MAINTENANCE", "Manutenção programada", "Avisos antes de manutenção do aplicativo."),
    ],
  },
];

// ===========================================================================
// HOME DASHBOARD
// ===========================================================================

export const mockHomeDashboardData = {
  sector: "PRODUCTION",
  tasksCloseDeadline: mockTasks.slice(0, 3).map((t) => ({
    id: t.id,
    name: t.name,
    serialNumber: t.serialNumber,
    plate: t.plate,
    status: t.status,
    paymentStatus: null,
    term: (t.term as Date)?.toISOString?.() ?? null,
    forecastDate: (t.forecastDate as Date | undefined)?.toISOString?.() ?? null,
    customerName: t.customer?.fantasyName ?? null,
    sectorName: t.sector?.name ?? null,
  })),
  tasksCloseForecast: mockTasks.slice(0, 2).map((t) => ({
    id: t.id,
    name: t.name,
    forecastDate: (t.forecastDate as Date | undefined)?.toISOString?.() ?? null,
  })),
  openServiceOrders: mockServiceOrders.slice(0, 4).map((so) => ({
    id: so.id,
    description: so.description,
    type: so.type,
    status: so.status,
    taskId: so.task?.id ?? "",
    taskName: so.task?.name ?? null,
    taskSerialNumber: null,
    taskForecastDate: null,
    assignedToName: so.assignedTo?.name ?? null,
    createdAt: (so.createdAt as Date).toISOString(),
  })),
  lowStockItems: [],
  completedTasks: mockCompletedTasks.map((t) => ({
    id: t.id,
    name: t.name,
    finishedAt: (t.finishedAt as Date | null)?.toISOString?.() ?? null,
  })),
  recentMessages: mockMyMessages.map((m) => ({
    id: m.id,
    title: m.title,
    content: m.content,
    createdAt: (m.createdAt as Date).toISOString(),
    publishedAt: (m.publishedAt as Date | null)?.toISOString?.() ?? null,
    viewedAt: (m.viewedAt as Date | null)?.toISOString?.() ?? null,
  })),
  counts: {
    tasksCloseDeadline: 3,
    tasksCloseForecast: 2,
    openServiceOrders: 4,
    lowStockItems: 0,
    completedTasks: mockCompletedTasks.length,
    recentMessages: mockMyMessages.length,
    unreadMessages: mockMyMessages.filter((m) => !m.viewedAt).length,
  },
};

// ===========================================================================
// SECULLUM — full week + full column set
// ===========================================================================

const fmtDay = (d: Date, label: string) =>
  `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()} - ${label}`;

export const mockSecullumMyCalculations = {
  data: {
    success: true,
    data: {
      Colunas: [
        { Nome: "Data" },
        { Nome: "Entrada 1" },
        { Nome: "Saída 1" },
        { Nome: "Entrada 2" },
        { Nome: "Saída 2" },
        { Nome: "Normais" },
        { Nome: "Faltas" },
        { Nome: "Ex50%" },
        { Nome: "Ex100%" },
        { Nome: "Ex150%" },
        { Nome: "DSR" },
        { Nome: "Noturno" },
        { Nome: "Atraso" },
        { Nome: "Abonos" },
        { Nome: "Ajuste" },
      ],
      Linhas: [
        [fmtDay(new Date(), "Hoje"), "07:30", "12:00", "13:00", "17:30", "08:00", "00:00", "00:00", "00:00", "00:00", "00:00", "00:00", "00:00", "00:00", "00:00"],
        [fmtDay(offset(-1), "Ontem"), "07:28", "12:02", "12:58", "17:33", "08:05", "00:00", "00:05", "00:00", "00:00", "00:00", "00:00", "00:00", "00:00", "00:00"],
        [fmtDay(offset(-2), "Seg"), "07:30", "12:00", "13:00", "17:30", "08:00", "00:00", "00:00", "00:00", "00:00", "00:00", "00:00", "00:00", "00:00", "00:00"],
        [fmtDay(offset(-3), "Dom"), "—", "—", "—", "—", "00:00", "00:00", "00:00", "00:00", "00:00", "08:00", "00:00", "00:00", "00:00", "00:00"],
        [fmtDay(offset(-4), "Sáb"), "07:30", "11:30", "—", "—", "04:00", "00:00", "00:00", "00:00", "00:00", "00:00", "00:00", "00:00", "00:00", "00:00"],
        [fmtDay(offset(-5), "Sex"), "07:45", "12:00", "13:00", "17:30", "07:45", "00:00", "00:00", "00:00", "00:00", "00:00", "00:15", "00:00", "00:00", "00:00"],
        [fmtDay(offset(-6), "Qui"), "07:30", "12:00", "13:00", "18:30", "08:00", "00:00", "01:00", "00:00", "00:00", "00:00", "00:00", "00:00", "00:00", "00:00"],
      ],
    },
  },
};

// ===========================================================================
// FAVORITES (for the home screen — match tutorial routes)
// ===========================================================================

const TUTORIAL_FAVORITES_BASE = [
  { path: "/producao/cronograma", title: "Cronograma" },
  { path: "/producao/recorte", title: "Recorte" },
  { path: "/producao/observacoes", title: "Observações" },
] as const;

const TUTORIAL_FAVORITES_PAYLOAD = TUTORIAL_FAVORITES_BASE.map((entry, i) => ({
  id: `tutorial-favorite-${i}`,
  path: entry.path,
  title: entry.title,
  addedAt: new Date().toISOString(),
}));

const FAVORITES_STORAGE_PREFIX = "@ankaa_favorites";

// ===========================================================================
// Wrapping helpers
// ===========================================================================

const wrap = (data: any[]) => ({
  success: true,
  message: "ok",
  data,
  meta: {
    page: 1,
    limit: 50,
    totalRecords: data.length,
    hasNextPage: false,
    totalPages: 1,
  },
});

const wrapOne = (data: unknown) => ({
  success: true,
  message: "ok",
  data,
});

const listEntities: Array<{
  root: string;
  payload: ReturnType<typeof wrap>;
  records?: any[];
}> = [
  { root: "tasks", payload: wrap(mockTasks), records: mockTasks },
  { root: "cuts", payload: wrap(mockCuts), records: mockCuts },
  { root: "airbrushings", payload: wrap(mockAirbrushings), records: mockAirbrushings },
  { root: "observations", payload: wrap(mockObservations), records: mockObservations },
  { root: "serviceOrders", payload: wrap(mockServiceOrders), records: mockServiceOrders },
  { root: "service-orders", payload: wrap(mockServiceOrders), records: mockServiceOrders },
  { root: "notifications", payload: wrap(mockNotifications), records: mockNotifications },
  { root: "trucks", payload: wrap(mockTrucks), records: mockTrucks },
  { root: "layouts", payload: wrap([mockLayouts]), records: [mockLayouts] },
  { root: "holidays", payload: wrap(mockHolidays), records: mockHolidays },
  { root: "ppeDeliveries", payload: wrap(mockPpeDeliveries), records: mockPpeDeliveries },
  { root: "ppe-deliveries", payload: wrap(mockPpeDeliveries), records: mockPpeDeliveries },
  { root: "ppeSizes", payload: wrap([]) },
  { root: "ppeDeliverySchedules", payload: wrap([]) },
  { root: "warnings", payload: wrap(mockWarnings), records: mockWarnings },
  { root: "bonuses", payload: wrap(mockBonuses), records: mockBonuses },
  { root: "borrows", payload: wrap(mockBorrows), records: mockBorrows },
  { root: "messages", payload: wrap(mockMyMessages), records: mockMyMessages },
  { root: "customers", payload: wrap(mockCustomers), records: mockCustomers },
  { root: "paints", payload: wrap(mockPaints), records: mockPaints },
  { root: "paint-brands", payload: wrap(mockPaintBrands), records: mockPaintBrands },
  { root: "paintBrands", payload: wrap(mockPaintBrands), records: mockPaintBrands },
  { root: "paint-types", payload: wrap(mockPaintTypes), records: mockPaintTypes },
  { root: "paintTypes", payload: wrap(mockPaintTypes), records: mockPaintTypes },
  { root: "paint-formulas", payload: wrap(mockPaintFormulas), records: mockPaintFormulas },
  { root: "activities", payload: wrap(mockActivities), records: mockActivities },
  { root: "external-withdrawals", payload: wrap(mockActivities), records: mockActivities },
  { root: "files", payload: wrap(mockFiles), records: mockFiles },
  { root: "sectors", payload: wrap(mockSectors), records: mockSectors },
];

const customEntries: Array<{ key: ReadonlyArray<unknown>; payload: unknown }> = [
  { key: ["dashboards", "home"], payload: { success: true, message: "ok", data: mockHomeDashboardData } },
  { key: ["dashboards", "production"], payload: { success: true, message: "ok", data: mockHomeDashboardData } },
  { key: ["my-messages"], payload: mockMyMessages },
  { key: ["notifications", "unread"], payload: { success: true, data: mockNotifications.filter((n) => !n.read), meta: { totalRecords: mockNotifications.filter((n) => !n.read).length } } },
  { key: ["forecast-history"], payload: { success: true, data: task0.forecastHistory } },
  { key: ["bonuses", "current"], payload: wrapOne(mockBonusCurrent) },
  // The atual.tsx screen uses `['bonuses', 'current-bonus', year, month]`
  // directly via useQuery — match that prefix so mockBonusCurrent resolves
  // for any year/month combo while the tutorial is active. Without this
  // mapping the bonus screen renders empty (no baseBonus/netBonus) and the
  // tutorial appears to "spam empty overlays".
  { key: ["bonuses", "current-bonus"], payload: wrapOne(mockBonusCurrent) },
  // `useMyLiveBonus` (hooks/bonus.ts) uses `['bonuses', 'live', year, month]`
  { key: ["bonuses", "live"], payload: wrapOne(mockBonusCurrent) },
];

// ===========================================================================
// State for restore on cleanup
// ===========================================================================

interface SavedState {
  cacheSnapshot: Map<string, unknown>;
  registeredRoots: string[];
  previousFavoritesByUser: Map<string, string | null>;
  writtenFavoritesKeys: string[];
}

let savedState: SavedState | null = null;

// ===========================================================================
// Mock query function
// ===========================================================================

function isInfinitePageContext(arg: unknown): arg is { pageParam?: unknown } {
  return (
    typeof arg === "object" &&
    arg !== null &&
    "pageParam" in (arg as Record<string, unknown>)
  );
}

function matchesWhere(record: any, where: any): boolean {
  if (!where || typeof where !== "object") return true;
  for (const [key, value] of Object.entries(where)) {
    if (value == null) continue;
    // Nested where like `task.sectorId`
    if (key === "task" && typeof value === "object") {
      if (!record.task) return false;
      if (!matchesWhere(record.task, value)) return false;
      continue;
    }
    // Direct ID match
    if (key === "id" && typeof value === "string") {
      if (record.id !== value) return false;
      continue;
    }
    if (key === "taskId" && typeof value === "string") {
      if (record.taskId !== value && record.task?.id !== value) return false;
      continue;
    }
    if (key === "sectorId" && typeof value === "string") {
      if (record.sectorId !== value && record.sector?.id !== value) return false;
      continue;
    }
    // status: enum or {in: [...]} or {notIn: [...]}
    if (key === "status") {
      if (typeof value === "string") {
        if (record.status !== value) return false;
        continue;
      }
      if (typeof value === "object") {
        if (Array.isArray((value as any).in)) {
          if (!(value as any).in.includes(record.status)) return false;
          continue;
        }
        if (Array.isArray((value as any).notIn)) {
          if ((value as any).notIn.includes(record.status)) return false;
          continue;
        }
      }
    }
    if (key === "statusIn" && Array.isArray(value)) {
      if (!value.includes(record.status)) return false;
      continue;
    }
    // Permissive default: ignore unrecognized keys (don't filter out).
  }
  return true;
}

function buildMockQueryFn(payload: unknown, records?: any[]) {
  return async (ctx: any) => {
    if (isInfinitePageContext(ctx) && (ctx.pageParam ?? 1) !== 1) {
      return {
        success: true,
        message: "ok",
        data: [],
        meta: {
          page: ctx.pageParam,
          limit: 50,
          totalRecords: 0,
          hasNextPage: false,
          totalPages: 1,
        },
      };
    }

    const queryKey: ReadonlyArray<unknown> = ctx?.queryKey ?? [];
    if (records && queryKey[1] === "detail") {
      const wantedId = queryKey[2];
      const match =
        records.find((r) => r?.id === wantedId) ?? records[0] ?? null;
      return wrapOne(match);
    }

    if (records && queryKey.length > 1) {
      const filterArg = queryKey[queryKey.length - 1];
      if (filterArg && typeof filterArg === "object") {
        const where = (filterArg as any).where;
        if (where) {
          const filtered = records.filter((r) => matchesWhere(r, where));
          return {
            success: true,
            message: "ok",
            data: filtered,
            meta: {
              page: 1,
              limit: 50,
              totalRecords: filtered.length,
              hasNextPage: false,
              totalPages: 1,
            },
          };
        }
      }
    }

    return payload;
  };
}

async function injectFavoritesIntoStorage(): Promise<{
  previousByKey: Map<string, string | null>;
  writtenKeys: string[];
}> {
  const previousByKey = new Map<string, string | null>();
  const writtenKeys: string[] = [];
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const favoriteKeys = allKeys.filter((k) =>
      k.startsWith(FAVORITES_STORAGE_PREFIX) && !k.includes("show_favorites"),
    );

    if (!favoriteKeys.includes(FAVORITES_STORAGE_PREFIX)) {
      favoriteKeys.push(FAVORITES_STORAGE_PREFIX);
    }

    const newValue = JSON.stringify(TUTORIAL_FAVORITES_PAYLOAD);
    for (const key of favoriteKeys) {
      const prev = await AsyncStorage.getItem(key);
      previousByKey.set(key, prev);
      await AsyncStorage.setItem(key, newValue);
      writtenKeys.push(key);
    }
  } catch (err) {
    console.warn("[tutorial-mocks] failed to inject demo favorites", err);
  }
  return { previousByKey, writtenKeys };
}

async function restoreFavoritesFromStorage(saved: SavedState): Promise<void> {
  try {
    for (const key of saved.writtenFavoritesKeys) {
      const prev = saved.previousFavoritesByUser.get(key) ?? null;
      if (prev === null) {
        await AsyncStorage.removeItem(key);
      } else {
        await AsyncStorage.setItem(key, prev);
      }
    }
  } catch (err) {
    console.warn("[tutorial-mocks] failed to restore favorites", err);
  }
}

export function injectTutorialMocks(
  queryClient: QueryClient,
  realUser?: any,
): void {
  // IMPORTANT: build the records map + flip the runtime `active` flag BEFORE
  // the savedState guard. Reason: Fast Refresh / hot reload re-evaluates
  // `tutorial-runtime-state.ts` and resets its module-level state to
  // `active=false, records=empty`, while `tutorial-mocks.ts`'s savedState is
  // preserved (different module). After that, every tutorial-aware service
  // short-circuit + the navigation-loading overlay suppression silently
  // falls through to real-API behaviour and the user is stuck on an
  // "infinite loading" screen. By doing the runtime sync first, we
  // self-heal as soon as the engine re-injects (which it now does on every
  // step entry that finds the runtime out of sync).

  // The cronograma groups tasks by sector and only shows the user's OWN
  // sector by default (production users don't see other sectors). Mock tasks
  // use a synthetic mockSector.id, so without rewriting, every demo task
  // lands in "Setor Indefinido" or "outros setores" and stays hidden. Bind
  // each mock task to the real user's sector instead, and prepend the real
  // sector into the sectors registry so it resolves on the list page.
  const realSectorId: string | null =
    (realUser?.ledSector?.id as string | null) ??
    (realUser?.sector?.id as string | null) ??
    null;
  const realSector =
    realUser?.ledSector ?? realUser?.sector ?? null;
  // Production users don't see PREPARATION or CANCELLED tasks in their
  // cronograma — those are owned by Comercial / Financial / admin flows.
  // Filter the mock dataset so the tutorial list matches what a real
  // production user would experience, and the status-legend step's "três
  // status" claim isn't contradicted by surprise preparation/cancelled
  // rows showing up. COMPLETED stays so histórico has something to show.
  const visibleStatuses = new Set([
    "WAITING_PRODUCTION",
    "IN_PRODUCTION",
    "COMPLETED",
  ]);
  const tasksFilteredByStatus = mockTasks.filter((t: any) =>
    visibleStatuses.has(t.status),
  );
  const tasksWithRealSector = realSectorId
    ? tasksFilteredByStatus.map((t: any) => ({
        ...t,
        sectorId: realSectorId,
        sector: realSector
          ? { ...(t.sector ?? {}), id: realSectorId, name: realSector.name }
          : t.sector,
      }))
    : tasksFilteredByStatus;
  // Only keep production-privileged sectors in the runtime registry — the
  // cronograma's sector query filters by `privileges: PRODUCTION`, and a
  // stray commercial sector would otherwise appear in the production user's
  // sector list. The user's real sector goes first so it groups their tasks.
  const sectorsForRuntime = realSector
    ? [
        {
          ...realSector,
          privileges: realSector.privileges ?? mockSector.privileges,
        },
        ...mockSectors.filter(
          (s: any) =>
            s.id !== realSectorId && s.privileges === mockSector.privileges,
        ),
      ]
    : mockSectors.filter((s: any) => s.privileges === mockSector.privileges);

  setTutorialRuntimeActive(true, {
    tasks: tasksWithRealSector,
    cuts: mockCuts,
    observations: mockObservations,
    airbrushings: mockAirbrushings,
    serviceOrders: mockServiceOrders,
    customers: mockCustomers,
    paints: mockPaints,
    paintBrands: mockPaintBrands,
    paintTypes: mockPaintTypes,
    notifications: mockNotifications,
    warnings: mockWarnings,
    bonuses: mockBonuses,
    borrows: mockBorrows,
    activities: mockActivities,
    holidays: mockHolidays,
    ppeDeliveries: mockPpeDeliveries,
    messages: mockMyMessages,
    files: mockFiles,
    trucks: mockTrucks,
    layouts: [mockLayouts],
    sectors: sectorsForRuntime,
    secullumMissingDays: mockSecullumMissingDays,
    secullumJustificativas: mockSecullumJustificativas,
    secullumBatidas: mockSecullumBatidasForDate,
    secullumSolicitacao: mockSecullumSolicitacao,
    // `getMyCalculations` short-circuits via this entry — required because
    // `useMySecullumCalculations` provides its own queryFn, which beats the
    // setQueryDefaults mock fallback below.
    secullumCalculations: (mockSecullumMyCalculations as any).data,
  });

  // Cache priming is one-shot: snapshot the original cache, prime mocked
  // queries, and remember what we touched so `clearTutorialMocks` can put it
  // all back. After the first call we just want the runtime sync above —
  // priming again would overwrite the snapshot and lose the user's real
  // data when the tutorial ends.
  if (savedState) return;

  // The static `listEntities` array references the ORIGINAL mockTasks /
  // mockSectors at module load. The cache-priming loop below uses it, so
  // without these overrides the rewritten (real-sector-bound) tasks would
  // never reach the query cache that the cronograma reads from.
  const listEntitiesForInjection = listEntities.map((entry) => {
    if (entry.root === "tasks") {
      return {
        ...entry,
        payload: wrap(tasksWithRealSector),
        records: tasksWithRealSector,
      };
    }
    if (entry.root === "sectors") {
      return {
        ...entry,
        payload: wrap(sectorsForRuntime),
        records: sectorsForRuntime,
      };
    }
    return entry;
  });

  const cacheSnapshot = new Map<string, unknown>();
  const registeredRoots: string[] = [];

  const cache = queryClient.getQueryCache();
  const allQueries = cache.getAll();

  const queriesByRoot = new Map<string, typeof allQueries>();
  allQueries.forEach((q) => {
    cacheSnapshot.set(JSON.stringify(q.queryKey), q.state.data);
    const rootKey = q.queryKey[0] as string;
    if (typeof rootKey === "string") {
      const list = queriesByRoot.get(rootKey);
      if (list) list.push(q);
      else queriesByRoot.set(rootKey, [q]);
    }
  });

  listEntitiesForInjection.forEach(({ root, payload, records }) => {
    queryClient.setQueryDefaults([root], {
      queryFn: buildMockQueryFn(payload, records) as any,
      staleTime: Infinity,
      gcTime: Infinity,
      retry: false,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    } as any);
    registeredRoots.push(root);

    queryClient.setQueryData([root], payload);
    queryClient.setQueryData([root, "list"], payload);
    queryClient.setQueryData([root, { tutorialMode: true }], payload);

    if (records) {
      records.forEach((rec: any) => {
        if (!rec?.id) return;
        queryClient.setQueryData([root, "detail", rec.id], wrapOne(rec));
      });
    }

    (queriesByRoot.get(root) ?? []).forEach((q) => {
      if (records && q.queryKey[1] === "detail") {
        const wantedId = q.queryKey[2];
        const match =
          records.find((r) => r?.id === wantedId) ?? records[0] ?? null;
        queryClient.setQueryData(q.queryKey, wrapOne(match));
        return;
      }
      const existing: any = q.state.data;
      if (existing && Array.isArray(existing.pages)) {
        queryClient.setQueryData(q.queryKey, {
          pages: [payload],
          pageParams: [1],
        });
      } else {
        queryClient.setQueryData(q.queryKey, payload);
      }
    });
  });

  // Consolidated cache walk. Previously this file did `cache.getAll()` THREE
  // times — once for the snapshot/grouping, once inside the customEntries
  // loop, once for the secullum special case. On a fully-warmed dashboard
  // with ~50 cached queries that's ~150 iterations on tutorial start.
  // We now reuse the `allQueries` list captured above for both the
  // customEntries prefix-match and the secullum sweep.
  customEntries.forEach(({ key, payload }) => {
    const root = key[0] as string;
    queryClient.setQueryDefaults(key as readonly unknown[], {
      queryFn: buildMockQueryFn(payload) as any,
      staleTime: Infinity,
      gcTime: Infinity,
      retry: false,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    } as any);
    if (!registeredRoots.includes(root)) registeredRoots.push(root);

    queryClient.setQueryData(key, payload);
    allQueries.forEach((q) => {
      const matches = key.every((seg, i) => q.queryKey[i] === seg);
      if (matches) {
        queryClient.setQueryData(q.queryKey, payload);
      }
    });
  });

  const secullumPrefix = ["secullum", "my-calculations"] as const;
  queryClient.setQueryDefaults(secullumPrefix, {
    queryFn: buildMockQueryFn(mockSecullumMyCalculations) as any,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  } as any);
  if (!registeredRoots.includes("secullum")) registeredRoots.push("secullum");
  allQueries.forEach((q) => {
    if (q.queryKey[0] === "secullum" && q.queryKey[1] === "my-calculations") {
      queryClient.setQueryData(q.queryKey, mockSecullumMyCalculations);
    }
  });

  const initial: SavedState = {
    cacheSnapshot,
    registeredRoots,
    previousFavoritesByUser: new Map(),
    writtenFavoritesKeys: [],
  };
  savedState = initial;

  injectFavoritesIntoStorage()
    .then(({ previousByKey, writtenKeys }) => {
      if (savedState === initial) {
        savedState.previousFavoritesByUser = previousByKey;
        savedState.writtenFavoritesKeys = writtenKeys;
      }
    })
    .catch(() => {});
}

export function clearTutorialMocks(queryClient: QueryClient): void {
  if (!savedState) return;
  const saved = savedState;
  savedState = null;

  setTutorialRuntimeActive(false);

  saved.registeredRoots.forEach((root) => {
    try {
      queryClient.setQueryDefaults([root], {} as any);
    } catch {}
  });
  try {
    queryClient.setQueryDefaults(["dashboards", "home"], {} as any);
    queryClient.setQueryDefaults(["dashboards", "production"], {} as any);
    queryClient.setQueryDefaults(["my-messages"], {} as any);
    queryClient.setQueryDefaults(["notifications", "unread"], {} as any);
    queryClient.setQueryDefaults(["secullum", "my-calculations"], {} as any);
    queryClient.setQueryDefaults(["forecast-history"], {} as any);
    queryClient.setQueryDefaults(["bonuses", "current"], {} as any);
    queryClient.setQueryDefaults(["bonuses", "current-bonus"], {} as any);
    queryClient.setQueryDefaults(["bonuses", "live"], {} as any);
  } catch {}

  const cache = queryClient.getQueryCache();
  cache.getAll().forEach((q) => {
    const key = JSON.stringify(q.queryKey);
    if (saved.cacheSnapshot.has(key)) {
      queryClient.setQueryData(q.queryKey, saved.cacheSnapshot.get(key));
    } else {
      try {
        queryClient.removeQueries({ queryKey: q.queryKey, exact: true });
      } catch {}
    }
  });

  restoreFavoritesFromStorage(saved).catch(() => {});
  queryClient.invalidateQueries();
}

// Public bag for in-tutorial consumers (task picker, etc.)
export const tutorialMocks = {
  tasks: mockTasks,
  completedTasks: mockCompletedTasks,
  cuts: mockCuts,
  airbrushings: mockAirbrushings,
  observations: mockObservations,
  serviceOrders: mockServiceOrders,
  notifications: mockNotifications,
  trucks: mockTrucks,
  holidays: mockHolidays,
  ppeDeliveries: mockPpeDeliveries,
  myMessages: mockMyMessages,
  warnings: mockWarnings,
  bonuses: mockBonuses,
  borrows: mockBorrows,
  activities: mockActivities,
  customers: mockCustomers,
  paints: mockPaints,
  files: mockFiles,
  homeDashboard: mockHomeDashboardData,
  secullumMyCalculations: mockSecullumMyCalculations,
  favorites: TUTORIAL_FAVORITES_PAYLOAD,
  notificationConfigurations: mockNotificationConfigurations,
};
