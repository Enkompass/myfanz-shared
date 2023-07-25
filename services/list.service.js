const {
  User,
  Lists,
  BaseLists,
  Connections,
  SubscriptionsDetails,
  CreatorSettings,
} = require('../models/index');
const { Sequelize } = require('sequelize');
const { NotFoundError } = require('../errors');
// const { getObjectSignedUrl } = require('myfanz-media/s3/awsClientS3');
const {
  fetchUserSubscriptionBundles,
  initSubscriptionBundle,
} = require('./creatorBundles.service');
const { Op } = Sequelize;

/**
 * Fetch user lists included refUser
 * @param userId {number} - user id (lists owner)
 * @param refUserId {number} - ref user id (included in lists)
 * @param active {boolean} [expired=false] - active flag
 * @returns {Promise<Model[]>}
 */
async function fetchUsersListsIncludedUser(userId, refUserId, active = true) {
  return Lists.findAll({
    where: { userId, type: { [Op.ne]: 'followers' } },
    attributes: ['id', 'name', 'type'],
    include: {
      model: Connections,
      as: 'connections',
      attributes: [],
      where: {
        userId: refUserId,
        expiredAt: { [Op[active ? 'is' : 'ne']]: null },
      },
      required: true,
    },
    // group: [Lists.id],
  });
}

/**
 * Fetch user list by list type
 * @param userId {number} - user id
 * @param type {string} - list type
 * @param raw {boolean} - row flag
 * @returns {Promise<Model>}
 */
async function fetchUserListByType(userId, type, raw = true) {
  return Lists.findOne({ where: { userId, type }, raw });
}

/**
 * Fetch users connection by list type
 * @param userId {number} - user id (list owner)
 * @param type {string} - list type
 * @param refUserId {number} - ref user id (user in connection)
 * @param active {boolean} [expired=false] - active flag
 * @returns {Promise<Model>}
 */
// async function checkUsersConnectionByListType(
//   userId,
//   type,
//   refUserId,
//   active = true
// ) {
//   return Lists.findOne({
//     where: { userId, type },
//     include: {
//       model: Connections,
//       as: 'connections',
//       attributes: ['userId'],
//       where: {
//         userId: refUserId,
//         expiredAt: { [Op[active ? 'is' : 'ne']]: null },
//       },
//       required: true,
//     },
//     // group: [Lists.id],
//   });
// }

/**
 * Fetch users connection by list type
 * @param userId {number} - user id (list owner)
 * @param type {string} - list type
 * @param refUserId {number} - ref user id (user in connection)
 * @param active {boolean} [expired=false] - active flag
 * @returns {Promise<Model>}
 */
async function checkUsersConnectionByList(
  userId,
  type,
  refUserId,
  active = true
) {
  return Lists.findOne({
    where: { userId, type },
    include: {
      model: Connections,
      as: 'connections',
      attributes: ['userId'],
      where: {
        userId: refUserId,
        expiredAt: { [Op[active ? 'is' : 'ne']]: null },
      },
      required: true,
    },
    // group: [Lists.id],
  });
}

/**
 * Fetch base list by type
 * @param type {string} - list type
 * @param raw {boolean} [raw=true] - raw flag
 * @returns {Promise<Model>}
 */
async function fetchBaseListByType(type, raw = true) {
  return BaseLists.findOne({ where: { type }, raw });
}

/**
 *
 * @param userId
 * @param slug
 * @returns {Promise<any>}
 */
// async function fetchUserList(userId, slug) {
//   const where = { userId };
//
//   if (!isNaN(Number(slug))) {
//     where.id = slug;
//   } else if (typeof slug === 'string' && (await fetchBaseListByType(slug)))
//     where.type = slug;
//   else throw new NotFoundError('List not found');
//
//   let list = await Lists.findOne({
//     // raw: true,
//     where,
//     include: [
//       {
//         model: Connections,
//         as: 'connections',
//         attributes: ['userId'],
//         include: {
//           hooks: true,
//           model: User,
//           as: 'user',
//           attributes: ['id', 'username', 'displayName', 'avatar', 'cover'],
//         },
//       },
//       // { model: BaseLists, as: 'basicLists' /*attributes: ['id']*/ },
//     ],
//   });
//
//   list = list.dataValues;
//   let connections = list.connections;
//
//   console.log('connections ', connections);
//
//   for (let j = 0; j < connections.length; j++) {
//     let connection = connections[j].dataValues;
//     const user = connection.user.dataValues;
//     connection = { ...connection, ...user };
//     if (user.avatar) {
//       connection.avatar = await getObjectSignedUrl(user.avatar);
//     } else connection.avatar = null;
//
//     if (user.cover) {
//       connection.cover = await getObjectSignedUrl(user.cover);
//     } else connection.cover = null;
//
//     connection.subscribed = Boolean(
//       await checkUsersConnectionByList(userId, 'following', user.id)
//     );
//
//     connection.lists = await fetchUsersListsIncludedUser(userId, user.id);
//
//     delete connection.user;
//     connections[j] = connection;
//   }
//
//   list.connections = connections;
//   list.totalConnections = connections.length;
//   return list;
// }

/**
 * Fetch all users in connection by list type
 * @param userId
 * @param slug
 * @param active {boolean} [expired=false] - active flag
 * @returns {Promise<any>}
 */
async function fetchUsersInConnection(userId, slug, active = true) {
  const where = { userId };

  if (!isNaN(Number(slug))) {
    where.id = slug;
  } else if (typeof slug === 'string' && (await fetchBaseListByType(slug)))
    where.type = slug;
  else throw new NotFoundError('List not found');

  let list = await Lists.findOne({
    // raw: true,
    where,
    include: [
      {
        model: Connections,
        as: 'connections',
        attributes: ['userId'],
        where: {
          expiredAt: { [Op[active ? 'is' : 'ne']]: null },
        },
      },
    ],
  });

  list = list.dataValues;
  let connections = list.connections;

  console.log('connections ', connections);

  list.users = [];

  for (let j = 0; j < connections.length; j++) {
    let connection = connections[j].dataValues;
    list.users.push(connection.userId);
  }

  delete list.connections;
  list.totalConnections = connections.length;
  return list;
}

/**
 * Fetch users active subscription
 * @param userId {number} - user id subscriber
 * @param toUserId {number} - user id to subscribe
 * @returns {Promise<any>}
 */
async function fetchActiveSubscription(userId, toUserId) {
  return await Connections.findOne({
    where: { userId: toUserId, expiredAt: { [Op.is]: null } },
    include: [
      {
        model: Lists,
        as: 'list',
        where: { userId, type: 'following' },
        required: true,
      },
      {
        model: SubscriptionsDetails,
        as: 'subscriptionDetails',
        where: { expiredAt: { [Op.is]: null } },
        required: true,
      },
      {
        hooks: true,
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'displayName', 'avatar', 'cover'],
      },
    ],
    raw: true,
  });
}

/**
 * Fetch users active subscription details
 * @param userId {number} - user id subscriber
 * @param refUserId {number} - user id to subscribe
 * @returns {Promise<{subscribed: boolean, currentSubscriptionPrice: number, subscribedAt: (string|boolean|null), subscriptionExpireAt: null}>}
 */
async function getUsersSubscriptionsDetails(userId, refUserId) {
  const activeSubscription =
    (await fetchActiveSubscription(userId, refUserId)) || {};

  console.log('activeSubscription ', activeSubscription);

  return {
    subscribed: !!activeSubscription.id,
    currentSubscriptionPrice:
      activeSubscription['subscriptionDetails.price'] || 0,
    subscriptionExpireAt:
      activeSubscription['subscriptionDetails.expireAt'] || null,
    subscribedAt: activeSubscription['createdAt'] || null,
  };
}

/**
 * Get user subscription planes
 * @param userId {number} - user id
 * @returns {Promise<any>}
 */
async function getUserSubscriptionPlanes(userId) {
  const settings = await CreatorSettings.findOne({
    where: { userId: Number(userId) },
    raw: true,
  });

  const subscriptionBundles = await fetchUserSubscriptionBundles(userId);

  console.log('subscriptionBundles ', subscriptionBundles);
  console.log('settings ', settings);
  // console.log('subscriptions ', subscriptions);

  if (!settings) return {};

  return {
    subscriptionPrice: settings.subscriptionPrice,
    allowFreeSubscription: settings.allowFreeSubscription,
    subscriptionBundles: subscriptionBundles?.map((bundle) =>
      initSubscriptionBundle(bundle, settings.subscriptionPrice)
    ),
  };
}

module.exports = {
  fetchUsersListsIncludedUser,
  fetchUserListByType,
  // checkUsersConnectionByListType,
  // fetchUserList,
  checkUsersConnectionByList,
  fetchBaseListByType,
  fetchUsersInConnection,
  getUsersSubscriptionsDetails,
  getUserSubscriptionPlanes,
};
