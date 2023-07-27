const {
  User,
  Lists,
  BaseLists,
  Connections,
  SubscriptionsDetails,
  CreatorSettings,
} = require('../models/index');
const { Sequelize } = require('sequelize');
const { NotFoundError, ConflictError } = require('../errors');
// const { getObjectSignedUrl } = require('myfanz-media/s3/awsClientS3');
const {
  fetchUserSubscriptionBundles,
  initSubscriptionBundle,
} = require('./creatorBundles.service');
const { union } = require('lodash');
const { fetchReportedUser } = require('./report.service');
const { Op } = Sequelize;

/**
 * Fetch user lists included refUser
 * @param userId {number} - user id (lists owner)
 * @param refUserId {number} - ref user id (included in lists)
 * @param active {boolean} [active=true] - active flag
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
 * @param active {boolean} [active=false] - active flag
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
 * @param active {boolean} [active=false] - active flag
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
 * @param active {boolean} [active=false] - active flag
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

/**
 * Validate users blocking
 * @param userId {number} - user id
 * @param refUserId {number} - ref user id
 * @param validateRestricted {boolean} [validateRestricted=false] - if passed true validate also restricted
 * @returns {Promise<void>}
 */
async function validateBlocking(userId, refUserId, validateRestricted = false) {
  if (await checkUsersConnectionByList(userId, 'blocked', refUserId))
    throw new ConflictError('Blocked user');

  if (await checkUsersConnectionByList(refUserId, 'blocked', userId))
    throw new ConflictError('You are blocked by this user');

  if (
    validateRestricted &&
    (await checkUsersConnectionByList(refUserId, 'restricted', userId))
  )
    throw new ConflictError('You are restricted by this user');
}

/**
 * Get all validation connections details with two users
 * @param userId {number} - user id
 * @param validateFor {number} - validate for user id
 * @returns {Promise<void>}
 */
async function fetchUsersConnectionsDetails(userId, validateFor) {
  const result = {
    ...(await getUsersSubscriptionsDetails(validateFor, userId)),
  };
  result.blocked = Boolean(
    await checkUsersConnectionByList(validateFor, 'blocked', userId)
  );
  result.blockedReversal = Boolean(
    await checkUsersConnectionByList(userId, 'blocked', validateFor)
  );

  result.restricted = Boolean(
    await checkUsersConnectionByList(validateFor, 'restricted', userId)
  );

  result.reported = Boolean(await fetchReportedUser(validateFor, userId));

  return result;
}

/**
 * Fetch unique users id-es which blocked by passed user or they blocked passed user
 * @param userId {number} - for user id
 * @param includeRestricted {boolean} [includeRestricted=false] - restricted flag,
 * if passed false in response will add also users which restricted passed user
 * @returns {Promise<any>}
 */
async function fetchNotAllowedUsers(userId, includeRestricted = false) {
  let blockedUsers = (
    await Connections.findAll({
      attributes: ['userId'],
      include: [
        {
          attributes: [],
          model: Lists,
          as: 'list',
          where: { userId, type: 'blocked' },
          required: true,
        },
      ],
      raw: true,
    })
  ).map((el) => el.userId);

  const expectedListTypes = ['blocked'];

  if (includeRestricted) {
    expectedListTypes.push('restricted');
  }

  const blockedFromUsers = (
    await Lists.findAll({
      attributes: ['Lists.userId'],
      where: { type: { [Op.in]: expectedListTypes } },
      include: [
        {
          attributes: [],
          model: Connections,
          as: 'connection',
          where: { userId },
          required: true,
        },
      ],
      raw: true,
      group: ['Lists.userId'],
    })
  ).map((el) => el.userId);

  console.log('blockedUsers ', blockedUsers);
  console.log('blockedFromUsers ', blockedFromUsers);

  return union(blockedUsers, blockedFromUsers) || [];
}

module.exports = {
  fetchUsersListsIncludedUser,
  fetchUserListByType,
  fetchActiveSubscription,
  fetchNotAllowedUsers,
  fetchUsersConnectionsDetails,
  // checkUsersConnectionByListType,
  // fetchUserList,
  checkUsersConnectionByList,
  fetchBaseListByType,
  fetchUsersInConnection,
  getUsersSubscriptionsDetails,
  getUserSubscriptionPlanes,
  validateBlocking,
};
