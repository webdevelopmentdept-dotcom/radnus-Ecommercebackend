exports.addToCart = async (req, res) => {
  const { productId, quantity } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  // 🔥 ROLE BASED PRICE (SERVER SIDE – SAFE)
  let price = product.prices.customer;

  if (req.user.role === "dealer") price = product.prices.dealer;
  if (req.user.role === "distributor") price = product.prices.distributor;

  const cartItem = {
    product: product._id,
    name: product.name,
    price,                 // ✅ FINAL PRICE
    image: product.images[0].url,
    stock: product.stock,
    quantity,
  };

  res.status(200).json({
    success: true,
    cartItem,
  });
};
