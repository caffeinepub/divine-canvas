import Map "mo:core/Map";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";

actor {
  type Product = {
    id : Nat;
    name : Text;
    description : Text;
    priceCents : Nat;
    category : Text;
  };

  type CartItem = {
    productId : Nat;
    quantity : Nat;
  };

  type Order = {
    id : Nat;
    customerName : Text;
    customerEmail : Text;
    items : [CartItem];
    totalAmountCents : Nat;
  };

  module Product {
    public func compare(a : Product, b : Product) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  let nextProductId = Map.empty<Nat, ()>();
  let nextOrderId = Map.empty<Nat, ()>();
  let products = Map.empty<Nat, Product>();
  let orders = Map.empty<Nat, Order>();

  var currentProductId = 0;
  var currentOrderId = 0;

  public shared ({ caller }) func addProduct(name : Text, description : Text, priceCents : Nat, category : Text) : async Nat {
    let productId = currentProductId;
    nextProductId.add(productId, ());
    currentProductId += 1;

    let product : Product = {
      id = productId;
      name;
      description;
      priceCents;
      category;
    };

    products.add(productId, product);
    productId;
  };

  public query ({ caller }) func getAllProducts() : async [Product] {
    products.values().toArray().sort();
  };

  public shared ({ caller }) func placeOrder(customerName : Text, customerEmail : Text, items : [CartItem]) : async Nat {
    let orderId = currentOrderId;
    nextOrderId.add(orderId, ());
    currentOrderId += 1;

    var totalAmount = 0;

    for (item in items.values()) {
      switch (products.get(item.productId)) {
        case (?product) {
          totalAmount += product.priceCents * item.quantity;
        };
        case (null) { Runtime.trap("Invalid product ID in cart") };
      };
    };

    let order : Order = {
      id = orderId;
      customerName;
      customerEmail;
      items;
      totalAmountCents = totalAmount;
    };

    orders.add(orderId, order);
    orderId;
  };
};
