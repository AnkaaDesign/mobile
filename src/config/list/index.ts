// Re-export all list configurations from their respective modules

// Administration Module (7 configs)
export {
  customersListConfig,
  sectorsListConfig,
  notificationsListConfig,
  collaboratorsListConfig,
  changeLogsListConfig,
  filesListConfig,
  deploymentsListConfig,
} from './administration'

// HR Module (9 configs)
export {
  employeesListConfig,
  warningsListConfig,
  vacationsListConfig,
  positionsListConfig,
  ppeDeliveriesListConfig,
  ppeSchedulesListConfig,
  ppeSizesListConfig,
  holidaysListConfig,
  ppeItemsListConfig,
} from './hr'

// Inventory Module (10 configs)
export {
  itemsListConfig,
  ordersListConfig,
  borrowsListConfig,
  activitiesListConfig,
  externalWithdrawalsListConfig,
  suppliersListConfig,
  categoriesListConfig,
  brandsListConfig,
  maintenanceListConfig,
  orderSchedulesListConfig,
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

// My Team Module (8 configs)
export {
  teamMembersListConfig,
  teamActivitiesListConfig,
  teamVacationsListConfig,
  myTeamWarningsListConfig,
  myTeamBorrowsListConfig,
  myTeamPpeDeliveriesListConfig,
  teamCuttingListConfig,
  teamCommissionsListConfig,
} from './my-team'

// Personal Module (2 configs)
export {
  personalEmployeesListConfig,
  personalBorrowsListConfig,
} from './personal'
