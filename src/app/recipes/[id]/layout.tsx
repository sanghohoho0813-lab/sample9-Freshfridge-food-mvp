import type { Metadata } from "next";
import type { ReactNode } from "react";
import { RECIPES } from "@/lib/demo-data";
import { recipeImage } from "@/lib/images";

/** 레시피는 정적 데이터라 서버에서 제목·설명을 바로 만들 수 있다 */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const recipe = RECIPES.find((r) => r.id === id);
  if (!recipe) return { title: "레시피를 찾지 못했어요" };
  return {
    title: recipe.name,
    description: recipe.description,
    openGraph: { title: recipe.name, description: recipe.description, images: [recipeImage(recipe.image)] },
  };
}

export function generateStaticParams() {
  return RECIPES.map((r) => ({ id: r.id }));
}

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
