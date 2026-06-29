import { dashboardStyles as styles } from "./dashboardStyles";
import CurrentStockTable from "./CurrentStockTable";
import MockPOSRecipeDeduction from "./MockPOSRecipeDeduction";
import TransactionLedger from "./TransactionLedger";

type Ingredient = {
  id: number;
  name: string;
  unit: string;
  par: number;
  price: number;
  property_id: number;
  property: string;
};

type RecipeDefinition = {
  name: string;
  ingredients: Array<{
    id: number;
    name: string;
    qty: number;
    unit: string;
  }>;
};

type TransactionLedgerEntry = {
  id: number;
  ingredientName: string;
  qty: number;
  unit: string;
  property: string;
  type: "receive" | "issue" | "consume" | "waste" | "adjust_add" | "adjust_remove";
  notes: string;
};

type StockRow = {
  ingredient: Ingredient;
  stock: number;
  parLevel: number;
  isLow: boolean;
};

type ChefViewProps = {
  currentIngredients: Ingredient[];
  stockRows: StockRow[];
  availableRecipes: RecipeDefinition[];
  recentConsumptionEntries: TransactionLedgerEntry[];
  chefRequests?: any;
  emptyMessage: string;
  onRaiseRequest: (ingredientId: number) => void;
  onMarkDishPrepared: (dishName: string, quantity: number) => Promise<void> | void;
};

export default function ChefView({
  currentIngredients,
  stockRows,
  availableRecipes,
  recentConsumptionEntries,
  emptyMessage,
  onRaiseRequest,
  onMarkDishPrepared,
}: ChefViewProps) {
  return (
    <>
      <section style={styles.gridSingle}>
        <MockPOSRecipeDeduction
          currentIngredients={currentIngredients}
          availableRecipes={availableRecipes}
          emptyMessage={emptyMessage}
          onMarkDishPrepared={onMarkDishPrepared}
        />
      </section>

      <section style={styles.gridTwo}>
        <CurrentStockTable rows={stockRows} emptyMessage={emptyMessage} onRaiseRequest={onRaiseRequest} />
      </section>

      <section style={styles.gridTwo}>
        <TransactionLedger
          entries={recentConsumptionEntries}
          title="Recent Consumption Transactions"
          subtitle="Most recent recipe deductions for the selected property"
        />
      </section>
    </>
  );
}
