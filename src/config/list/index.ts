// Re-export all list configurations from their respective modules

// Administration Module (6 configs)
export {
  customersListConfig,
  sectorsListConfig,
  notificationsListConfig,
  collaboratorsListConfig,
  changeLogsListConfig,
  filesListConfig,
} from './administration'

// HR Module (6 configs)
export {
  employeesListConfig,
  warningsListConfig,
  positionsListConfig,
  ppeDeliveriesListConfig,
  holidaysListConfig,
} from './personnel-department'

// Inventory Module (10 configs)
export {
  itemsListConfig,
  ordersListConfig,
  borrowsListConfig,
  activitiesListConfig,
  externalOperationsListConfig,
  suppliersListConfig,
  warehouseLocationsListConfig,
  categoriesListConfig,
  brandsListConfig,
  maintenanceListConfig,
} from './inventory'

// Production Module (6 configs)
export {
  tasksListConfig,
  airbrushingListConfig,
  paintsListConfig,
  observationsListConfig,
  cutsListConfig,
  serviceOrdersListConfig,
} from './production'

// Painting Module (5 configs)
export {
  catalogListConfig,
  paintTypesListConfig,
  formulasListConfig,
  paintBrandsListConfig,
  productionsListConfig,
} from './painting'

// My Team Module (7 configs)
export {
  teamMembersListConfig,
  teamActivitiesListConfig,
  myTeamWarningsListConfig,
  myTeamBorrowsListConfig,
  myTeamPpeDeliveriesListConfig,
  teamCuttingListConfig,
} from './my-team'

// Personal Module (2 configs)
export {
  personalEmployeesListConfig,
  personalBorrowsListConfig,
} from './personal'

// Financial Module (3 configs)
export {
  billingListConfig,
  budgetListConfig,
  nfseListConfig,
} from './financial'
