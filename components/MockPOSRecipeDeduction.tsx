"use client";

import { useMemo, useState } from "react";
import { dashboardStyles as styles } from "./dashboardStyles";
import type { Ingredient, RecipeDefinition } from "../types";

type MockPOSRecipeDeductionProps = {
  currentIngredients: Ingredient[];
  availableRecipes: RecipeDefinition[];
  emptyMessage: string;
  onMarkDishPrepared: (dishName: string, quantity: number) => Promise<void> | void;
};

export default function MockPOSRecipeDeduction({
  currentIngredients,
  availableRecipes,
  emptyMessage,
  onMarkDishPrepared,
}: MockPOSRecipeDeductionProps) {
  const [mockDish, setMockDish] = useState(availableRecipes[0]?.name ?? "");
  const [mockDishQuantity, setMockDishQuantity] = useState("1");

  const canRenderForm = currentIngredients.length > 0 && availableRecipes.length > 0;
  const selectedRecipe = useMemo(
    () => availableRecipes.find((recipe) => recipe.name === mockDish) ?? availableRecipes[0] ?? null,
    [availableRecipes, mockDish],
  );

  return (
    <div style={styles.card} className="dashboard-card">
      <div style={styles.cardHeader}>
        <div>
          <h2 style={styles.cardTitle}>Mock POS / Recipe Deduction</h2>
          <p style={styles.cardSubtitle}>Automatically deduct ingredients when a dish is prepared.</p>
        </div>
      </div>

      <div style={styles.formGrid}>
        {!canRenderForm ? (
          <div style={{ ...styles.emptyState, gridColumn: "1 / -1" }}>{emptyMessage}</div>
        ) : (
          <>
            <label style={styles.fieldBlock}>
              <span style={styles.fieldLabel}>Dish</span>
              <select
                value={selectedRecipe?.name ?? ""}
                onChange={(e) => setMockDish(e.target.value)}
                style={styles.input}
                className="dashboard-input"
              >
                {availableRecipes.map((recipe) => (
                  <option key={recipe.name} value={recipe.name}>
                    {recipe.name}
                  </option>
                ))}
              </select>
            </label>

            <label style={styles.fieldBlock}>
              <span style={styles.fieldLabel}>Dishes Prepared</span>
              <input
                placeholder="Qty"
                value={mockDishQuantity}
                onChange={(e) => setMockDishQuantity(e.target.value)}
                style={styles.input}
                className="dashboard-input"
              />
            </label>

            <button
              onClick={() => {
                if (!selectedRecipe) return;
                const quantity = Number(mockDishQuantity);
                if (Number.isNaN(quantity) || quantity <= 0) return;
                void onMarkDishPrepared(selectedRecipe.name, quantity);
              }}
              style={styles.primaryButton}
              className="dashboard-button"
              disabled={!selectedRecipe}
            >
              Mark Dish Prepared
            </button>
          </>
        )}
      </div>
    </div>
  );
}
