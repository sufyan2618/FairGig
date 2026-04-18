import type { productsTable } from '../db/schema.js';

export type Product = typeof productsTable.$inferSelect;
export type NewProduct = typeof productsTable.$inferInsert;

export interface ProductQuery {
	page?: string;
	limit?: string;
	search?: string;
	sortBy?: 'createdAt' | 'price' | 'title';
	order?: 'asc' | 'desc';
}

export interface CreateProductInput {
	title: string;
	description: string;
	quantity: number;
	price: number;
	imageUrl: string;
	slug?: string;
}

export interface UpdateProductInput {
	title?: string;
	description?: string;
	quantity?: number;
	price?: number;
	imageUrl?: string;
	slug?: string;
}
