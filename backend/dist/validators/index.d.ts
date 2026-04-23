import { z } from 'zod';
export declare const RegisterSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    name: string;
}, {
    email: string;
    password: string;
    name: string;
}>;
export declare const LoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const CreateProductSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    price: z.ZodNumber;
    imageUrl: z.ZodOptional<z.ZodString>;
    totalStock: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    name: string;
    description: string;
    price: number;
    totalStock: number;
    imageUrl?: string | undefined;
}, {
    name: string;
    description: string;
    price: number;
    totalStock: number;
    imageUrl?: string | undefined;
}>;
export declare const ProductFilterSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodDefault<z.ZodEnum<["name", "price", "currentStock", "createdAt"]>>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    minStock: z.ZodOptional<z.ZodNumber>;
    maxPrice: z.ZodOptional<z.ZodNumber>;
    search: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    sortBy: "name" | "price" | "currentStock" | "createdAt";
    sortOrder: "asc" | "desc";
    search?: string | undefined;
    isActive?: boolean | undefined;
    minStock?: number | undefined;
    maxPrice?: number | undefined;
}, {
    limit?: number | undefined;
    search?: string | undefined;
    page?: number | undefined;
    sortBy?: "name" | "price" | "currentStock" | "createdAt" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
    isActive?: boolean | undefined;
    minStock?: number | undefined;
    maxPrice?: number | undefined;
}>;
export declare const CreateReservationSchema: z.ZodObject<{
    productId: z.ZodString;
    quantity: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    productId: string;
    quantity: number;
}, {
    productId: string;
    quantity: number;
}>;
export declare const CheckoutSchema: z.ZodObject<{
    reservationId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reservationId: string;
}, {
    reservationId: string;
}>;
export declare const ReservationFilterSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodDefault<z.ZodEnum<["createdAt", "expiresAt", "status"]>>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
    status: z.ZodOptional<z.ZodNativeEnum<{
        PENDING: "PENDING";
        COMPLETED: "COMPLETED";
        EXPIRED: "EXPIRED";
        CANCELLED: "CANCELLED";
    }>>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    sortBy: "status" | "createdAt" | "expiresAt";
    sortOrder: "asc" | "desc";
    status?: "PENDING" | "COMPLETED" | "EXPIRED" | "CANCELLED" | undefined;
}, {
    status?: "PENDING" | "COMPLETED" | "EXPIRED" | "CANCELLED" | undefined;
    limit?: number | undefined;
    page?: number | undefined;
    sortBy?: "status" | "createdAt" | "expiresAt" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export declare const UuidParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type ProductFilterInput = z.infer<typeof ProductFilterSchema>;
export type CreateReservationInput = z.infer<typeof CreateReservationSchema>;
export type CheckoutInput = z.infer<typeof CheckoutSchema>;
export type ReservationFilterInput = z.infer<typeof ReservationFilterSchema>;
//# sourceMappingURL=index.d.ts.map