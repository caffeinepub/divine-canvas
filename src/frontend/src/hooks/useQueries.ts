import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CartItem, Product } from "../backend.d";
import { useActor } from "./useActor";

export function useGetAllProducts() {
  const { actor, isFetching } = useActor();
  return useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllProducts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      description,
      priceCents,
      category,
    }: {
      name: string;
      description: string;
      priceCents: bigint;
      category: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.addProduct(name, description, priceCents, category);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function usePlaceOrder() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      customerName,
      customerEmail,
      items,
    }: {
      customerName: string;
      customerEmail: string;
      items: Array<CartItem>;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.placeOrder(customerName, customerEmail, items);
    },
  });
}
