const { SubscriptionBundles } = require('./../models');

function initSubscriptionBundle(bundle, subscriptionPrice) {
  if (!bundle) return null;
  const result = {
    discount: bundle.discount,
    duration: bundle.duration,
    price:
      subscriptionPrice * bundle.duration * ((100 - bundle.discount) / 100),
  };
  if (bundle.id) result.id = bundle.id;
  return result;
}

async function fetchUserSubscriptionBundles(userId) {
  return SubscriptionBundles.findAll({
    where: { userId },
    order: [['duration', 'ASC']],
    raw: true,
  });
}

module.exports = {
  initSubscriptionBundle,
  fetchUserSubscriptionBundles,
};
