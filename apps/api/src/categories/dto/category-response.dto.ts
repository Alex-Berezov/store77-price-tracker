/** Single category response */
export interface CategoryResponseDto {
  id: string;
  name: string;
  slug: string;
  url: string;
  parentId: string | null;
  /** Number of products in this category */
  productCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Category with children for hierarchical response */
export interface CategoryWithChildrenDto extends CategoryResponseDto {
  children: CategoryResponseDto[];
}

/** Categories list response */
export interface CategoriesListResponse {
  data: CategoryResponseDto[];
  total: number;
}

/** Hierarchical categories response */
export interface CategoriesTreeResponse {
  data: CategoryWithChildrenDto[];
  total: number;
}
