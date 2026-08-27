import { useEffect, useMemo, useState } from "react";
import { Route, Switch, useLocation } from "wouter";
import { coreRegistry, type CartItem, type DeviceViewport, type OrderInput, type OwnedTemplateContract, type Product, type StorePage, type TemplateRuntimeProps } from "../core/registry";

export function Storefront({ contract, preview = false, device = "desktop" }: { contract: OwnedTemplateContract; preview?: boolean; device?: DeviceViewport }) {
  const { store: config, template, plugins } = coreRegistry;
  const [cart, setCart] = useState<CartItem[]>([]);
  const [catalog, setCatalog] = useState<Product[]>(config.catalog);
  const [query, setQuery] = useState("");
  const [location, navigate] = useLocation();
  useEffect(() => { const controller = new AbortController(); void coreRegistry.commerce.api.catalog().then(products => { if (!controller.signal.aborted && products.length) setCatalog(products); }).catch(() => undefined); return () => controller.abort(); }, []);
  const liveConfig = useMemo(() => ({ ...config, catalog }), [catalog, config]);
  const filtered = useMemo(() => catalog.filter(product => `${product.name} ${product.category} ${product.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase())), [catalog, query]);
  const add = (product: Product, option = product.options[0]?.values[0] ?? "Standard") => setCart(previous => {
    const current = previous.find(item => item.product.id === product.id && item.option === option);
    return current ? previous.map(item => item === current ? { ...item, quantity: item.quantity + 1 } : item) : [...previous, { product, option, quantity: 1 }];
  });
  const changeQuantity = (productId: string, quantity: number) => setCart(previous => previous.flatMap(item => item.product.id === productId ? quantity > 0 ? [{ ...item, quantity }] : [] : [item]));
  const total = cart.reduce((sum, item) => sum + item.product.priceDzd * item.quantity, 0);
  const featured = catalog[0] ?? config.catalog[0]!;
  const currentProduct = catalog.find(item => item.slug === location.split("/").pop()) ?? featured;
  const has = coreRegistry.plugins.has;
  const Runtime = contract.Runtime;
  const placeOrder = async (details: Omit<OrderInput, "items">) => coreRegistry.commerce.api.order({ ...details, items: cart.map(item => ({ productId: item.product.id, quantity: item.quantity, option: item.option })) });
  const createRuntimeProps = (page: StorePage): TemplateRuntimeProps => ({ page, config: liveConfig, template, plugins: plugins.all, device, cart, filtered, query, setQuery, currentProduct, featured, total, add, changeQuantity, placeOrder, navigate, has });
  const render = (page: StorePage) => () => <Runtime {...createRuntimeProps(page)} />;

  return <div className={`store template-${template.id} device-${device}`} data-owned-template={contract.marker} data-device-contract={contract.devices[device]}>
    <Switch>
      <Route path="/" component={render("home")} />
      <Route path="/catalog" component={render("catalog")} />
      <Route path="/search" component={render("search")} />
      <Route path="/product/:slug" component={render("product")} />
      <Route path="/cart" component={render("cart")} />
      <Route path="/checkout" component={render("checkout")} />
      <Route path="/login" component={render("login")} />
      <Route path="/register" component={render("register")} />
      <Route path="/tracking" component={render("tracking")} />
      <Route path="/success" component={render("success")} />
      <Route path="/empty" component={render("empty")} />
      <Route component={render("not-found")} />
    </Switch>
    {preview && <div className="preview-safe">Safe preview · No orders, inventory changes or notifications are sent.</div>}
  </div>;
}
