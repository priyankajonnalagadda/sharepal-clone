import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [products, setProducts] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [cart, setCart] = useState([]);

  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  const [deliveryDate, setDeliveryDate] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [showDateBox, setShowDateBox] = useState(false);
  const [dateMessage, setDateMessage] = useState("");

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductBox, setShowProductBox] = useState(false);

  const [showCart, setShowCart] = useState(false);

  /* LOAD PRODUCTS */

  useEffect(() => {
    fetch("/product-list.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Unable to load product-list.json");
        }

        return response.json();
      })
      .then((data) => {
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.products)
          ? data.products
          : [];

        setProducts(list);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
      });
  }, []);

  /* FAVORITES */

  const toggleFavorite = (id) => {
    setFavorites((previous) => {
      if (previous.includes(id)) {
        return previous.filter((item) => item !== id);
      }

      return [...previous, id];
    });
  };

  /* DATES */

  const today = new Date().toISOString().split("T")[0];

  const formatDate = (date) => {
    if (!date) return "";

    const parts = date.split("-");

    if (parts.length !== 3) return date;

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const handleDeliveryChange = (value) => {
    setDeliveryDate(value);

    if (pickupDate && value && pickupDate < value) {
      setPickupDate("");
    }

    setDateMessage("");
  };

  const handleSelectDates = () => {
    if (!deliveryDate || !pickupDate) {
      setDateMessage(
        "Please select both delivery and pickup dates."
      );
      setShowDateBox(true);
      return;
    }

    if (pickupDate < deliveryDate) {
      setDateMessage(
        "Pickup date cannot be before delivery date."
      );
      return;
    }

    setDateMessage(
      `Rental dates selected: ${formatDate(
        deliveryDate
      )} - ${formatDate(pickupDate)}`
    );

    setShowDateBox(false);
  };

  /* RENTAL DAYS */

  const getRentalDays = () => {
    if (!deliveryDate || !pickupDate) {
      return 1;
    }

    const start = new Date(deliveryDate);
    const end = new Date(pickupDate);

    const difference = end.getTime() - start.getTime();

    const days = Math.ceil(
      difference / (1000 * 60 * 60 * 24)
    );

    return Math.max(days, 1);
  };

  const rentalDays = getRentalDays();

  /* CATEGORY IMAGES */

  const getCategoryImage = (...keywords) => {
    const product = products.find((item) => {
      const name = String(item.name || "").toLowerCase();

      return keywords.some((keyword) =>
        name.includes(keyword.toLowerCase())
      );
    });

    return product?.image || "";
  };

  const categories = [
    {
      name: "All",
      image: products[0]?.image || "",
    },
    {
      name: "GTA VI",
      image: getCategoryImage("gta", "grand theft auto"),
    },
    {
      name: "PS5 Console",
      image: getCategoryImage("ps5", "playstation"),
    },
    {
      name: "Xbox Console",
      image: getCategoryImage("xbox"),
    },
    {
      name: "VR",
      image: getCategoryImage("oculus", "meta quest", "vr"),
    },
  ];

  /* FILTER PRODUCTS */

  const filteredProducts = products.filter((product) => {
    const name = String(product.name || "").toLowerCase();

    let matchesCategory = true;

    if (activeCategory === "GTA VI") {
      matchesCategory =
        name.includes("gta") ||
        name.includes("grand theft auto");
    }

    if (activeCategory === "PS5 Console") {
      matchesCategory =
        name.includes("ps5") ||
        name.includes("playstation");
    }

    if (activeCategory === "Xbox Console") {
      matchesCategory = name.includes("xbox");
    }

    if (activeCategory === "VR") {
      matchesCategory =
        name.includes("oculus") ||
        name.includes("meta quest") ||
        name.includes("vr");
    }

    const search = searchText.trim().toLowerCase();

    const matchesSearch =
      !search || name.includes(search);

    return matchesCategory && matchesSearch;
  });

  /* PRODUCT MODAL */

  const openProduct = (product) => {
    setSelectedProduct(product);
    setShowProductBox(true);
  };

  /* CART */

  const addToCart = (product) => {
    setCart((previous) => {
      const existing = previous.find(
        (item) => item.id === product.id
      );

      if (existing) {
        return previous.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: (item.quantity || 1) + 1,
              }
            : item
        );
      }

      return [
        ...previous,
        {
          ...product,
          quantity: 1,
        },
      ];
    });

    setShowProductBox(false);
  };

  const increaseQuantity = (id) => {
    setCart((previous) =>
      previous.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: (item.quantity || 1) + 1,
            }
          : item
      )
    );
  };

  const decreaseQuantity = (id) => {
    setCart((previous) =>
      previous
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: (item.quantity || 1) - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (id) => {
    setCart((previous) =>
      previous.filter((item) => item.id !== id)
    );
  };

  const getCartItemTotal = (item) => {
    const price = Number(item.per_day_rent) || 0;

    return (
      price *
      rentalDays *
      (item.quantity || 1)
    );
  };

  const cartTotal = cart.reduce(
    (total, item) =>
      total + getCartItemTotal(item),
    0
  );

  return (
    <div className="app">

      {/* HEADER */}

      <header className="header">

        <div className="logo">
          Share<span>Pal</span>
        </div>

        <div className="search-bar">

          <button className="location-btn">
            <span className="location-icon">●</span>
            <span>Bangalore</span>
            <span className="down-arrow">⌄</span>
          </button>

          <button
            className="date-header-button"
            onClick={() => setShowDateBox(true)}
          >
            <span className="calendar-icon">▣</span>

            <span>
              {deliveryDate
                ? formatDate(deliveryDate)
                : "Delivery Date"}
            </span>
          </button>

          <button
            className="date-header-button"
            onClick={() => setShowDateBox(true)}
          >
            <span className="calendar-icon">▣</span>

            <span>
              {pickupDate
                ? formatDate(pickupDate)
                : "Pickup Date"}
            </span>
          </button>

          <button
            className="select-btn"
            onClick={handleSelectDates}
          >
            <span className="calendar-icon">▣</span>
            <span>Select</span>
          </button>

        </div>

        <div className="header-actions">

          <button
            className="header-icon"
            onClick={() =>
              setSearchOpen((previous) => !previous)
            }
            aria-label="Search"
          >
            🔍
          </button>

          <button
            className="header-icon cart-button"
            onClick={() => setShowCart(true)}
            aria-label="Cart"
          >
            🛒

            {cart.length > 0 && (
              <span className="cart-count">
                {cart.length}
              </span>
            )}
          </button>

          <div className="user-icon">
            👤
          </div>

          <strong>Hi, Login</strong>

        </div>

      </header>

      {/* SEARCH */}

      {searchOpen && (
        <div className="search-panel">

          <div className="search-panel-inner">

            <span className="search-panel-icon">
              🔍
            </span>

            <input
              autoFocus
              type="text"
              placeholder="Search gaming gadgets..."
              value={searchText}
              onChange={(event) =>
                setSearchText(event.target.value)
              }
            />

            {searchText && (
              <button
                className="clear-search"
                onClick={() => setSearchText("")}
              >
                ×
              </button>
            )}

          </div>

          {searchText && (
            <div className="search-result-text">
              {filteredProducts.length}{" "}
              {filteredProducts.length === 1
                ? "product"
                : "products"}{" "}
              found for "
              <strong>{searchText}</strong>"
            </div>
          )}

        </div>
      )}

      {/* DATE MODAL */}

      {showDateBox && (
        <div
          className="date-overlay"
          onClick={() => setShowDateBox(false)}
        >

          <div
            className="date-box"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              className="close-date"
              onClick={() => setShowDateBox(false)}
            >
              ×
            </button>

            <div className="modal-calendar">
              📅
            </div>

            <h2>Select Rental Dates</h2>

            <p>
              Choose when you want to receive
              and return your rental.
            </p>

            <div className="date-fields">

              <label>
                Delivery Date

                <input
                  type="date"
                  min={today}
                  value={deliveryDate}
                  onChange={(event) =>
                    handleDeliveryChange(
                      event.target.value
                    )
                  }
                />
              </label>

              <label>
                Pickup Date

                <input
                  type="date"
                  min={deliveryDate || today}
                  value={pickupDate}
                  onChange={(event) => {
                    setPickupDate(event.target.value);
                    setDateMessage("");
                  }}
                />
              </label>

            </div>

            {dateMessage && (
              <div
                className={
                  dateMessage.includes("selected")
                    ? "date-success"
                    : "date-error"
                }
              >
                {dateMessage}
              </div>
            )}

            <button
              className="confirm-dates"
              onClick={handleSelectDates}
            >
              Confirm Dates
            </button>

          </div>

        </div>
      )}

      {/* PRODUCT MODAL */}

      {showProductBox && selectedProduct && (
        <div
          className="product-overlay"
          onClick={() => setShowProductBox(false)}
        >

          <div
            className="product-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              className="product-modal-close"
              onClick={() => setShowProductBox(false)}
            >
              ×
            </button>

            <div className="modal-product-image">

              {selectedProduct.image ? (
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                />
              ) : (
                <div>No image</div>
              )}

            </div>

            <div className="modal-product-details">

              <h2>{selectedProduct.name}</h2>

              <div className="modal-rating">

                <span className="stars">
                  ★★★★★
                </span>

                <span>
                  {selectedProduct.rating || "4.5"}
                </span>

                <span className="rating-dot">
                  •
                </span>

                <span>
                  {selectedProduct.booked_count || 0}{" "}
                  bookings
                </span>

              </div>

              <div className="modal-divider"></div>

              <div className="modal-price">

                <span>Price per day</span>

                <strong>
                  ₹{selectedProduct.per_day_rent || 0}
                </strong>

              </div>

              <div className="modal-dates">

                <div>
                  <span>Delivery</span>

                  <strong>
                    {deliveryDate
                      ? formatDate(deliveryDate)
                      : "Not selected"}
                  </strong>
                </div>

                <div>
                  <span>Pickup</span>

                  <strong>
                    {pickupDate
                      ? formatDate(pickupDate)
                      : "Not selected"}
                  </strong>
                </div>

              </div>

              <div className="rental-summary">

                <div>
                  <span>Rental duration</span>

                  <strong>
                    {rentalDays}{" "}
                    {rentalDays === 1
                      ? "day"
                      : "days"}
                  </strong>
                </div>

                <div>
                  <span>Estimated total</span>

                  <strong>
                    ₹
                    {(Number(
                      selectedProduct.per_day_rent
                    ) || 0) * rentalDays}
                  </strong>
                </div>

              </div>

              <button
                className="modal-select-date"
                onClick={() => {
                  setShowProductBox(false);
                  setShowDateBox(true);
                }}
              >
                {deliveryDate && pickupDate
                  ? "Change Rental Dates"
                  : "Select Rental Dates"}
              </button>

              <button
                className="modal-add-cart"
                onClick={() =>
                  addToCart(selectedProduct)
                }
              >
                Add to Cart
              </button>

            </div>

          </div>

        </div>
      )}

      {/* CART MODAL */}

      {showCart && (
        <div
          className="cart-overlay"
          onClick={() => setShowCart(false)}
        >

          <div
            className="cart-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="cart-header">

              <div>
                <h2>Your Cart</h2>

                <span>
                  {cart.length}{" "}
                  {cart.length === 1
                    ? "item"
                    : "items"}
                </span>
              </div>

              <button
                className="cart-close"
                onClick={() => setShowCart(false)}
              >
                ×
              </button>

            </div>

            {cart.length === 0 ? (

              <div className="empty-cart">

                <div className="empty-cart-icon">
                  🛒
                </div>

                <h3>Your cart is empty</h3>

                <p>
                  Add gaming gadgets to continue.
                </p>

                <button
                  onClick={() => setShowCart(false)}
                >
                  Browse Products
                </button>

              </div>

            ) : (

              <>

                <div className="cart-items">

                  {cart.map((item) => (

                    <div
                      className="cart-item"
                      key={item.id}
                    >

                      <div className="cart-item-image">

                        <img
                          src={item.image}
                          alt={item.name}
                        />

                      </div>

                      <div className="cart-item-info">

                        <h3>{item.name}</h3>

                        <span className="cart-item-price">
                          ₹{item.per_day_rent}/day
                        </span>

                        <span className="cart-item-dates">
                          {deliveryDate &&
                          pickupDate
                            ? `${formatDate(
                                deliveryDate
                              )} - ${formatDate(
                                pickupDate
                              )}`
                            : "Select rental dates"}
                        </span>

                        <div className="cart-item-bottom">

                          <div className="quantity">

                            <button
                              onClick={() =>
                                decreaseQuantity(
                                  item.id
                                )
                              }
                            >
                              −
                            </button>

                            <span>
                              {item.quantity || 1}
                            </span>

                            <button
                              onClick={() =>
                                increaseQuantity(
                                  item.id
                                )
                              }
                            >
                              +
                            </button>

                          </div>

                          <strong>
                            ₹
                            {getCartItemTotal(item)}
                          </strong>

                        </div>

                        <button
                          className="remove-item"
                          onClick={() =>
                            removeFromCart(item.id)
                          }
                        >
                          Remove
                        </button>

                      </div>

                    </div>

                  ))}

                </div>

                <div className="cart-summary">

                  <div>
                    <span>Rental duration</span>

                    <strong>
                      {rentalDays}{" "}
                      {rentalDays === 1
                        ? "day"
                        : "days"}
                    </strong>
                  </div>

                  <div className="cart-total">

                    <span>Total</span>

                    <strong>
                      ₹{cartTotal}
                    </strong>

                  </div>

                  <button className="checkout-button">
                    Proceed to Checkout
                  </button>

                </div>

              </>

            )}

          </div>

        </div>
      )}

      {/* NAVIGATION */}

      <nav className="top-nav">

        <button className="top-nav-item">
          Photography
        </button>

        <button className="top-nav-item active-nav">
          Gaming
        </button>

        <button className="top-nav-item">
          Outdoor
        </button>

        <button className="top-nav-item">
          Entertainment
        </button>

      </nav>

      {/* PAGE */}

      <div className="page-layout">

        {/* SIDEBAR */}

        <aside className="sidebar">

          {categories.map((category) => {

            const isActive =
              activeCategory === category.name;

            return (
              <button
                key={category.name}
                className={`side-category ${
                  isActive
                    ? "active-side"
                    : ""
                }`}
                onClick={() =>
                  setActiveCategory(category.name)
                }
              >

                <div className="category-image">

                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                    />
                  ) : (
                    <span className="all-icon">
                      🎮
                    </span>
                  )}

                </div>

                <span>{category.name}</span>

              </button>
            );
          })}

        </aside>

        {/* CONTENT */}

        <main className="content">

          {/* HERO */}

          <section className="hero">

            <div className="hero-left-image">

              {products[0]?.image && (
                <img
                  src={products[0].image}
                  alt=""
                />
              )}

            </div>

            <div className="hero-text">

              <h1>Gaming Consoles</h1>

              <p>
                Rent the latest gaming gadgets
                from <strong>SharePal</strong> PS5,
                Xbox,
                <br />
                Oculus VR, Racing Wheel on rent.
              </p>

              <div className="brands">

                <span>◉ XBOX</span>

                <span className="brand-divider">
                  |
                </span>

                <span>◉ PS5</span>

                <span className="brand-divider">
                  |
                </span>

                <span>◉ Meta</span>

              </div>

            </div>

            <div className="hero-right-image">

              {products[1]?.image && (
                <img
                  src={products[1].image}
                  alt=""
                />
              )}

            </div>

          </section>

          {/* TITLE */}

          <div className="section-heading">

            <h2>
              Gaming Gadgets On Rent
            </h2>

            <span>
              Total items:{" "}
              {filteredProducts.length} items
            </span>

          </div>

          {/* PRODUCTS */}

          <section className="product-grid">

            {loading ? (

              <div className="loading">
                Loading products...
              </div>

            ) : filteredProducts.length === 0 ? (

              <div className="no-products">

                <div className="no-products-icon">
                  🔍
                </div>

                <h3>No products found</h3>

                <p>
                  Try another search term.
                </p>

                <button
                  onClick={() => {
                    setSearchText("");
                    setActiveCategory("All");
                  }}
                >
                  View All Products
                </button>

              </div>

            ) : (

              filteredProducts.map(
                (product, index) => {

                  const productId =
                    product.id !== undefined
                      ? product.id
                      : index;

                  const favorite =
                    favorites.includes(productId);

                  return (
                    <article
                      className="product-card"
                      key={productId}
                    >

                      <div className="product-image">

                        {product.tag && (
                          <span
                            className={`tag ${
                              String(
                                product.tag
                              ).toLowerCase() === "new"
                                ? "new-tag"
                                : ""
                            }`}
                          >
                            {product.tag}
                          </span>
                        )}

                        <button
                          className={`heart ${
                            favorite
                              ? "heart-active"
                              : ""
                          }`}
                          onClick={() =>
                            toggleFavorite(productId)
                          }
                          aria-label="Favorite"
                        >
                          {favorite ? "♥" : "♡"}
                        </button>

                        {product.image ? (
                          <img
                            src={product.image}
                            alt={
                              product.name ||
                              "Gaming product"
                            }
                            loading="lazy"
                          />
                        ) : (
                          <div className="no-image">
                            No image
                          </div>
                        )}

                      </div>

                      <div className="product-info">

                        <h3 title={product.name}>
                          {product.name ||
                            "Gaming Product"}
                        </h3>

                        <div className="divider"></div>

                        <div className="price-row">

                          <div className="price-info">

                            <p>
                              Select Dates to view
                              <br />
                              price
                            </p>

                            <strong>
                              ₹
                              {product.per_day_rent ||
                                0}
                            </strong>

                          </div>

                          <button
                            className="add-btn"
                            onClick={() =>
                              openProduct(product)
                            }
                            aria-label="View product"
                          >
                            +
                          </button>

                        </div>

                      </div>

                    </article>
                  );
                }
              )

            )}

          </section>

          {/* PARTNER BANNER */}

          <section className="partner-banner">

            <div className="partner-content">

              <h2>
                Become an{" "}
                <span>Asset Partner.</span>{" "}
                Earn Monthly.
              </h2>

              <div className="benefits">

                <div className="benefit-card">
                  <b>
                    Monthly
                    <br />
                    Earnings
                  </b>

                  <small>
                    From rental assets
                  </small>
                </div>

                <div className="benefit-card">
                  <b>
                    Upto
                    <br />
                    ₹10,000
                  </b>

                  <small>
                    Instant Wallet credits
                  </small>
                </div>

                <div className="benefit-card">
                  <b>10% Off</b>

                  <small>
                    Exclusive discount
                    when you rent
                  </small>
                </div>

                <div className="benefit-card">
                  <b>
                    Get 10%
                    <br />
                    Cashback
                  </b>

                  <small>
                    On every order
                  </small>
                </div>

              </div>

            </div>

            <button className="know-more">
              Know More ↗
            </button>

          </section>

          {/* LOWER BANNER */}

          <section className="earn-banner">

            <div className="earn-banner-content">

              <h2>
                Rent Out Your Gear on SharePal
              </h2>

              <button>
                Earn With Us ↗
              </button>

            </div>

          </section>

        </main>

      </div>

      {/* FLOATING DATE */}

      <button
        className="date-floating"
        onClick={() => setShowDateBox(true)}
      >

        <span className="floating-calendar">
          ▣
        </span>

        {deliveryDate && pickupDate
          ? `${formatDate(
              deliveryDate
            )} - ${formatDate(pickupDate)}`
          : "Select rental dates to view prices"}

      </button>

      {/* CHAT */}

      <button
        className="chat-button"
        aria-label="Chat"
      >
        •••
      </button>

    </div>
  );
}

export default App;