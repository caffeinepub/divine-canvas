import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  ClipboardList,
  Loader2,
  LogIn,
  LogOut,
  Minus,
  PackageSearch,
  Palette,
  Plus,
  ShoppingCart,
  Sparkles,
  Star,
  Upload,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import type { Product } from "./backend.d";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import {
  useAddProduct,
  useGetAllProducts,
  usePlaceOrder,
} from "./hooks/useQueries";
import { ExternalBlob } from "./lib/blob-storage";

// ── Types ──────────────────────────────────────────────────────────────────
interface CartEntry {
  product: Product;
  quantity: number;
  imageUrl: string;
}

interface StoredOrder {
  orderId: string;
  customerName: string;
  customerEmail: string;
  phone: string;
  address: string;
  items: Array<{ name: string; qty: number; priceCents: number }>;
  totalCents: number;
  timestamp: string;
}

// ── Image Helpers ─────────────────────────────────────────────────────────
const IMAGE_KEY = (id: bigint) => `divine_canvas_image_${id}`;
const ORDERS_KEY = "divine_canvas_orders";

function getProductImage(productId: bigint): string {
  return localStorage.getItem(IMAGE_KEY(productId)) ?? "";
}

function saveProductImage(productId: bigint, url: string) {
  localStorage.setItem(IMAGE_KEY(productId), url);
}

function getStoredOrders(): StoredOrder[] {
  try {
    return JSON.parse(localStorage.getItem(ORDERS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveOrder(order: StoredOrder) {
  const orders = getStoredOrders();
  orders.unshift(order);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

// ── Sample products shown before backend loads ────────────────────────────
const SAMPLE_PRODUCTS = [
  {
    id: -1n,
    name: "Navadurga Maha-Mandala",
    description:
      "All 9 forms of the Goddess in one sacred circular composition.",
    category: "Mandala",
    priceCents: 4999n,
    sampleImage: "/assets/generated/navadurga-mandala.dim_400x400.jpg",
  },
  {
    id: -2n,
    name: "Maa Kalaratri — Dark Cosmic",
    description:
      "Limited edition lightning aura print of the fierce destroyer.",
    category: "Goddess Portrait",
    priceCents: 2999n,
    sampleImage: "/assets/generated/maa-kalaratri.dim_400x400.jpg",
  },
  {
    id: -3n,
    name: "Siddhidatri Blessing",
    description: "Soft-tone spiritual wall art for meditation rooms.",
    category: "Deity Art",
    priceCents: 2999n,
    sampleImage: "/assets/generated/siddhidatri.dim_400x400.jpg",
  },
];

// ── Cart Hook ─────────────────────────────────────────────────────────────
function useCart() {
  const [items, setItems] = useState<CartEntry[]>([]);

  const addToCart = useCallback((product: Product, imageUrl: string) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { product, quantity: 1, imageUrl }];
    });
    toast.success(`${product.name} added to cart`, {
      description: "Your sacred art awaits.",
    });
  }, []);

  const updateQty = useCallback((productId: bigint, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) =>
          i.product.id === productId
            ? { ...i, quantity: i.quantity + delta }
            : i,
        )
        .filter((i) => i.quantity > 0),
    );
  }, []);

  const removeItem = useCallback((productId: bigint) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalCents = items.reduce(
    (sum, i) => sum + Number(i.product.priceCents) * i.quantity,
    0,
  );
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return {
    items,
    addToCart,
    updateQty,
    removeItem,
    clearCart,
    totalCents,
    count,
  };
}

// ── Price formatter ────────────────────────────────────────────────────────
function formatPrice(cents: bigint | number): string {
  return `$${(Number(cents) / 100).toFixed(2)}`;
}

// ══════════════════════════════════════════════════════════════════════════
// Main App
// ══════════════════════════════════════════════════════════════════════════
export default function App() {
  const { identity, login, clear, isLoggingIn, isInitializing } =
    useInternetIdentity();
  const isAdmin = !!identity;

  const {
    items,
    addToCart,
    updateQty,
    removeItem,
    clearCart,
    totalCents,
    count,
  } = useCart();
  const { data: backendProducts, isLoading: productsLoading } =
    useGetAllProducts();
  const addProductMutation = useAddProduct();
  const placeOrderMutation = usePlaceOrder();

  const [cartOpen, setCartOpen] = useState(false);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [addArtworkOpen, setAddArtworkOpen] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Order form state
  const [orderName, setOrderName] = useState("");
  const [orderEmail, setOrderEmail] = useState("");
  const [orderPhone, setOrderPhone] = useState("");
  const [orderAddress, setOrderAddress] = useState("");

  // Add artwork form state
  const [artTitle, setArtTitle] = useState("");
  const [artDesc, setArtDesc] = useState("");
  const [artCategory, setArtCategory] = useState("");
  const [artPrice, setArtPrice] = useState("");
  const [artFile, setArtFile] = useState<File | null>(null);
  const [artPreview, setArtPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Decide which products to show
  const realProducts: Product[] = backendProducts ?? [];
  const showSamples = !productsLoading && realProducts.length === 0;

  const scrollToShop = () => {
    document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
  };

  // ── File selection ────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setArtFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setArtPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  // ── Add artwork submit ────────────────────────────────────────────────
  const handleAddArtwork = async () => {
    if (!artTitle || !artPrice) {
      toast.error("Please fill in title and price.");
      return;
    }
    const priceCents = BigInt(Math.round(Number.parseFloat(artPrice) * 100));
    setUploadProgress(10);
    try {
      let imageUrl = "";
      if (artFile) {
        setUploadProgress(30);
        const blob = await ExternalBlob.fromFile(artFile);
        setUploadProgress(70);
        imageUrl = blob.getDirectURL();
      }
      setUploadProgress(85);
      const productId = await addProductMutation.mutateAsync({
        name: artTitle,
        description: artDesc,
        priceCents,
        category: artCategory,
      });
      if (imageUrl) saveProductImage(productId, imageUrl);
      setUploadProgress(100);
      toast.success(`"${artTitle}" added to your collection!`);
      setAddArtworkOpen(false);
      setArtTitle("");
      setArtDesc("");
      setArtCategory("");
      setArtPrice("");
      setArtFile(null);
      setArtPreview(null);
      setUploadProgress(0);
    } catch {
      toast.error("Failed to add artwork. Please try again.");
      setUploadProgress(0);
    }
  };

  // ── Place order submit ────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    if (!orderName || !orderEmail) {
      toast.error("Please enter your name and email.");
      return;
    }
    try {
      const cartItems = items.map((i) => ({
        productId: i.product.id,
        quantity: BigInt(i.quantity),
      }));
      const orderId = await placeOrderMutation.mutateAsync({
        customerName: orderName,
        customerEmail: orderEmail,
        items: cartItems,
      });
      const orderRecord: StoredOrder = {
        orderId: orderId.toString(),
        customerName: orderName,
        customerEmail: orderEmail,
        phone: orderPhone,
        address: orderAddress,
        items: items.map((i) => ({
          name: i.product.name,
          qty: i.quantity,
          priceCents: Number(i.product.priceCents),
        })),
        totalCents,
        timestamp: new Date().toISOString(),
      };
      saveOrder(orderRecord);
      setSuccessOrderId(orderId.toString());
      clearCart();
      setOrderName("");
      setOrderEmail("");
      setOrderPhone("");
      setOrderAddress("");
    } catch {
      toast.error("Failed to place order. Please try again.");
    }
  };

  // ── Render product card ───────────────────────────────────────────────
  const renderProductCard = (
    product: Product,
    idx: number,
    imageUrl: string,
    isSample = false,
  ) => (
    <motion.div
      key={String(product.id)}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: idx * 0.12 }}
      whileHover={{ y: -8 }}
      className="group bg-card rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-shadow duration-300 border border-border/60"
      data-ocid={`shop.card.item.${idx + 1}`}
    >
      <div className="relative overflow-hidden aspect-square bg-cream-dark">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-maroon/10 to-gold/20">
            <Palette className="h-16 w-16 text-maroon/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-maroon/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {isSample && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-gold text-black text-[10px] font-bold px-2 py-0.5 flex items-center gap-1">
              <Star className="h-2.5 w-2.5" /> Featured
            </Badge>
          </div>
        )}
        <div className="absolute top-2 left-2">
          <Badge
            variant="secondary"
            className="bg-black/40 text-white border-0 text-[10px] backdrop-blur-sm"
          >
            {product.category}
          </Badge>
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-display text-lg font-semibold text-foreground mb-1 leading-snug">
          {product.name}
        </h3>
        <p className="text-muted-foreground text-sm mb-4 leading-relaxed line-clamp-2">
          {product.description}
        </p>
        <div className="flex items-center justify-between gap-3">
          <span className="font-display text-2xl font-bold text-maroon">
            {formatPrice(product.priceCents)}
          </span>
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => addToCart(product, imageUrl)}
              disabled={isSample}
              className="bg-gold hover:bg-gold-bright text-black font-bold tracking-wide hover:shadow-gold-sm transition-all disabled:opacity-50"
              data-ocid={`shop.add_to_cart.button.${idx + 1}`}
            >
              {isSample ? "Coming Soon" : "Add to Cart"}
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-cream font-body">
      <Toaster position="top-right" richColors />

      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-maroon shadow-header border-b-4 border-gold">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold tracking-widest text-gold leading-none">
              THE DIVINE CANVAS
            </h1>
            <p className="text-gold/65 text-[10px] sm:text-xs font-serif tracking-wider mt-0.5">
              Sacred Art &amp; Navadurga Mandalas
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Admin login/logout */}
            {isAdmin ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAdminPanelOpen(true)}
                  className="text-gold/80 hover:text-gold hover:bg-white/10 text-xs font-semibold tracking-wide"
                  data-ocid="header.admin.button"
                >
                  <Palette className="h-3.5 w-3.5 mr-1" /> Admin
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clear}
                  className="text-gold/60 hover:text-gold hover:bg-white/10 text-xs"
                  data-ocid="header.logout.button"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={login}
                disabled={isLoggingIn || isInitializing}
                className="text-gold/70 hover:text-gold hover:bg-white/10 text-xs font-semibold"
                data-ocid="header.login.button"
              >
                {isLoggingIn ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <LogIn className="h-3.5 w-3.5 mr-1" />
                )}
                Admin
              </Button>
            )}

            {/* Cart button */}
            <Button
              variant="ghost"
              size="icon"
              className="relative text-gold hover:text-gold-bright hover:bg-white/10"
              onClick={() => setCartOpen(true)}
              data-ocid="header.cart.button"
            >
              <ShoppingCart className="h-5 w-5" />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    key="badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1"
                  >
                    <Badge className="h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-gold text-black font-bold rounded-full">
                      {count}
                    </Badge>
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </div>
      </header>

      {/* ══ HERO ══════════════════════════════════════════════════════════ */}
      <section
        className="relative min-h-screen flex items-center justify-center text-white overflow-hidden pt-16"
        style={{
          backgroundImage: "url('/assets/generated/hero-bg.dim_1400x700.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black/80" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />

        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          >
            <p className="text-gold/80 text-sm font-serif tracking-[0.4em] uppercase mb-5">
              ✦ Jai Maa Durga ✦
            </p>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-5">
              Experience the{" "}
              <span className="text-gold drop-shadow-[0_0_15px_rgba(212,175,55,0.6)]">
                9 Forms
              </span>{" "}
              of Adi Shakti
            </h2>
            <p className="font-serif text-lg sm:text-xl text-white/80 mb-10 max-w-xl mx-auto leading-relaxed">
              Bringing ancient Hindu spirituality to breathtaking modern digital
              realism.
            </p>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Button
                onClick={scrollToShop}
                className="bg-gold hover:bg-gold-bright text-black font-bold text-base px-10 py-6 tracking-widest uppercase transition-all hover:shadow-gold"
                data-ocid="hero.browse.button"
              >
                Browse Collection
              </Button>
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        >
          <div className="w-6 h-10 border-2 border-gold/50 rounded-full flex items-start justify-center p-1.5">
            <div className="w-1 h-2.5 bg-gold/70 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* ══ SHOP GALLERY ═════════════════════════════════════════════════ */}
      <section id="shop" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <p className="text-gold-dim font-serif tracking-[0.3em] uppercase text-sm mb-2">
              ✦ Curated Collection ✦
            </p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-maroon">
              Our Masterpieces
            </h2>
            <div className="mt-4 flex items-center justify-center gap-3">
              <div className="h-px w-20 bg-gold/40" />
              <span className="text-gold text-lg">✦</span>
              <div className="h-px w-20 bg-gold/40" />
            </div>
          </motion.div>

          {/* Loading skeleton */}
          {productsLoading && (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
              data-ocid="shop.loading_state"
            >
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="bg-card rounded-xl overflow-hidden border border-border/60"
                >
                  <div className="aspect-square bg-cream-dark animate-pulse" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-cream-dark rounded animate-pulse w-3/4" />
                    <div className="h-4 bg-cream-dark rounded animate-pulse w-full" />
                    <div className="h-4 bg-cream-dark rounded animate-pulse w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Real products */}
          {!productsLoading && realProducts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {realProducts.map((product, idx) =>
                renderProductCard(product, idx, getProductImage(product.id)),
              )}
            </div>
          )}

          {/* Sample / fallback products */}
          {showSamples && (
            <>
              <p className="text-center text-muted-foreground font-serif italic mb-8 text-sm">
                ✦ Featured works — contact us for custom orders ✦
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {SAMPLE_PRODUCTS.map((p, idx) =>
                  renderProductCard(
                    {
                      id: p.id,
                      name: p.name,
                      description: p.description,
                      category: p.category,
                      priceCents: p.priceCents,
                    },
                    idx,
                    p.sampleImage,
                    true,
                  ),
                )}
              </div>
              <div
                className="text-center mt-12 p-8 bg-card border border-border/60 rounded-xl max-w-lg mx-auto"
                data-ocid="shop.empty_state"
              >
                <PackageSearch className="h-10 w-10 text-gold/60 mx-auto mb-3" />
                <p className="font-display text-lg text-maroon font-semibold">
                  Want something unique?
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  Admin can add real artworks via the Admin panel. Login to get
                  started.
                </p>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ══ FOOTER ═══════════════════════════════════════════════════════ */}
      <footer className="bg-[#1a0a0a] text-white text-center py-10 px-4 mt-4 border-t-4 border-gold/40">
        <p className="font-display text-maroon-light text-sm mb-3 tracking-wider">
          ✦ THE DIVINE CANVAS ✦
        </p>
        <p className="font-serif text-sm text-white/60 mb-2">
          © {new Date().getFullYear()} Divine Canvas Art Studio. All Rights
          Reserved.
        </p>
        <p className="text-xs text-white/35">
          Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 hover:text-white/60 transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>

      {/* ══ CART SHEET ══════════════════════════════════════════════════ */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md flex flex-col p-0"
          data-ocid="cart.sheet"
        >
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
            <SheetTitle className="font-display text-maroon text-xl flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-gold" /> Your Sacred
              Collection
            </SheetTitle>
          </SheetHeader>

          <ScrollArea className="flex-1 px-6">
            <AnimatePresence mode="popLayout">
              {items.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-52 text-center py-10"
                  data-ocid="cart.empty_state"
                >
                  <Sparkles className="h-10 w-10 text-gold mb-3 opacity-50" />
                  <p className="text-muted-foreground font-serif text-lg">
                    Your cart is empty
                  </p>
                  <p className="text-muted-foreground/60 text-sm mt-1">
                    Add sacred art to begin your journey
                  </p>
                </motion.div>
              ) : (
                <div className="py-4 space-y-1">
                  {items.map((item) => (
                    <motion.div
                      key={String(item.product.id)}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex gap-3 py-3"
                    >
                      <div className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-cream-dark">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Palette className="h-6 w-6 text-maroon/30" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">
                          {item.product.name}
                        </p>
                        <p className="text-maroon font-bold text-sm mt-0.5">
                          {formatPrice(
                            BigInt(
                              Number(item.product.priceCents) * item.quantity,
                            ),
                          )}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6 border-gold/40 hover:border-gold"
                            onClick={() => updateQty(item.product.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm font-medium w-5 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6 border-gold/40 hover:border-gold"
                            onClick={() => updateQty(item.product.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0 self-start mt-1"
                        onClick={() => removeItem(item.product.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </ScrollArea>

          {items.length > 0 && (
            <div className="px-6 pb-6 pt-4 border-t border-border space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-display text-lg text-foreground">
                  Subtotal
                </span>
                <span className="font-display text-xl font-bold text-maroon">
                  {formatPrice(totalCents)}
                </span>
              </div>
              <Button
                className="w-full bg-gold hover:bg-gold-bright text-black font-bold tracking-wide hover:shadow-gold transition-all"
                onClick={() => {
                  setCartOpen(false);
                  setOrderDialogOpen(true);
                }}
                data-ocid="cart.checkout.button"
              >
                Place Order
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ══ ORDER FORM DIALOG ════════════════════════════════════════════ */}
      <Dialog
        open={orderDialogOpen}
        onOpenChange={(o) => {
          setOrderDialogOpen(o);
          if (!o) setSuccessOrderId(null);
        }}
      >
        <DialogContent className="sm:max-w-md" data-ocid="order.form.dialog">
          <DialogHeader>
            <DialogTitle className="font-display text-maroon text-xl">
              {successOrderId ? "Order Placed! 🙏" : "Place Your Order"}
            </DialogTitle>
          </DialogHeader>

          {successOrderId ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
              data-ocid="order.success_state"
            >
              <div className="text-5xl mb-4">✦</div>
              <p className="font-serif text-lg text-foreground mb-2">
                Thank you, your sacred order has been received.
              </p>
              <p className="text-muted-foreground text-sm mb-1">
                Order Reference:{" "}
                <span className="font-bold text-maroon">#{successOrderId}</span>
              </p>
              <p className="text-muted-foreground text-sm">
                We'll be in touch shortly.
              </p>
              <Button
                className="mt-6 bg-gold hover:bg-gold-bright text-black font-bold"
                onClick={() => {
                  setOrderDialogOpen(false);
                  setSuccessOrderId(null);
                }}
                data-ocid="order.close.button"
              >
                Continue Shopping
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="order-name" className="text-sm font-medium">
                  Full Name *
                </Label>
                <Input
                  id="order-name"
                  value={orderName}
                  onChange={(e) => setOrderName(e.target.value)}
                  placeholder="Your full name"
                  className="mt-1"
                  data-ocid="order.name.input"
                />
              </div>
              <div>
                <Label htmlFor="order-email" className="text-sm font-medium">
                  Email *
                </Label>
                <Input
                  id="order-email"
                  type="email"
                  value={orderEmail}
                  onChange={(e) => setOrderEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1"
                  data-ocid="order.email.input"
                />
              </div>
              <div>
                <Label htmlFor="order-phone" className="text-sm font-medium">
                  Phone
                </Label>
                <Input
                  id="order-phone"
                  type="tel"
                  value={orderPhone}
                  onChange={(e) => setOrderPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="mt-1"
                  data-ocid="order.phone.input"
                />
              </div>
              <div>
                <Label htmlFor="order-address" className="text-sm font-medium">
                  Shipping Address
                </Label>
                <Textarea
                  id="order-address"
                  value={orderAddress}
                  onChange={(e) => setOrderAddress(e.target.value)}
                  placeholder="Street, City, State, ZIP, Country"
                  rows={3}
                  className="mt-1 resize-none"
                  data-ocid="order.address.textarea"
                />
              </div>
              <Separator />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">
                  Order Summary
                </p>
                {items.map((i) => (
                  <div
                    key={String(i.product.id)}
                    className="flex justify-between"
                  >
                    <span>
                      {i.product.name} × {i.quantity}
                    </span>
                    <span>
                      {formatPrice(
                        BigInt(Number(i.product.priceCents) * i.quantity),
                      )}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-maroon mt-2 pt-2 border-t border-border">
                  <span>Total</span>
                  <span>{formatPrice(totalCents)}</span>
                </div>
              </div>
              <Button
                className="w-full bg-gold hover:bg-gold-bright text-black font-bold hover:shadow-gold transition-all"
                onClick={handlePlaceOrder}
                disabled={placeOrderMutation.isPending}
                data-ocid="order.submit.button"
              >
                {placeOrderMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Placing
                    Order...
                  </>
                ) : (
                  "Confirm Order"
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ══ ADMIN PANEL DIALOG ══════════════════════════════════════════ */}
      <Dialog open={adminPanelOpen} onOpenChange={setAdminPanelOpen}>
        <DialogContent
          className="max-w-3xl max-h-[90vh] flex flex-col"
          data-ocid="admin.panel.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-maroon text-xl flex items-center gap-2">
              <Palette className="h-5 w-5 text-gold" /> Admin Panel
            </DialogTitle>
          </DialogHeader>

          <Tabs
            defaultValue="artworks"
            className="flex-1 flex flex-col min-h-0"
          >
            <TabsList className="mb-4">
              <TabsTrigger value="artworks" data-ocid="admin.artworks.tab">
                <Palette className="h-4 w-4 mr-1.5" /> My Artworks
              </TabsTrigger>
              <TabsTrigger value="orders" data-ocid="admin.orders.tab">
                <ClipboardList className="h-4 w-4 mr-1.5" /> Orders
              </TabsTrigger>
            </TabsList>

            {/* ── ARTWORKS TAB ── */}
            <TabsContent
              value="artworks"
              className="flex-1 flex flex-col min-h-0"
            >
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">
                  {realProducts.length} artwork
                  {realProducts.length !== 1 ? "s" : ""} in your collection
                </p>
                <Button
                  onClick={() => setAddArtworkOpen(true)}
                  className="bg-gold hover:bg-gold-bright text-black font-bold hover:shadow-gold-sm"
                  data-ocid="admin.add_artwork.button"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add New Artwork
                </Button>
              </div>

              <ScrollArea className="flex-1">
                {realProducts.length === 0 ? (
                  <div
                    className="text-center py-12"
                    data-ocid="admin.artworks.empty_state"
                  >
                    <Palette className="h-10 w-10 text-gold/40 mx-auto mb-3" />
                    <p className="font-display text-maroon">No artworks yet</p>
                    <p className="text-muted-foreground text-sm mt-1">
                      Add your first artwork above
                    </p>
                  </div>
                ) : (
                  <div
                    className="space-y-3 pr-2"
                    data-ocid="admin.artworks.list"
                  >
                    {realProducts.map((p, idx) => (
                      <motion.div
                        key={String(p.id)}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex gap-3 p-3 bg-cream rounded-lg border border-border/60"
                        data-ocid={`admin.artwork.item.${idx + 1}`}
                      >
                        <div className="w-14 h-14 rounded-md overflow-hidden flex-shrink-0 bg-cream-dark">
                          {getProductImage(p.id) ? (
                            <img
                              src={getProductImage(p.id)}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Palette className="h-5 w-5 text-maroon/30" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">
                            {p.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {p.category}
                          </p>
                          <p className="text-maroon font-bold text-sm mt-0.5">
                            {formatPrice(p.priceCents)}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* ── ORDERS TAB ── */}
            <TabsContent
              value="orders"
              className="flex-1 flex flex-col min-h-0"
            >
              <AdminOrdersTab />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* ══ ADD ARTWORK DIALOG ══════════════════════════════════════════ */}
      <Dialog open={addArtworkOpen} onOpenChange={setAddArtworkOpen}>
        <DialogContent className="sm:max-w-lg" data-ocid="admin.artwork.dialog">
          <DialogHeader>
            <DialogTitle className="font-display text-maroon text-xl">
              Add New Artwork
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="art-title" className="text-sm font-medium">
                Title *
              </Label>
              <Input
                id="art-title"
                value={artTitle}
                onChange={(e) => setArtTitle(e.target.value)}
                placeholder="e.g. Maa Durga on Tiger"
                className="mt-1"
                data-ocid="admin.artwork.title.input"
              />
            </div>
            <div>
              <Label htmlFor="art-desc" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="art-desc"
                value={artDesc}
                onChange={(e) => setArtDesc(e.target.value)}
                placeholder="Describe your sacred artwork..."
                rows={3}
                className="mt-1 resize-none"
                data-ocid="admin.artwork.description.textarea"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="art-cat" className="text-sm font-medium">
                  Category
                </Label>
                <Input
                  id="art-cat"
                  value={artCategory}
                  onChange={(e) => setArtCategory(e.target.value)}
                  placeholder="e.g. Mandala"
                  className="mt-1"
                  data-ocid="admin.artwork.category.input"
                />
              </div>
              <div>
                <Label htmlFor="art-price" className="text-sm font-medium">
                  Price (USD) *
                </Label>
                <Input
                  id="art-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={artPrice}
                  onChange={(e) => setArtPrice(e.target.value)}
                  placeholder="e.g. 39.99"
                  className="mt-1"
                  data-ocid="admin.artwork.price.input"
                />
              </div>
            </div>

            {/* Image upload */}
            <div>
              <Label className="text-sm font-medium">Artwork Image</Label>
              <label
                htmlFor="art-image-upload"
                className="mt-1 border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-gold/60 transition-colors relative block"
                data-ocid="admin.artwork.image.upload_button"
              >
                <input
                  ref={fileInputRef}
                  id="art-image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {artPreview ? (
                  <div className="relative">
                    <img
                      src={artPreview}
                      alt="Preview"
                      className="max-h-32 mx-auto rounded-md object-contain"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {artFile?.name}
                    </p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-gold/50 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload artwork image
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">
                      JPG, PNG, WebP supported
                    </p>
                  </>
                )}
              </label>
            </div>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div data-ocid="admin.artwork.loading_state">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1 text-center">
                  Uploading... {uploadProgress}%
                </p>
              </div>
            )}

            <Button
              className="w-full bg-gold hover:bg-gold-bright text-black font-bold hover:shadow-gold transition-all"
              onClick={handleAddArtwork}
              disabled={addProductMutation.isPending}
              data-ocid="admin.artwork.submit.button"
            >
              {addProductMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Adding...
                </>
              ) : (
                "Add Artwork"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Admin Orders Sub-component ────────────────────────────────────────────
function AdminOrdersTab() {
  const orders = getStoredOrders();

  if (orders.length === 0) {
    return (
      <div className="text-center py-12" data-ocid="admin.orders.empty_state">
        <ClipboardList className="h-10 w-10 text-gold/40 mx-auto mb-3" />
        <p className="font-display text-maroon">No orders yet</p>
        <p className="text-muted-foreground text-sm mt-1">
          Orders will appear here once customers check out
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="space-y-3 pr-2" data-ocid="admin.orders.list">
        {orders.map((order, idx) => (
          <motion.div
            key={order.orderId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="p-4 bg-cream rounded-lg border border-border/60"
            data-ocid={`admin.order.item.${idx + 1}`}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-semibold text-sm text-foreground">
                  {order.customerName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {order.customerEmail}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-maroon text-sm">
                  {formatPrice(order.totalCents)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(order.timestamp).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground space-y-0.5">
              {order.items.map((item, i) => (
                <p key={`${item.name}-${i}`}>
                  {item.name} × {item.qty} —{" "}
                  {formatPrice(item.priceCents * item.qty)}
                </p>
              ))}
            </div>
            {order.address && (
              <p className="text-xs text-muted-foreground mt-1 pt-1 border-t border-border/40">
                📍 {order.address}
              </p>
            )}
            <Badge
              variant="outline"
              className="mt-2 text-[10px] border-gold/40 text-gold-dim"
            >
              Order #{order.orderId}
            </Badge>
          </motion.div>
        ))}
      </div>
    </ScrollArea>
  );
}
