import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Product {
    id: bigint;
    name: string;
    description: string;
    category: string;
    priceCents: bigint;
}
export interface CartItem {
    productId: bigint;
    quantity: bigint;
}
export interface backendInterface {
    _initializeAccessControlWithSecret(secret: string): Promise<void>;
    addProduct(name: string, description: string, priceCents: bigint, category: string): Promise<bigint>;
    getAllProducts(): Promise<Array<Product>>;
    placeOrder(customerName: string, customerEmail: string, items: Array<CartItem>): Promise<bigint>;
}
