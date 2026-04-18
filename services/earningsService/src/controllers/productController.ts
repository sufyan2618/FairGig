import type { Request, Response } from 'express';
import { and, asc, count, desc, eq, ilike, or } from 'drizzle-orm';
import { db } from '../lib/db.js';
import { productsTable } from '../db/schema.js';
import type { CreateProductInput, ProductQuery, UpdateProductInput } from '../types/products.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;

const seedProducts: CreateProductInput[] = [
	{
		title: 'Minimal Leather Wallet',
		description: 'Compact RFID-safe wallet made from full-grain leather.',
		quantity: 120,
		price: 3900,
		imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93',
		slug: 'minimal-leather-wallet',
	},
	{
		title: 'Wireless Mechanical Keyboard',
		description: '75% layout keyboard with hot-swappable switches and Bluetooth.',
		quantity: 42,
		price: 11900,
		imageUrl: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef',
		slug: 'wireless-mechanical-keyboard',
	},
	{
		title: 'Noise Cancelling Headphones',
		description: 'Over-ear wireless headphones with 40-hour battery life.',
		quantity: 65,
		price: 18500,
		imageUrl: 'https://images.unsplash.com/photo-1545127398-14699f92334b',
		slug: 'noise-cancelling-headphones',
	},
	{
		title: 'Running Sneakers Pro',
		description: 'Lightweight daily trainer with breathable mesh upper.',
		quantity: 90,
		price: 7900,
		imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
		slug: 'running-sneakers-pro',
	},
	{
		title: 'Smart Fitness Watch',
		description: 'Heart-rate, GPS, sleep tracking and 7-day battery backup.',
		quantity: 58,
		price: 14900,
		imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
		slug: 'smart-fitness-watch',
	},
];

const normalizeSlug = (value: string): string =>
	value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-');

const parsePositiveInt = (value: string | undefined, fallback: number): number => {
	if (!value) {
		return fallback;
	}

	const parsed = Number.parseInt(value, 10);
	if (Number.isNaN(parsed) || parsed < 1) {
		return fallback;
	}

	return parsed;
};

const ensureUniqueSlug = async (baseSlug: string, excludedId?: number): Promise<string> => {
	let suffix = 0;

	while (true) {
		const candidate = suffix === 0 ? baseSlug : `${baseSlug}-${suffix}`;
		const existing = await db.select({ id: productsTable.id }).from(productsTable).where(eq(productsTable.slug, candidate)).limit(1);

		if (existing.length === 0) {
			return candidate;
		}

		if (excludedId && existing[0]?.id === excludedId) {
			return candidate;
		}

		suffix += 1;
	}
};

export const listProducts = async (req: Request<unknown, unknown, unknown, ProductQuery>, res: Response): Promise<void> => {
	try {
		const page = parsePositiveInt(req.query.page, DEFAULT_PAGE);
		const limit = Math.min(parsePositiveInt(req.query.limit, DEFAULT_LIMIT), MAX_LIMIT);
		const search = req.query.search?.trim();
		const sortBy = req.query.sortBy ?? 'createdAt';
		const order = req.query.order === 'asc' ? 'asc' : 'desc';

		const conditions = search
			? or(
				ilike(productsTable.title, `%${search}%`),
				ilike(productsTable.description, `%${search}%`),
			)
			: undefined;

		const sortColumn =
			sortBy === 'price'
				? productsTable.price
				: sortBy === 'title'
					? productsTable.title
					: productsTable.createdAt;

		const [products, totalResult] = await Promise.all([
			db
				.select()
				.from(productsTable)
				.where(conditions)
				.orderBy(order === 'asc' ? asc(sortColumn) : desc(sortColumn))
				.limit(limit)
				.offset((page - 1) * limit),
			db
				.select({ total: count() })
				.from(productsTable)
				.where(conditions),
		]);

		const total = totalResult[0]?.total ?? 0;

		res.status(200).json({
			success: true,
			data: products,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error('Failed to list products', error);
		res.status(500).json({ success: false, message: 'Failed to fetch products' });
	}
};

export const getProductById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
	try {
		const id = Number.parseInt(req.params.id, 10);
		if (Number.isNaN(id)) {
			res.status(400).json({ success: false, message: 'Invalid product id' });
			return;
		}

		const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id)).limit(1);
		if (!product) {
			res.status(404).json({ success: false, message: 'Product not found' });
			return;
		}

		res.status(200).json({ success: true, data: product });
	} catch (error) {
		console.error('Failed to fetch product', error);
		res.status(500).json({ success: false, message: 'Failed to fetch product' });
	}
};

export const createProduct = async (req: Request<unknown, unknown, CreateProductInput>, res: Response): Promise<void> => {
	try {
		const { title, description, quantity, price, imageUrl } = req.body;
		if (!title || !description || !imageUrl || quantity === undefined || price === undefined) {
			res.status(400).json({ success: false, message: 'Missing required fields' });
			return;
		}

		if (quantity < 0 || price < 0) {
			res.status(400).json({ success: false, message: 'Quantity and price must be non-negative' });
			return;
		}

		const baseSlug = normalizeSlug(req.body.slug || title);
		if (!baseSlug) {
			res.status(400).json({ success: false, message: 'Invalid slug/title' });
			return;
		}

		const slug = await ensureUniqueSlug(baseSlug);
		const [product] = await db
			.insert(productsTable)
			.values({
				title,
				description,
				quantity,
				price,
				imageUrl,
				slug,
			})
			.returning();

		res.status(201).json({ success: true, data: product, message: 'Product created' });
	} catch (error) {
		console.error('Failed to create product', error);
		res.status(500).json({ success: false, message: 'Failed to create product' });
	}
};

export const updateProduct = async (req: Request<{ id: string }, unknown, UpdateProductInput>, res: Response): Promise<void> => {
	try {
		const id = Number.parseInt(req.params.id, 10);
		if (Number.isNaN(id)) {
			res.status(400).json({ success: false, message: 'Invalid product id' });
			return;
		}

		const [existing] = await db.select().from(productsTable).where(eq(productsTable.id, id)).limit(1);
		if (!existing) {
			res.status(404).json({ success: false, message: 'Product not found' });
			return;
		}

		const updates: UpdateProductInput & { updatedAt: Date } = {
			...req.body,
			updatedAt: new Date(),
		};

		if (updates.title || updates.slug) {
			const baseSlug = normalizeSlug(updates.slug || updates.title || existing.title);
			updates.slug = await ensureUniqueSlug(baseSlug, id);
		}

		if (updates.quantity !== undefined && updates.quantity < 0) {
			res.status(400).json({ success: false, message: 'Quantity must be non-negative' });
			return;
		}

		if (updates.price !== undefined && updates.price < 0) {
			res.status(400).json({ success: false, message: 'Price must be non-negative' });
			return;
		}

		const [updated] = await db.update(productsTable).set(updates).where(eq(productsTable.id, id)).returning();
		res.status(200).json({ success: true, data: updated, message: 'Product updated' });
	} catch (error) {
		console.error('Failed to update product', error);
		res.status(500).json({ success: false, message: 'Failed to update product' });
	}
};

export const deleteProduct = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
	try {
		const id = Number.parseInt(req.params.id, 10);
		if (Number.isNaN(id)) {
			res.status(400).json({ success: false, message: 'Invalid product id' });
			return;
		}

		const [deleted] = await db.delete(productsTable).where(eq(productsTable.id, id)).returning();
		if (!deleted) {
			res.status(404).json({ success: false, message: 'Product not found' });
			return;
		}

		res.status(200).json({ success: true, message: 'Product deleted' });
	} catch (error) {
		console.error('Failed to delete product', error);
		res.status(500).json({ success: false, message: 'Failed to delete product' });
	}
};

export const seedInitialProducts = async (_req: Request, res: Response): Promise<void> => {
	try {
		const [{ total }] = await db.select({ total: count() }).from(productsTable);
		if (total > 0) {
			res.status(200).json({ success: true, message: 'Seed skipped. Products already exist.' });
			return;
		}

		const values = await Promise.all(
			seedProducts.map(async (product) => ({
				...product,
				slug: await ensureUniqueSlug(normalizeSlug(product.slug || product.title)),
			})),
		);

		const inserted = await db.insert(productsTable).values(values).returning();
		res.status(201).json({ success: true, data: inserted, message: 'Seed completed' });
	} catch (error) {
		console.error('Failed to seed products', error);
		res.status(500).json({ success: false, message: 'Failed to seed products' });
	}
};
