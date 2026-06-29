export type TransactionType = "receive" | "issue" | "consume" | "waste" | "adjust_add" | "adjust_remove";

export type PropertyRecord = {
  id: number;
  property_name: string;
};

export type IngredientRecord = {
  id: number;
  name: string;
  unit: string;
  par: number;
  par_level?: number;
  price: number;
  property_id: number;
};

export type Ingredient = IngredientRecord & {
  property: string;
};

export type Transaction = {
  id: number;
  ingredientId: number;
  type: TransactionType;
  qty: number;
  property: string;
  propertyId: number;
  notes: string;
};

export type RequestItem = {
  id: number;
  ingredientId: number;
  name: string;
  property: string;
  propertyId: number;
  qty: number;
  status: string;
  requestedBy: string;
  requestSource: string;
  createdByRole: string;
  notes: string;
};

export type FormState = {
  ingredientId: number;
  type: TransactionType;
  qty: string;
};

export type LoginCredentials = {
  role: string;
  username: string;
  password: string;
};

export type DashboardMetric = {
  label: string;
  value: string | number;
  accent: string;
  icon: string;
  hint: string;
};

export type RecipeIngredient = {
  id: number;
  name: string;
  qty: number;
  unit: string;
};

export type RecipeDefinition = {
  name: string;
  ingredients: RecipeIngredient[];
};

export type DishRecord = {
  id: number;
  dish_name: string;
};

export type RecipeRecord = {
  id: number;
  dish_id: number;
  ingredient_id: number;
  quantity_required: number;
};

export type UserRecord = {
  id: number;
  name: string;
  role: string;
  sub_role: string;
  password: string;
  property_id: number;
  created_at: string;
};

export type CreateUserInput = {
  name: string;
  role: string;
  subRole: string;
  password: string;
  propertyId: number;
  ingredientNames: string[];
};

export type LoggedInUser = {
  id: number;
  name: string;
  role: string;
  sub_role: string;
  property_id: number;
};

export type StockRow = {
  ingredient: Ingredient;
  stock: number;
  parLevel: number;
  isLow: boolean;
};

export type TransactionLedgerEntry = {
  id: number;
  ingredientName: string;
  qty: number;
  unit: string;
  property: string;
  type: TransactionType;
  notes: string;
};

export type ReconciliationSummary = {
  lowStockItems: number;
  pendingRequests: number;
  foodCost: number;
  approvedRequests: number;
  theoreticalConsumptionCost: number;
  actualConsumptionCost: number;
  wastageCost: number;
  variance: number;
};

export type RoleIngredient = {
  id: number;
  role: string;
  sub_role: string;
  ingredient_id: number;
  property_id: number;
};

export type DashboardSnapshot = {
  properties: PropertyRecord[];
  ingredients: Ingredient[];
  transactions: Transaction[];
  requests: RequestItem[];
  roleIngredients: RoleIngredient[];
  dishes: DishRecord[];
  recipes: RecipeRecord[];
};

export type DashboardMetrics = {
  lowStockItems: number;
  openRequests: number;
  pendingRequests: number;
  foodCost: number;
  approvedRequests: number;
  theoreticalConsumptionCost: number;
  actualConsumptionCost: number;
  wastageCost: number;
  variance: number;
};

export type DashboardMetricsSummary = DashboardMetrics;
