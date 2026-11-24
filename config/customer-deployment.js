module.exports = function assertCustomerConfiguration() {
  const required =
    process.env.NEOLA_CUSTOMER_DEPLOYMENT === "true" ||
    require("node:fs").existsSync(
      require("node:path").join(__dirname, "../customer-policy.json"),
    );
  if (
    required &&
    (process.env.CONTROL_PLANE_MODE !== "subscription" ||
      !process.env.IAM_API_URL)
  )
    throw Error(
      "Customer storage distributions require subscription enforcement through IAM",
    );
};
