/**
 * Filter product price based on user role
 * @param {Object} product - full product object
 * @param {String} role - user role (customer | dealer | distributor)
 */
const filterProductForUser = (product, role = "customer") => {
  if (!product.prices) return product;

  let price = product.prices.customer;

  if (role === "dealer") price = product.prices.dealer;
  else if (role === "distributor") price = product.prices.distributor;

  delete product.prices;
  product.price = price;

  return product;
};

module.exports = filterProductForUser;


module.exports = filterProductForUser;
