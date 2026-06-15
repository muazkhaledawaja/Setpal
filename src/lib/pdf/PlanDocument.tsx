import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { PlanWithDays } from "@/modules/workouts/workouts.types";
import type { MealPlanWithDays } from "@/modules/meal-plans/meal-plans.types";
import { mealMacros, dayMacros, itemMacros, roundMacros } from "@/modules/meal-plans/macros";

const styles = StyleSheet.create({
  page: { fontFamily: "IBMPlexArabic", fontSize: 10, padding: 32, color: "#1a2b2b" },
  header: { borderBottom: "2 solid #2f6f6f", paddingBottom: 8, marginBottom: 16 },
  brand: { fontSize: 16, fontWeight: "bold", color: "#2f6f6f" },
  title: { fontSize: 13, fontWeight: "bold", marginTop: 2 },
  desc: { fontSize: 9, color: "#666", marginTop: 2 },
  day: { marginBottom: 14 },
  dayHeader: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "#eef4f4", padding: 6, borderRadius: 3 },
  dayName: { fontWeight: "bold", fontSize: 11 },
  meta: { fontSize: 8, color: "#555" },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2, paddingHorizontal: 6, borderBottom: "0.5 solid #e5e5e5" },
  sub: { fontSize: 10, fontWeight: "bold", marginTop: 6, paddingHorizontal: 6 },
  footer: { position: "absolute", bottom: 20, left: 32, right: 32, textAlign: "center", fontSize: 8, color: "#999" },
});

function Wrapper({ brand, title, desc, children, rtl }: {
  brand: string; title: string; desc?: string | null; rtl: boolean; children: React.ReactNode;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={[styles.header, rtl ? { alignItems: "flex-end" } : {}]}>
          <Text style={styles.brand}>{brand}</Text>
          <Text style={styles.title}>{title}</Text>
          {desc ? <Text style={styles.desc}>{desc}</Text> : null}
        </View>
        {children}
        <Text style={styles.footer} fixed>Setpal</Text>
      </Page>
    </Document>
  );
}

export function WorkoutPlanDocument({ plan, locale, brand }: { plan: PlanWithDays; locale: string; brand: string }) {
  const ar = locale === "ar";
  return (
    <Wrapper brand={brand} rtl={ar} title={plan.name} desc={ar ? plan.description_ar : plan.description_en}>
      {plan.days.map((day) => (
        <View key={day.id} style={styles.day} wrap={false}>
          <View style={styles.dayHeader}>
            <Text style={styles.dayName}>{day.name}</Text>
            <Text style={styles.meta}>{day.is_rest ? (ar ? "راحة" : "Rest") : ""}</Text>
          </View>
          {!day.is_rest && day.exercises.map((ex) => (
            <View key={ex.id} style={styles.row}>
              <Text>{ex.exercise ? (ar ? ex.exercise.name_ar : ex.exercise.name_en) : "—"}</Text>
              <Text style={styles.meta}>{ex.sets} × {ex.rep_range}{ex.rest_seconds ? ` · ${ex.rest_seconds}s` : ""}</Text>
            </View>
          ))}
        </View>
      ))}
    </Wrapper>
  );
}

export function MealPlanDocument({ plan, locale, brand }: { plan: MealPlanWithDays; locale: string; brand: string }) {
  const ar = locale === "ar";
  const kcal = ar ? "سعرة" : "kcal";
  return (
    <Wrapper brand={brand} rtl={ar} title={plan.name} desc={ar ? plan.description_ar : plan.description_en}>
      {plan.days.map((day) => {
        const dt = roundMacros(dayMacros(day));
        return (
          <View key={day.id} style={styles.day} wrap={false}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayName}>{day.name}</Text>
              <Text style={styles.meta}>{dt.calories} {kcal} · P{dt.protein_g} C{dt.carbs_g} F{dt.fat_g}</Text>
            </View>
            {day.meals.map((meal) => {
              const mt = roundMacros(mealMacros(meal));
              return (
                <View key={meal.id}>
                  <Text style={styles.sub}>
                    {ar ? meal.name_ar : meal.name_en}{meal.time_label ? ` · ${meal.time_label}` : ""}  ({mt.calories} {kcal})
                  </Text>
                  {meal.items.map((it) => {
                    const im = it.food ? roundMacros(itemMacros(it.food, it.quantity_grams)) : null;
                    return (
                      <View key={it.id} style={styles.row}>
                        <Text>{it.food ? (ar ? it.food.name_ar : it.food.name_en) : "—"} · {it.quantity_grams}{ar ? "جم" : "g"}</Text>
                        <Text style={styles.meta}>{im ? `${im.calories} ${kcal}` : ""}</Text>
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        );
      })}
    </Wrapper>
  );
}
